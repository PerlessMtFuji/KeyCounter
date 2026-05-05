import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { AnimatedNumber } from "./AnimatedNumber";

export function LivePulse() {
  const live = useStore((s) => s.live);
  const pulseTick = useStore((s) => s.pulseTick);
  const kpm = live?.last_minute ?? 0;
  const active = pulseTick > 0;

  return (
    <div className="flex items-center gap-3 rounded-full border border-white/[0.06] bg-white/[0.03] py-1.5 pr-4 pl-2 backdrop-blur-xl">
      <span className="relative flex h-7 w-7 items-center justify-center">
        <AnimatePresence>
          <motion.span
            key={pulseTick}
            initial={{ scale: 0.6, opacity: 0.55 }}
            animate={{ scale: 2.4, opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 rounded-full bg-emerald-400/40"
          />
        </AnimatePresence>
        <span
          className={`relative h-2 w-2 rounded-full transition-colors ${
            active ? "bg-emerald-400" : "bg-white/20"
          }`}
        />
      </span>
      <div className="flex items-baseline gap-1">
        <AnimatedNumber
          value={kpm}
          duration={0.8}
          format={(n) => Math.round(n).toString()}
          className="text-sm font-semibold tabular-nums"
        />
        <span className="text-[10px] font-medium tracking-wider text-[var(--color-text-muted)] uppercase">
          KPM
        </span>
      </div>
    </div>
  );
}
