import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Donut } from "@/components/charts/Donut";
import { useStore } from "@/store/useStore";
import { formatNumber } from "@/lib/format";
import { keyLabel } from "@/lib/keycode";

export function Stats() {
  const { data } = useStore();
  const top20 = data.perKeyLifetime.slice(0, 20);
  const max = top20[0]?.count ?? 1;

  const least = [...data.perKeyLifetime]
    .filter((k) => k.count > 0)
    .slice(-8)
    .reverse();

  const modSlices = [
    { label: "Shift", value: data.modifiers.shift, color: "#a78bfa" },
    { label: "Ctrl", value: data.modifiers.ctrl, color: "#38bdf8" },
    { label: "Alt", value: data.modifiers.alt, color: "#34d399" },
    { label: "Meta", value: data.modifiers.meta, color: "#fbbf24" },
  ];
  const modTotal = modSlices.reduce((a, b) => a + b.value, 0);
  const modRatio = (modTotal / data.monthTotal) * 100;

  return (
    <div className="space-y-6">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-semibold tracking-tight"
        >
          Stats
        </motion.h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Detailed breakdown across all keys and behaviours.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard delay={0.05} className="lg:col-span-2">
          <div className="text-[11px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
            Top 20 keys · all-time
          </div>
          <div className="mt-4 grid gap-2.5">
            {top20.map((k, i) => {
              const pct = (k.count / max) * 100;
              return (
                <motion.div
                  key={k.code}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.025 }}
                  className="flex items-center gap-3"
                >
                  <span className="w-5 text-right text-[10px] tabular-nums text-[var(--color-text-muted)]">
                    {i + 1}
                  </span>
                  <div className="flex h-7 w-9 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-xs font-semibold">
                    {keyLabel(k.code)}
                  </div>
                  <div className="flex-1">
                    <div className="relative h-1 overflow-hidden rounded-full bg-white/[0.04]">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-400 to-sky-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{
                          duration: 0.8,
                          delay: 0.15 + i * 0.025,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-20 text-right text-xs tabular-nums text-[var(--color-text-muted)]">
                    {formatNumber(k.count)}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard delay={0.1}>
            <div className="text-[11px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
              Modifier mix
            </div>
            <div className="mt-4 flex items-center justify-center">
              <Donut
                slices={modSlices}
                centerLabel={`${modRatio.toFixed(1)}%`}
                centerSubLabel="of all keys"
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {modSlices.map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: s.color }}
                  />
                  <span className="text-[var(--color-text-muted)]">
                    {s.label}
                  </span>
                  <span className="ml-auto tabular-nums">
                    {formatNumber(s.value)}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard delay={0.15}>
            <div className="text-[11px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
              Backspace ratio
            </div>
            <div className="mt-3 text-3xl font-semibold tabular-nums">
              {(data.backspaceRatio * 100).toFixed(1)}%
            </div>
            <div className="mt-1 text-[11px] text-[var(--color-text-muted)]">
              {data.backspaceRatio < 0.07
                ? "You delete less than most. Confident typist."
                : data.backspaceRatio < 0.1
                  ? "Healthy correction rate."
                  : "Consider slowing down for accuracy."}
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 to-rose-400"
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(100, data.backspaceRatio * 600)}%`,
                }}
                transition={{ duration: 1.1, delay: 0.4 }}
              />
            </div>
          </GlassCard>
        </div>
      </div>

      <GlassCard delay={0.2}>
        <div className="text-[11px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
          Least used (with non-zero count)
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {least.map((k, i) => (
            <motion.div
              key={k.code}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 + i * 0.04 }}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center"
            >
              <div className="text-lg font-semibold">{keyLabel(k.code)}</div>
              <div className="mt-1 text-[10px] tabular-nums text-[var(--color-text-muted)]">
                {formatNumber(k.count)}
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
