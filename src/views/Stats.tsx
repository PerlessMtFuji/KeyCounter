import { GlassCard } from "@/components/ui/GlassCard";
import { Donut } from "@/components/charts/Donut";
import { useStore } from "@/store/useStore";
import { formatNumber } from "@/lib/format";
import { keyLabel } from "@/lib/keycode";
import { backspaceRatio } from "@/lib/derived";
import { useT } from "@/lib/i18n";

export function Stats() {
  const today = useStore((s) => s.today);
  const topKeys = useStore((s) => s.topKeys);
  const t = useT();

  const top20 = topKeys.slice(0, 20);
  const max = top20[0]?.count ?? 1;

  const least = [...topKeys]
    .filter((k) => k.count > 0)
    .slice(-8)
    .reverse();

  const mods = today?.modifiers ?? { shift: 0, ctrl: 0, alt: 0, meta: 0 };
  const modSlices = [
    { label: "Shift", value: mods.shift, color: "#a78bfa" },
    { label: "Ctrl", value: mods.ctrl, color: "#38bdf8" },
    { label: "Alt", value: mods.alt, color: "#34d399" },
    { label: "Meta", value: mods.meta, color: "#fbbf24" },
  ];
  const modTotal = modSlices.reduce((a, b) => a + b.value, 0);
  const todayTotal = today?.total ?? 0;
  const modRatio = todayTotal > 0 ? (modTotal / todayTotal) * 100 : 0;

  const back = backspaceRatio(today);
  const backHint =
    todayTotal === 0
      ? t("stats.backspaceWarmup")
      : back < 0.07
        ? t("stats.backspaceLow")
        : back < 0.1
          ? t("stats.backspaceMid")
          : t("stats.backspaceHigh");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("stats.title")}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {t("stats.subtitle")}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard delay={0.05} className="lg:col-span-2">
          <div className="text-[11px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
            {t("stats.top20")}
          </div>
          <div className="mt-4 grid gap-2.5">
            {top20.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--color-text-muted)]">
                {t("common.noData")}
              </div>
            ) : (
              top20.map((k, i) => {
                const pct = (k.count / max) * 100;
                return (
                  <div key={k.code} className="flex items-center gap-3">
                    <span className="w-5 text-right text-[10px] tabular-nums text-[var(--color-text-muted)]">
                      {i + 1}
                    </span>
                    <div className="flex h-7 min-w-9 shrink-0 items-center justify-center rounded-md border border-[var(--color-glass-stroke)] bg-white/[0.03] px-2 text-xs font-semibold whitespace-nowrap">
                      {keyLabel(k.code)}
                    </div>
                    <div className="flex-1">
                      <div className="relative h-1 overflow-hidden rounded-full bg-white/[0.04]">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-400 to-sky-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-20 text-right text-xs tabular-nums text-[var(--color-text-muted)]">
                      {formatNumber(k.count)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard delay={0.1}>
            <div className="text-[11px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
              {t("stats.modifierMix")}
            </div>
            <div className="mt-4 flex items-center justify-center">
              <Donut
                slices={modSlices}
                centerLabel={`${modRatio.toFixed(1)}%`}
                centerSubLabel={t("stats.ofAllKeys")}
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
              {t("stats.backspaceRatio")}
            </div>
            <div className="mt-3 text-3xl font-semibold tabular-nums">
              {(back * 100).toFixed(1)}%
            </div>
            <div className="mt-1 text-[11px] text-[var(--color-text-muted)]">
              {backHint}
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 to-rose-400"
                style={{ width: `${Math.min(100, back * 600)}%` }}
              />
            </div>
          </GlassCard>
        </div>
      </div>

      <GlassCard delay={0.2}>
        <div className="text-[11px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
          {t("stats.leastUsed")}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {least.length === 0 ? (
            <div className="col-span-full py-6 text-center text-sm text-[var(--color-text-muted)]">
              {t("common.notEnough")}
            </div>
          ) : (
            least.map((k) => (
              <div
                key={k.code}
                className="rounded-xl border border-[var(--color-glass-stroke)] bg-white/[0.02] p-3 text-center"
              >
                <div className="text-lg font-semibold">{keyLabel(k.code)}</div>
                <div className="mt-1 text-[10px] tabular-nums text-[var(--color-text-muted)]">
                  {formatNumber(k.count)}
                </div>
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </div>
  );
}
