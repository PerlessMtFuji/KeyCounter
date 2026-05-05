import { GlassCard } from "./GlassCard";
import { AnimatedNumber } from "./AnimatedNumber";

interface Props {
  label: string;
  value: number;
  unit?: string;
  hint?: string;
  accent?: string;
  delay?: number;
  format?: (n: number) => string;
}

export function StatCard({
  label,
  value,
  unit,
  hint,
  accent = "from-violet-400 to-sky-400",
  delay = 0,
  format,
}: Props) {
  return (
    <GlassCard delay={delay} className="group">
      <div className="text-[11px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
        {label}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span
          className={`bg-gradient-to-r ${accent} bg-clip-text text-4xl font-semibold tabular-nums tracking-tight text-transparent`}
        >
          <AnimatedNumber value={value} format={format} />
        </span>
        {unit && (
          <span className="text-sm text-[var(--color-text-muted)]">{unit}</span>
        )}
      </div>
      {hint && (
        <div className="mt-2 text-xs text-[var(--color-text-muted)]">{hint}</div>
      )}
      {/* hover shimmer */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent transition-transform duration-[1200ms] group-hover:translate-x-full"
      />
    </GlassCard>
  );
}
