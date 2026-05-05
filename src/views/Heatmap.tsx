import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { KeyboardHeatmap } from "@/components/heatmap/KeyboardHeatmap";
import { PunchCard } from "@/components/charts/PunchCard";
import { useStore } from "@/store/useStore";
import { formatNumber } from "@/lib/format";

type Range = "today" | "30d";

export function Heatmap() {
  const today = useStore((s) => s.today);
  const topKeys = useStore((s) => s.topKeys);
  const punchCard = useStore((s) => s.punchCard);
  const [range, setRange] = useState<Range>("30d");

  const counts = useMemo(() => {
    const src = range === "today" ? today?.by_code ?? [] : topKeys;
    const map: Record<number, number> = {};
    for (const k of src) map[k.code] = k.count;
    return map;
  }, [range, today, topKeys]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
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
        <div className="glass flex rounded-xl p-1 text-xs">
          {(
            [
              ["today", "Today"],
              ["30d", "Last 30 days"],
            ] as [Range, string][]
          ).map(([r, label]) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`relative rounded-lg px-3 py-1.5 transition ${
                range === r
                  ? "text-white"
                  : "text-[var(--color-text-muted)] hover:text-white"
              }`}
            >
              {range === r && (
                <motion.div
                  layoutId="range-active"
                  className="absolute inset-0 rounded-lg bg-[var(--color-accent-soft)]"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <GlassCard delay={0.1}>
        <div className="flex items-baseline justify-between">
          <div className="text-[11px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
            {range === "today" ? "Today" : "Last 30 days"}
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">
            <span className="text-white tabular-nums">
              {formatNumber(total)}
            </span>{" "}
            total presses
          </div>
        </div>
        <div className="mt-6 flex justify-center overflow-x-auto pb-4">
          <KeyboardHeatmap counts={counts} />
        </div>
        <div className="mt-4 flex items-center justify-center gap-3 text-[10px] text-[var(--color-text-muted)]">
          <span>less</span>
          <div className="h-1.5 w-40 rounded-full bg-gradient-to-r from-violet-500/10 via-violet-500/40 to-violet-400" />
          <span>more</span>
        </div>
      </GlassCard>

      <GlassCard delay={0.2}>
        <div className="text-[11px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
          When you type · day × hour · last 30 days
        </div>
        <div className="mt-5">
          <PunchCard data={punchCard} />
        </div>
      </GlassCard>
    </div>
  );
}
