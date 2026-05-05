import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatCard } from "@/components/ui/StatCard";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { BarChart } from "@/components/charts/BarChart";
import { Sparkline } from "@/components/charts/Sparkline";
import { useStore } from "@/store/useStore";
import { formatNumber } from "@/lib/format";
import { keyLabel } from "@/lib/keycode";
import { useT } from "@/lib/i18n";

export function Dashboard() {
  const today = useStore((s) => s.today);
  const range7 = useStore((s) => s.range7);
  const range30 = useStore((s) => s.range30);
  const topKeys = useStore((s) => s.topKeys);
  const hourly = useStore((s) => s.hourly);
  const streak = useStore((s) => s.streak);
  const lifetime = useStore((s) => s.lifetime);
  const liveKpm = useStore((s) => s.liveKpm);
  const demo = useStore((s) => s.demo);
  const t = useT();

  const todayTotal = today?.total ?? 0;
  const weekTotal = range7?.total ?? 0;
  const monthTotal = range30?.total ?? 0;
  const kpm = liveKpm;

  const last30 = (range30?.by_day ?? []).map((d) => ({
    label: d.day.slice(5),
    value: d.total,
  }));

  const top5 = topKeys.slice(0, 5);
  const top5Max = top5[0]?.count ?? 1;

  const isFresh = !demo && lifetime === 0;

  return (
    <div className="space-y-6">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-semibold tracking-tight"
        >
          {t("dashboard.title")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-1 text-sm text-[var(--color-text-muted)]"
        >
          {isFresh
            ? t("dashboard.subtitleFresh")
            : t("dashboard.subtitleNormal")}
        </motion.p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t("common.today")}
          value={todayTotal}
          unit={t("common.keys")}
          delay={0.05}
          accent="from-violet-400 to-fuchsia-400"
        />
        <StatCard
          label={t("common.kpm")}
          value={kpm}
          unit={t("common.perMin")}
          hint={t("dashboard.kpmHint")}
          delay={0.1}
          accent="from-sky-400 to-cyan-300"
          format={(n) => Math.round(n).toString()}
        />
        <StatCard
          label={t("dashboard.streak")}
          value={streak}
          unit={t("common.days")}
          delay={0.15}
          accent="from-amber-300 to-orange-400"
          format={(n) => Math.round(n).toString()}
        />
        <StatCard
          label={t("dashboard.lifetime")}
          value={lifetime}
          unit={t("common.keys")}
          delay={0.2}
          accent="from-emerald-300 to-teal-300"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard delay={0.25} className="lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[11px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
                {t("dashboard.last30")}
              </div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">
                <AnimatedNumber value={monthTotal} />
                <span className="ml-2 text-sm font-normal text-[var(--color-text-muted)]">
                  {t("common.keys")}
                </span>
              </div>
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">
              {t("common.avg")}{" "}
              <span className="text-[var(--color-text-primary)] tabular-nums">
                {formatNumber(Math.round(monthTotal / 30))}
              </span>{" "}
              {t("common.perDay")}
            </div>
          </div>
          <div className="mt-4">
            <BarChart data={last30} height={140} showLabels={false} />
          </div>
        </GlassCard>

        <GlassCard delay={0.3}>
          <div className="text-[11px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
            {t("dashboard.trend7")}
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">
            <AnimatedNumber value={weekTotal} />
          </div>
          <div className="mt-3">
            <Sparkline
              values={(range7?.by_day ?? []).map((d) => d.total)}
              height={64}
            />
          </div>
          <div className="mt-3 flex justify-between text-[10px] text-[var(--color-text-muted)]">
            <span>{range7?.by_day[0]?.day.slice(5) ?? ""}</span>
            <span>
              {range7?.by_day[range7.by_day.length - 1]?.day.slice(5) ?? ""}
            </span>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard delay={0.35}>
          <div className="text-[11px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
            {t("dashboard.top5")}
          </div>
          <div className="mt-4 space-y-3">
            {top5.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--color-text-muted)]">
                {t("common.noData")}
              </div>
            ) : (
              top5.map((k, i) => {
                const pct = (k.count / top5Max) * 100;
                return (
                  <motion.div
                    key={k.code}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.45 + i * 0.06 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--color-glass-stroke)] bg-[var(--color-accent-soft)] px-2 text-xs font-semibold whitespace-nowrap">
                      {keyLabel(k.code)}
                    </div>
                    <div className="flex-1">
                      <div className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                        <motion.div
                          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-400 to-sky-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{
                            duration: 0.9,
                            delay: 0.5 + i * 0.06,
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
              })
            )}
          </div>
        </GlassCard>

        <GlassCard delay={0.4}>
          <div className="text-[11px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
            {t("dashboard.byHour")}
          </div>
          <div className="mt-4">
            <BarChart
              data={hourly.map((v, h) => ({ label: String(h), value: v }))}
              height={140}
            />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
