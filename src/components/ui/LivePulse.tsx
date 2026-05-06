import { useStore } from "@/store/useStore";
import { AnimatedNumber } from "./AnimatedNumber";
import { useT } from "@/lib/i18n";

export function LivePulse() {
  const liveKpm = useStore((s) => s.liveKpm);
  const pulseTick = useStore((s) => s.pulseTick);
  const active = pulseTick > 0;
  const t = useT();

  return (
    <div className="flex items-center gap-3 rounded-full border border-[var(--color-glass-stroke)] bg-[var(--color-glass-fill)] py-1.5 pr-4 pl-2">
      <span className="relative flex h-7 w-7 items-center justify-center">
        {pulseTick > 0 && (
          <span
            key={pulseTick}
            className="kc-ripple absolute inset-0 rounded-full bg-emerald-400/40"
          />
        )}
        <span
          className={`relative h-2 w-2 rounded-full transition-colors ${
            active ? "bg-emerald-400" : "bg-white/20"
          }`}
        />
      </span>
      <div className="flex items-baseline gap-1">
        <AnimatedNumber
          value={liveKpm}
          snap
          format={(n) => Math.round(n).toString()}
          className="text-sm font-semibold tabular-nums"
        />
        <span className="text-[10px] font-medium tracking-wider text-[var(--color-text-muted)] uppercase">
          {t("common.kpm")}
        </span>
      </div>
    </div>
  );
}
