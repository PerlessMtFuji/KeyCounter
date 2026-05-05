import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import { formatNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";

const THRESHOLDS = [
  100, 1_000, 10_000, 100_000, 1_000_000, 10_000_000, 100_000_000,
];

interface Toast {
  id: number;
  threshold: number;
}

export function MilestoneToast() {
  const lifetime = useStore((s) => s.lifetime);
  const t = useT();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastSeen = useRef<number | null>(null);
  const idCounter = useRef(0);

  useEffect(() => {
    if (lastSeen.current === null) {
      lastSeen.current = lifetime;
      return;
    }
    const prev = lastSeen.current;
    const delta = lifetime - prev;
    lastSeen.current = lifetime;
    for (const t of THRESHOLDS) {
      // Heuristic: only fire when the delta is plausibly "live typing" —
      // i.e. small relative to the threshold. A fresh app load that jumps
      // from 0 → 5_000_000 lifetime would otherwise spam every toast.
      if (prev < t && lifetime >= t && delta > 0 && delta < t / 4) {
        idCounter.current += 1;
        const id = idCounter.current;
        setToasts((cur) => [...cur, { id, threshold: t }]);
        setTimeout(() => {
          setToasts((cur) => cur.filter((x) => x.id !== id));
        }, 5000);
      }
    }
  }, [lifetime]);

  return (
    <div className="pointer-events-none fixed right-6 bottom-6 z-50 flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="glass relative w-72 overflow-hidden rounded-2xl p-4"
          >
            <Particles />
            <div className="relative flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-orange-400 text-xl shadow-lg shadow-amber-500/40">
                ★
              </div>
              <div>
                <div className="text-[10px] font-medium tracking-[0.18em] text-amber-200/80 uppercase">
                  {t("toast.milestone")}
                </div>
                <div className="mt-1 text-base font-semibold">
                  {t("toast.keystrokes", { n: formatNumber(toast.threshold) })}
                </div>
                <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  {t("toast.keepGoing")}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function Particles() {
  return (
    <div aria-hidden className="absolute inset-0">
      {Array.from({ length: 14 }).map((_, i) => {
        const x = (Math.random() - 0.5) * 200;
        const y = (Math.random() - 0.5) * 120;
        return (
          <motion.span
            key={i}
            className="absolute top-1/2 left-1/2 block h-1 w-1 rounded-full"
            style={{
              background:
                i % 2 === 0 ? "rgba(252, 211, 77, 0.9)" : "rgba(167, 139, 250, 0.9)",
            }}
            initial={{ opacity: 1, x: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 0, x, y, scale: 1 }}
            transition={{
              duration: 1.6 + Math.random() * 0.8,
              ease: "easeOut",
            }}
          />
        );
      })}
    </div>
  );
}
