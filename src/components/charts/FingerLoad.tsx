import { motion } from "framer-motion";
import { formatNumber } from "@/lib/format";
import { useT, type TranslationKey } from "@/lib/i18n";

interface Props {
  load: number[]; // length 10
}

const FINGER_KEYS: TranslationKey[] = [
  "finger.lPinky",
  "finger.lRing",
  "finger.lMiddle",
  "finger.lIndex",
  "finger.lThumb",
  "finger.rThumb",
  "finger.rIndex",
  "finger.rMiddle",
  "finger.rRing",
  "finger.rPinky",
];

export function FingerLoad({ load }: Props) {
  const t = useT();
  const max = Math.max(1, ...load);
  const total = load.reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-1.5 pt-2">
        {load.map((v, i) => {
          const intensity = v / max;
          const isThumb = i === 4 || i === 5;
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <motion.div
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{
                  duration: 0.7,
                  delay: 0.1 + i * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative w-full origin-bottom rounded-t-md"
                style={{
                  height: `${24 + intensity * 80}px`,
                  background: `linear-gradient(180deg, rgba(167,139,250,${0.3 + intensity * 0.6}), rgba(124,92,255,${0.05 + intensity * 0.4}))`,
                  boxShadow:
                    intensity > 0.3
                      ? `0 0 ${10 * intensity}px rgba(167,139,250,${intensity * 0.5})`
                      : "none",
                }}
              />
              <div className="text-[9px] text-[var(--color-text-muted)]">
                {isThumb ? "👍" : ""}
              </div>
              <div className="text-[10px] font-medium tabular-nums">
                {((v / total) * 100).toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-3 text-[10px]">
        {FINGER_KEYS.map((key, i) => (
          <div
            key={key}
            className="flex items-center justify-between text-[var(--color-text-muted)]"
          >
            <span>{t(key)}</span>
            <span className="tabular-nums">{formatNumber(load[i] ?? 0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
