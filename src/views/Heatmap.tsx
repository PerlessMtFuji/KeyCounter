import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { KeyboardHeatmap } from "@/components/heatmap/KeyboardHeatmap";
import { PunchCard } from "@/components/charts/PunchCard";
import { useStore } from "@/store/useStore";
import { formatNumber } from "@/lib/format";

type Range = "today" | "week" | "month" | "all";

export function Heatmap() {
  const { data } = useStore();
  const [range, setRange] = useState<Range>("all");

  // For mock: scale lifetime counts by range
  const factor =
    range === "today" ? 1 / 60 : range === "week" ? 7 / 60 : range === "month" ? 30 / 60 : 1;
  const counts: Record<number, number> = Object.fromEntries(
    data.perKeyLifetime.map((k) => [k.code, Math.round(k.count * factor)]),
  );
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
          {(["today", "week", "month", "all"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`relative rounded-lg px-3 py-1.5 capitalize transition ${
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
              <span className="relative">{r}</span>
            </button>
          ))}
        </div>
      </div>

      <GlassCard delay={0.1}>
        <div className="flex items-baseline justify-between">
          <div className="text-[11px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
            {range === "all" ? "All time" : `Last ${range}`}
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">
            <span className="text-white tabular-nums">{formatNumber(total)}</span> total presses
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
          When you type · day × hour
        </div>
        <div className="mt-5">
          <PunchCard data={data.punchCard} />
        </div>
      </GlassCard>
    </div>
  );
}
