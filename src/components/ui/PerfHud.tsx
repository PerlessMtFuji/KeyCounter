import { useEffect, useRef, useState } from "react";
import { api, isTauri, type PerfSample } from "@/lib/api";

// Built-in performance overlay. Toggled by Ctrl+Shift+P (handled in App).
// Subscribes directly to backend `perf-sample` events and runs its own
// requestAnimationFrame loop for the in-process FPS / frame-time
// numbers. Deliberately keeps state in refs + setState only at update
// time (every 30 frames) so the HUD itself doesn't dominate the very
// metrics it's measuring.

interface RolledStats {
  current: number;
  avg60: number;
  max60: number;
}

function rollingFromSamples(values: number[]): RolledStats {
  if (values.length === 0) return { current: 0, avg60: 0, max60: 0 };
  const current = values[values.length - 1] ?? 0;
  const window = values.slice(-60);
  const avg60 = window.reduce((a, b) => a + b, 0) / window.length;
  const max60 = Math.max(...window);
  return { current, avg60, max60 };
}

function color(pct: number, warn: number, danger: number): string {
  if (pct >= danger) return "text-rose-300";
  if (pct >= warn) return "text-amber-300";
  return "text-emerald-300";
}

export function PerfHud() {
  const [latest, setLatest] = useState<PerfSample | null>(null);
  const cpuRef = useRef<number[]>([]);
  const gpuRef = useRef<number[]>([]);
  const ramRef = useRef<number[]>([]);
  const [stats, setStats] = useState<{
    cpu: RolledStats;
    gpu: RolledStats;
    ram: RolledStats;
  }>({
    cpu: { current: 0, avg60: 0, max60: 0 },
    gpu: { current: 0, avg60: 0, max60: 0 },
    ram: { current: 0, avg60: 0, max60: 0 },
  });
  const [fps, setFps] = useState(0);
  const [frameP95, setFrameP95] = useState(0);

  useEffect(() => {
    if (!isTauri()) return;
    let mounted = true;
    let unl: (() => void) | null = null;
    api
      .onPerfSample((s) => {
        if (!mounted) return;
        setLatest(s);
        cpuRef.current.push(s.cpu_pct);
        gpuRef.current.push(s.gpu_pct ?? 0);
        ramRef.current.push(s.rss_mb);
        if (cpuRef.current.length > 120) cpuRef.current.shift();
        if (gpuRef.current.length > 120) gpuRef.current.shift();
        if (ramRef.current.length > 120) ramRef.current.shift();
        setStats({
          cpu: rollingFromSamples(cpuRef.current),
          gpu: rollingFromSamples(gpuRef.current),
          ram: rollingFromSamples(ramRef.current),
        });
      })
      .then((u) => {
        if (mounted) unl = u;
        else u();
      });
    return () => {
      mounted = false;
      unl?.();
    };
  }, []);

  // FPS / frame-time via rAF. Recompute stats every 30 frames to keep
  // setState rate low.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const frames: number[] = [];
    let count = 0;
    const tick = (t: number) => {
      const dt = t - last;
      last = t;
      frames.push(dt);
      if (frames.length > 120) frames.shift();
      count++;
      if (count % 30 === 0 && frames.length > 0) {
        const sorted = [...frames].sort((a, b) => a - b);
        const p95Index = Math.min(
          sorted.length - 1,
          Math.floor(sorted.length * 0.95),
        );
        const p95 = sorted[p95Index] ?? 0;
        const avg = frames.reduce((a, b) => a + b, 0) / frames.length;
        setFps(avg > 0 ? Math.round(1000 / avg) : 0);
        setFrameP95(p95);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const inTauri = isTauri();
  const gpuAvail = latest?.gpu_pct !== null && latest?.gpu_pct !== undefined;

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[60] w-72 rounded-xl border border-white/10 bg-black/80 p-3 font-mono text-[10px] leading-tight text-zinc-300 shadow-2xl">
      <div className="mb-2 flex items-center justify-between text-[9px] tracking-[0.18em] text-zinc-400 uppercase">
        <span>Perf · Ctrl+Shift+P</span>
        {!inTauri && <span className="text-amber-300">browser</span>}
      </div>

      <Row
        label="CPU"
        unit="%"
        stats={stats.cpu}
        precision={1}
        warn={10}
        danger={20}
      />
      {gpuAvail ? (
        <Row
          label="GPU"
          unit="%"
          stats={stats.gpu}
          precision={1}
          warn={8}
          danger={18}
          breakdown={
            latest
              ? {
                  "3D": latest.gpu_3d,
                  Cmp: latest.gpu_compute,
                  Cpy: latest.gpu_copy,
                }
              : undefined
          }
        />
      ) : (
        <div className="flex justify-between py-0.5">
          <span className="text-zinc-500">GPU</span>
          <span className="text-zinc-500">N/A (Windows only)</span>
        </div>
      )}
      <Row
        label="RAM"
        unit="MB"
        stats={stats.ram}
        precision={0}
        warn={150}
        danger={300}
      />

      <div className="mt-2 border-t border-white/[0.06] pt-2">
        <div className="flex justify-between py-0.5">
          <span className="text-zinc-500">FPS</span>
          <span className={color(60 - fps, 25, 45) + " tabular-nums"}>
            {fps}
          </span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-zinc-500">frame p95</span>
          <span
            className={
              color(frameP95, 20, 33) + " tabular-nums"
            }
          >
            {frameP95.toFixed(1)} ms
          </span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-zinc-500">uptime</span>
          <span className="tabular-nums text-zinc-400">
            {latest ? formatUptime(latest.uptime_s) : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

interface RowProps {
  label: string;
  unit: string;
  stats: RolledStats;
  precision: number;
  warn: number;
  danger: number;
  breakdown?: Record<string, number | null | undefined>;
}

function Row({
  label,
  unit,
  stats,
  precision,
  warn,
  danger,
  breakdown,
}: RowProps) {
  const cls = color(stats.current, warn, danger);
  return (
    <div className="py-0.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-zinc-500">{label}</span>
        <span className="tabular-nums text-zinc-500">
          avg {stats.avg60.toFixed(precision)} · max {stats.max60.toFixed(precision)}
        </span>
        <span className={`${cls} w-16 text-right tabular-nums font-semibold`}>
          {stats.current.toFixed(precision)} {unit}
        </span>
      </div>
      {breakdown && (
        <div className="mt-0.5 flex justify-end gap-3 text-[9px] text-zinc-500 tabular-nums">
          {Object.entries(breakdown).map(([k, v]) =>
            v !== null && v !== undefined ? (
              <span key={k}>
                {k}:{v.toFixed(1)}
              </span>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}

function formatUptime(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m < 60) return `${m}m${sec.toString().padStart(2, "0")}s`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h${mm.toString().padStart(2, "0")}m`;
}
