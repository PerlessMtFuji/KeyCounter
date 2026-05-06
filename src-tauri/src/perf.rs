//! Built-in performance sampler.
//!
//! Emits a `perf-sample` Tauri event once per second with own-process
//! CPU%, RSS, and (on Windows) per-engine GPU utilization — aggregated
//! over our entire process tree. Tauri 2 on Windows runs the UI inside
//! WebView2, which spawns `msedgewebview2.exe` child processes for the
//! browser host, renderer, GPU, and utility roles. Almost all of the
//! CPU/GPU cost lives in those children, not in the Rust process —
//! sampling the root PID alone gave us numbers an order of magnitude
//! lower than reality (System Informer / Task Manager aggregate the
//! tree).
//!
//! GPU on Windows is read via PDH counter `\GPU Engine(*)\Utilization
//! Percentage`, then filtered by the tree's PID set. Other OSes return
//! None for GPU.

use std::collections::HashSet;
use std::time::{Duration, Instant};

use serde::Serialize;
use sysinfo::{Pid, ProcessRefreshKind, ProcessesToUpdate, System};
use tauri::{AppHandle, Emitter};

#[derive(Serialize, Clone, Default)]
pub struct PerfSample {
    pub cpu_pct: f32,
    pub rss_mb: u64,
    pub gpu_pct: Option<f32>,
    pub gpu_3d: Option<f32>,
    pub gpu_compute: Option<f32>,
    pub gpu_copy: Option<f32>,
    pub process_count: u32,
    pub uptime_s: u64,
}

pub fn spawn(app: AppHandle) {
    let pid_u32 = std::process::id();
    std::thread::Builder::new()
        .name("kc-perf".into())
        .spawn(move || run_loop(app, pid_u32))
        .expect("failed to spawn perf thread");
}

fn run_loop(app: AppHandle, root_pid_u32: u32) {
    let root_pid = Pid::from_u32(root_pid_u32);
    let mut sys = System::new();
    let started = Instant::now();
    let refresh_kind = ProcessRefreshKind::new().with_cpu().with_memory();

    // Warm up. sysinfo CPU% is delta-based, so the very first refresh is a
    // baseline only — without this the first emitted sample is always 0%.
    sys.refresh_processes_specifics(ProcessesToUpdate::All, true, refresh_kind);
    std::thread::sleep(Duration::from_millis(200));

    #[cfg(target_os = "windows")]
    let mut gpu_query = match windows_gpu::GpuQuery::new() {
        Ok(q) => Some(q),
        Err(e) => {
            log::warn!("perf: GPU query unavailable: {e}");
            None
        }
    };

    loop {
        sys.refresh_processes_specifics(ProcessesToUpdate::All, true, refresh_kind);
        let tree = descendant_pids(&sys, root_pid);

        let mut cpu_pct = 0.0f32;
        let mut rss_mb = 0u64;
        for pid in &tree {
            if let Some(p) = sys.process(*pid) {
                cpu_pct += p.cpu_usage();
                rss_mb += p.memory() / 1024 / 1024;
            }
        }

        let pid_u32_set: HashSet<u32> = tree.iter().map(|p| p.as_u32()).collect();

        #[cfg(target_os = "windows")]
        let gpu = gpu_query
            .as_mut()
            .map(|q| q.sample(&pid_u32_set))
            .unwrap_or_default();
        #[cfg(not(target_os = "windows"))]
        let gpu = {
            let _ = &pid_u32_set;
            windows_gpu::GpuStats::default()
        };

        let _ = app.emit(
            "perf-sample",
            PerfSample {
                cpu_pct,
                rss_mb,
                gpu_pct: gpu.total,
                gpu_3d: gpu.three_d,
                gpu_compute: gpu.compute,
                gpu_copy: gpu.copy,
                process_count: tree.len() as u32,
                uptime_s: started.elapsed().as_secs(),
            },
        );

        std::thread::sleep(Duration::from_secs(1));
    }
}

/// BFS the parent-PID graph starting at `root` and return every PID that
/// transitively descends from it (including `root` itself). Stops growing
/// once an iteration adds no new entries.
fn descendant_pids(sys: &System, root: Pid) -> HashSet<Pid> {
    let mut all: HashSet<Pid> = HashSet::new();
    all.insert(root);
    loop {
        let mut grew = false;
        for (pid, proc) in sys.processes() {
            if let Some(parent) = proc.parent() {
                if all.contains(&parent) && !all.contains(pid) {
                    all.insert(*pid);
                    grew = true;
                }
            }
        }
        if !grew {
            break;
        }
    }
    all
}

#[cfg(not(target_os = "windows"))]
mod windows_gpu {
    #[derive(Default, Clone, Copy)]
    pub struct GpuStats {
        pub total: Option<f32>,
        pub three_d: Option<f32>,
        pub compute: Option<f32>,
        pub copy: Option<f32>,
    }
}

#[cfg(target_os = "windows")]
mod windows_gpu {
    use std::collections::{HashMap, HashSet};
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;

    use windows_sys::Win32::System::Performance::{
        PdhAddEnglishCounterW, PdhCloseQuery, PdhCollectQueryData, PdhGetFormattedCounterArrayW,
        PdhOpenQueryW, PDH_FMT_COUNTERVALUE_ITEM_W, PDH_FMT_DOUBLE,
    };

