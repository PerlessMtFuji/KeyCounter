import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { KeyboardHeatmap } from "@/components/heatmap/KeyboardHeatmap";
import { PunchCard } from "@/components/charts/PunchCard";
import { FingerLoad } from "@/components/charts/FingerLoad";
import { StreakCalendar } from "@/components/charts/StreakCalendar";
import { useStore } from "@/store/useStore";
import { formatNumber } from "@/lib/format";
import { fingerLoad } from "@/lib/fingerMap";
import { LAYOUT_NAMES, type LayoutId } from "@/lib/layouts";

const RANGES: { id: "today" | "7d" | "30d" | "all"; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "all", label: "All" },
];

export function Heatmap() {
  const heatmapRange = useStore((s) => s.heatmapRange);
  const setHeatmapRange = useStore((s) => s.setHeatmapRange);
  const fetchHeatmapKeys = useStore((s) => s.fetchHeatmapKeys);
  const heatmapKeys = useStore((s) => s.heatmapKeys);
  const punchCard = useStore((s) => s.punchCard);
  const calendar = useStore((s) => s.calendar);
  const loadCalendar = useStore((s) => s.loadCalendar);
  const refreshAll = useStore((s) => s.refreshAll);
  const layout = useStore((s) => s.layout);
  const setLayout = useStore((s) => s.setLayout);

  // Always refetch heatmap data when this view becomes visible. The other
  // views are dashboard-only and refresh from the global timer.
  useEffect(() => {
    fetchHeatmapKeys();
    if (calendar.length === 0) loadCalendar();
    if (punchCard.every((row) => row.every((v) => v === 0))) refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    const map: Record<number, number> = {};
    for (const k of heatmapKeys) map[k.code] = k.count;
    return map;
  }, [heatmapKeys]);

  const total = heatmapKeys.reduce((a, b) => a + b.count, 0);
  const fingers = useMemo(() => fingerLoad(heatmapKeys), [heatmapKeys]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-semibold tracking-tight"
          >
            Keyboard heatmap
          </motion.h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Where your fingers actually go.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={layout}
            onChange={(e) => setLayout(e.target.value as LayoutId)}
            className="glass cursor-pointer rounded-xl border-0 px-3 py-1.5 text-xs outline-none"
          >
            {(Object.keys(LAYOUT_NAMES) as LayoutId[]).map((id) => (
              <option key={id} value={id} className="bg-zinc-900">
                {LAYOUT_NAMES[id]}
              </option>
            ))}
          </select>
          <div className="glass flex rounded-xl p-1 text-xs">
            {RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setHeatmapRange(r.id)}
                className={`relative rounded-lg px-3 py-1.5 transition ${
                  heatmapRange === r.id
                    ? "text-white"
                    : "text-[var(--color-text-muted)] hover:text-white"
                }`}
              >
                {heatmapRange === r.id && (
                  <motion.div
                    layoutId="range-active"
                    className="absolute inset-0 rounded-lg bg-[var(--color-accent-soft)]"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <span className="relative">{r.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <GlassCard delay={0.1}>
        <div className="flex items-baseline justify-between">
          <div className="text-[11px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
            {LAYOUT_NAMES[layout]} ·{" "}
            {RANGES.find((r) => r.id === heatmapRange)?.label}
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">
            <span className="text-white tabular-nums">
              {formatNumber(total)}
            </span>{" "}
            total presses
          </div>
        </div>
        <div className="mt-6 flex justify-center overflow-x-auto pb-4">
          <KeyboardHeatmap counts={counts} layout={layout} />
        </div>
        <div className="mt-4 flex items-center justify-center gap-3 text-[10px] text-[var(--color-text-muted)]">
          <span>less</span>
          <div className="h-1.5 w-40 rounded-full bg-gradient-to-r from-violet-500/10 via-violet-500/40 to-violet-400" />
          <span>more</span>
        </div>
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard delay={0.18}>
          <div className="text-[11px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
            Finger load · {LAYOUT_NAMES[layout]} touch-typing
          </div>
          <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
            Assumes standard finger assignment. Consider remapping if any
            finger is doing too much work.
          </p>
          <div className="mt-4">
            <FingerLoad load={fingers} />
          </div>
        </GlassCard>

        <GlassCard delay={0.22}>
          <div className="text-[11px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
            When you type · day × hour · last 30 days
          </div>
          <div className="mt-5">
            <PunchCard data={punchCard} />
          </div>
        </GlassCard>
      </div>

      <GlassCard delay={0.3}>
        <div className="text-[11px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
          Activity calendar · last 365 days
        </div>
        <div className="mt-5 overflow-x-auto">
          <StreakCalendar data={calendar} />
        </div>
      </GlassCard>
    </div>
  );
}
