import { motion } from "framer-motion";

interface Props {
  // 7 rows (Mon..Sun) × 24 cols (hours)
  data: number[][];
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function PunchCard({ data }: Props) {
  // re-order so Mon is index 0; mock generated Sun=0, so rotate
  const rotated = [1, 2, 3, 4, 5, 6, 0].map((i) => data[i] ?? []);
  const flat = rotated.flat();
  const max = Math.max(...flat, 1);

  return (
    <div className="w-full">
      <div className="flex">
        <div className="flex w-10 flex-col justify-around pr-2 text-right text-[10px] text-[var(--color-text-muted)]">
          {DAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="grid flex-1 grid-cols-[repeat(24,minmax(0,1fr))] gap-[3px]">
          {rotated.map((row, dow) =>
            row.map((v, h) => {
              const intensity = v / max;
              const radius = 4 + intensity * 7;
              return (
                <motion.div
                  key={`${dow}-${h}`}
                  className="flex aspect-square items-center justify-center"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.2 + (dow * 24 + h) * 0.003,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <div
                    style={{
                      width: `${radius}px`,
                      height: `${radius}px`,
                      background: `rgba(167, 139, 250, ${0.15 + intensity * 0.85})`,
                      boxShadow: intensity > 0.6
                        ? `0 0 ${4 + intensity * 6}px rgba(167,139,250,${intensity * 0.6})`
                        : "none",
                    }}
                    className="rounded-full"
                  />
                </motion.div>
              );
            }),
          )}
        </div>
      </div>
      <div className="ml-10 mt-2 grid grid-cols-[repeat(24,minmax(0,1fr))] text-[9px] text-[var(--color-text-muted)]">
        {Array.from({ length: 24 }).map((_, h) => (
          <span key={h} className="text-center" style={{ opacity: h % 3 === 0 ? 1 : 0 }}>
            {h}
          </span>
        ))}
      </div>
    </div>
  );
}