    const ERROR_SUCCESS: u32 = 0;
    const PDH_MORE_DATA: u32 = 0x800007D2;
    const PDH_CSTATUS_VALID_DATA: u32 = 0x0;

    #[derive(Default, Clone, Copy)]
    pub struct GpuStats {
        pub total: Option<f32>,
        pub three_d: Option<f32>,
        pub compute: Option<f32>,
        pub copy: Option<f32>,
    }

    pub struct GpuQuery {
        hquery: isize,
        hcounter: isize,
        primed: bool,
    }

    impl GpuQuery {
        pub fn new() -> Result<Self, String> {
            unsafe {
                let mut hquery: isize = 0;
                let r = PdhOpenQueryW(std::ptr::null(), 0, &mut hquery);
                if r as u32 != ERROR_SUCCESS {
                    return Err(format!("PdhOpenQueryW: 0x{r:x}"));
                }
                let path = wide("\\GPU Engine(*)\\Utilization Percentage");
                let mut hcounter: isize = 0;
                let r = PdhAddEnglishCounterW(hquery, path.as_ptr(), 0, &mut hcounter);
                if r as u32 != ERROR_SUCCESS {
                    PdhCloseQuery(hquery);
                    return Err(format!("PdhAddEnglishCounterW: 0x{r:x}"));
                }
                Ok(Self {
                    hquery,
                    hcounter,
                    primed: false,
                })
            }
        }

        pub fn sample(&mut self, pids: &HashSet<u32>) -> GpuStats {
            unsafe {
                if PdhCollectQueryData(self.hquery) as u32 != ERROR_SUCCESS {
                    return GpuStats::default();
                }
                if !self.primed {
                    // PDH utilization counters need two collects to compute
                    // the rate. Skip the very first read.
                    self.primed = true;
                    return GpuStats::default();
                }

                let mut buf_size: u32 = 0;
                let mut item_count: u32 = 0;
                let r = PdhGetFormattedCounterArrayW(
                    self.hcounter,
                    PDH_FMT_DOUBLE,
                    &mut buf_size,
                    &mut item_count,
                    std::ptr::null_mut(),
                );
                let r = r as u32;
                if r != PDH_MORE_DATA && r != ERROR_SUCCESS {
                    return GpuStats::default();
                }
                if buf_size == 0 || item_count == 0 {
                    return GpuStats::default();
                }
                let mut buf: Vec<u8> = vec![0; buf_size as usize];
                let r = PdhGetFormattedCounterArrayW(
                    self.hcounter,
                    PDH_FMT_DOUBLE,
                    &mut buf_size,
                    &mut item_count,
                    buf.as_mut_ptr() as *mut PDH_FMT_COUNTERVALUE_ITEM_W,
                );
                if r as u32 != ERROR_SUCCESS {
                    return GpuStats::default();
                }
                let items = std::slice::from_raw_parts(
                    buf.as_ptr() as *const PDH_FMT_COUNTERVALUE_ITEM_W,
                    item_count as usize,
                );

                let mut by_engtype: HashMap<String, f64> = HashMap::new();
                for item in items {
                    if item.FmtValue.CStatus != PDH_CSTATUS_VALID_DATA {
                        continue;
                    }
                    let name = wide_to_string(item.szName);
                    let pid = match extract_pid(&name) {
                        Some(p) => p,
                        None => continue,
                    };
                    if !pids.contains(&pid) {
                        continue;
                    }
                    let val = item.FmtValue.Anonymous.doubleValue;
                    if !val.is_finite() || val < 0.0 {
                        continue;
                    }
                    let engtype = name
                        .rsplit("_engtype_")
                        .next()
                        .unwrap_or("Other")
                        .to_string();
                    *by_engtype.entry(engtype).or_insert(0.0) += val;
                }

                let three_d = by_engtype.get("3D").copied();
                let compute = by_engtype.get("Compute").copied();
                let copy = by_engtype.get("Copy").copied();
                let headline = by_engtype.values().copied().fold(0f64, f64::max);

                GpuStats {
                    total: Some(headline as f32),
                    three_d: three_d.map(|v| v as f32),
                    compute: compute.map(|v| v as f32),
                    copy: copy.map(|v| v as f32),
                }
            }
        }
    }

    impl Drop for GpuQuery {
        fn drop(&mut self) {
            unsafe {
                PdhCloseQuery(self.hquery);
            }
        }
    }

    // Safety: handles are owned and only ever touched from the kc-perf
    // thread. Sync isn't required.
    unsafe impl Send for GpuQuery {}

    fn wide(s: &str) -> Vec<u16> {
        OsStr::new(s)
            .encode_wide()
            .chain(std::iter::once(0))
            .collect()
    }

    fn wide_to_string(p: *const u16) -> String {
        if p.is_null() {
            return String::new();
        }
        unsafe {
            let mut len = 0;
            while *p.add(len) != 0 {
                len += 1;
            }
            let slice = std::slice::from_raw_parts(p, len);
            String::from_utf16_lossy(slice)
        }
    }

    /// Parse the PID out of an instance name like
    /// `pid_12345_luid_0_1_phys_0_eng_2_engtype_3D`.
    fn extract_pid(instance: &str) -> Option<u32> {
        let rest = instance.strip_prefix("pid_")?;
        let end = rest.find('_')?;
        rest[..end].parse().ok()
    }
}
