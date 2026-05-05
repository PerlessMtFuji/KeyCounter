import { motion } from "framer-motion";
import { useState } from "react";
import { KEYBOARD_60 } from "./keyboard-layout";
import { formatNumber } from "@/lib/format";
import { keyLabel } from "@/lib/keycode";

interface Props {
  counts: Record<number, number>;
}

const UNIT = 44; // px per 1u key
const GAP = 4;
const KEY_HEIGHT = 44;

export function KeyboardHeatmap({ counts }: Props) {
  const max = Math.max(1, ...Object.values(counts));
  const [hovered, setHovered] = useState<{
    code: number;
    count: number;
    label: string;
    x: number;
    y: number;
  } | null>(null);

  const totalRowWidth = 15 * UNIT + 14 * GAP;

  return (
    <div className="relative inline-block select-none">
      <div
        className="flex flex-col gap-[var(--gap)]"
        style={{
          ["--gap" as string]: `${GAP}px`,
          width: totalRowWidth,
        }}
      >
        {KEYBOARD_60.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className="flex"
            style={{ gap: GAP }}
          >
            {row.map((k, colIdx) => {
              const w = (k.width ?? 1) * UNIT + ((k.width ?? 1) - 1) * GAP;
              const code = Array.isArray(k.code) ? k.code[0]! : k.code;
              const count = counts[code] ?? 0;
              const intensity = Math.pow(count / max, 0.55); // gamma for perception
              const fill = `rgba(124, 92, 255, ${0.06 + intensity * 0.7})`;
              const glow =
                intensity > 0.3
                  ? `0 0 ${6 + intensity * 14}px rgba(124,92,255,${intensity * 0.55})`
                  : "none";
              return (
                <motion.div
                  key={`${rowIdx}-${colIdx}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: 0.04 + (rowIdx * 14 + colIdx) * 0.012,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  onMouseEnter={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    setHovered({
                      code,
                      count,
                      label: keyLabel(code),
                      x: r.left + r.width / 2,
                      y: r.top,
                    });
                  }}
                  onMouseLeave={() => setHovered(null)}
                  className="relative flex cursor-pointer items-center justify-center rounded-lg border border-white/[0.08] text-[11px] font-medium text-white/85 transition-transform duration-200 hover:scale-[1.06]"
                  style={{
                    width: w,
                    height: KEY_HEIGHT,
                    background: fill,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), ${glow}`,
                  }}
                >
                  {k.label}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>

      {hovered && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="glass pointer-events-none fixed z-50 rounded-lg px-3 py-2 text-xs"
          style={{
            left: hovered.x,
            top: hovered.y - 10,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="font-semibold">{hovered.label}</div>
          <div className="text-[var(--color-text-muted)] tabular-nums">
            {formatNumber(hovered.count)} presses
          </div>
        </motion.div>
      )}
    </div>
  );
}
