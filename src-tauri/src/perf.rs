//! Built-in performance sampler.
//!
//! Emits a `perf-sample` Tauri event once per second with the running
//! process's CPU%, RSS, and (on Windows) per-engine GPU utilization.
//! The frontend HUD subscribes to this and renders a top-right overlay
//! when toggled with Ctrl+Shift+P.
//!
//! GPU on Windows is read via PDH counter `\GPU Engine(*)\Utilization
//! Percentage` filtered by our own PID — same source Task Manager
//! itself uses, so the numbers match what users see there. Other OSes
//! return None for GPU; we only ship to Windows for now.

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
    pub uptime_s: u64,
}

pub fn spawn(app: AppHandle) {
    let pid_u32 = std::process::id();
    std::thread::Builder::new()
        .name("kc-perf".into())
        .spawn(move || run_loop(app, pid_u32))
        .expect("failed to spawn perf thread");
}

fn run_loop(app: AppHandle, pid_u32: u32) {
    let pid = Pid::from_u32(pid_u32);
    let mut sys = System::new();
    let started = Instant::now();

    // sysinfo's CPU% is delta-based: the first refresh records a baseline,
    // the second yields a real number. Warm it up before the loop so the
    // first emitted sample isn't always 0.
    let refresh_kind = ProcessRefreshKind::new().with_cpu().with_memory();
    sys.refresh_processes_specifics(ProcessesToUpdate::Some(&[pid]), true, refresh_kind);
    std::thread::sleep(Duration::from_millis(200));

    #[cfg(target_os = "windows")]
    let mut gpu_query = match windows_gpu::GpuQuery::new(pid_u32) {
        Ok(q) => Some(q),
        Err(e) => {
            log::warn!("perf: GPU query unavailable: {e}");
            None
        }
    };

    loop {
        sys.refresh_processes_specifics(ProcessesToUpdate::Some(&[pid]), true, refresh_kind);
        let (cpu_pct, rss_mb) = sys
            .process(pid)
            .map(|p| (p.cpu_usage(), p.memory() / 1024 / 1024))
            .unwrap_or((0.0, 0));

        #[cfg(target_os = "windows")]
        let gpu = gpu_query.as_mut().map(|q| q.sample()).unwrap_or_default();
        #[cfg(not(target_os = "windows"))]
        let gpu = windows_gpu::GpuStats::default();

        let _ = app.emit(
            "perf-sample",
            PerfSample {
                cpu_pct,
                rss_mb,
                gpu_pct: gpu.total,
                gpu_3d: gpu.three_d,
                gpu_compute: gpu.compute,
                gpu_copy: gpu.copy,
                uptime_s: started.elapsed().as_secs(),
            },
        );

        std::thread::sleep(Duration::from_secs(1));
    }
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
    use std::collections::HashMap;
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
        pid_prefix: String,
        primed: bool,
    }

    impl GpuQuery {
        pub fn new(pid: u32) -> Result<Self, String> {
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
                    pid_prefix: format!("pid_{pid}_"),
                    primed: false,
                })
            }
        }

        pub fn sample(&mut self) -> GpuStats {
            unsafe {
                if PdhCollectQueryData(self.hquery) as u32 != ERROR_SUCCESS {
                    return GpuStats::default();
                }
                // Utilization counters need two collects to compute the
                // rate. The first sample after construction is a
                // baseline only — return zeros until the second tick.
                if !self.primed {
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

                // Sum utilizations across all engine instances of the
                // same engine type for our PID. Then engtype-specific
                // breakdown + a "headline" total = max engtype, which
                // is what Windows Task Manager shows.
                let mut by_engtype: HashMap<String, f64> = HashMap::new();
                for item in items {
                    if item.FmtValue.CStatus != PDH_CSTATUS_VALID_DATA {
                        continue;
                    }
                    let name = wide_to_string(item.szName);
                    if !name.starts_with(&self.pid_prefix) {
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

    // Safety: the underlying handles are owned and not shared across
    // threads. The query lives on the kc-perf thread for the lifetime
    // of the process. Sync isn't needed but the App emit path doesn't
    // touch it anyway.
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
}
