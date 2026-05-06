import { motion } from "framer-motion";
import { useState } from "react";
import { createPortal } from "react-dom";
import { KEYBOARD_60 } from "./keyboard-layout";
import { formatNumber } from "@/lib/format";
import { keyLabel } from "@/lib/keycode";
import { LAYOUT_OVERRIDES, type LayoutId } from "@/lib/layouts";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";

interface Props {
  counts: Record<number, number>;
  layout?: LayoutId;
}

const UNIT = 44; // px per 1u key
const GAP = 4;
const KEY_HEIGHT = 44;

export function KeyboardHeatmap({ counts, layout = "qwerty" }: Props) {
  const theme = useStore((s) => s.theme);
  const t = useT();
  const presses = t("common.presses");
  const overrides = LAYOUT_OVERRIDES[layout];
  const max = Math.max(1, ...Object.values(counts));
  // Slightly different RGB and alpha curve per theme so saturated keys
  // remain readable against either background.
  const keyRgb = theme === "light" ? "109, 77, 255" : "140, 110, 255";
  const idleFill =
    theme === "light" ? "rgba(15,23,42,0.04)" : "rgba(255,255,255,0.025)";
  const baseAlpha = theme === "light" ? 0.1 : 0.18;
  const peakAlpha = theme === "light" ? 0.85 : 0.78;
  const [hovered, setHovered] = useState<{
    code: number;
    count: number;
    label: string;
    x: number;
    y: number;
    above: boolean;
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
              // Wider visual range: silent when 0, baseline punch even at low
              // counts so 1-press keys are clearly distinguishable from unused.
              const ratio = count === 0 ? 0 : count / max;
              const intensity = Math.pow(ratio, 0.45);
              const fill =
                count === 0
                  ? idleFill
                  : `rgba(${keyRgb}, ${baseAlpha + intensity * peakAlpha})`;
              const glow =
                intensity > 0.4
                  ? `0 0 ${10 + intensity * 22}px rgba(${keyRgb},${intensity * 0.7})`
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
                    // Default: float tooltip above the key. If the key is
                    // close to the top of the viewport, flip it to below
                    // so it stays in view.
                    const above = r.top > 80;
                    setHovered({
                      code,
                      count,
                      label: keyLabel(code),
                      x: r.left + r.width / 2,
                      y: above ? r.top : r.bottom,
                      above,
                    });
                  }}
                  onMouseLeave={() => setHovered(null)}
                  className="relative flex cursor-pointer items-center justify-center rounded-lg border border-[var(--color-glass-stroke)] text-[11px] font-medium text-[var(--color-text-primary)] transition-transform duration-200 hover:scale-[1.06]"
                  style={{
                    width: w,
                    height: KEY_HEIGHT,
                    background: fill,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), ${glow}`,
                  }}
                >
                  {overrides[code] ?? k.label}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>

      {hovered &&
        typeof document !== "undefined" &&
        createPortal(
          // Portal to document.body so the tooltip is NOT positioned
          // relative to the GlassCard ancestor (whose framer-motion
          // transform makes `position: fixed` resolve relative to the
          // card and the `overflow: hidden` then clips it). x/y are
          // additionally clamped to keep the tooltip fully inside the
          // viewport even when hovering edge keys.
          <Tooltip {...hovered} pressesLabel={presses} />,
          document.body,
        )}
    </div>
  );
}

interface TooltipProps {
  code: number;
  count: number;
  label: string;
  x: number;
  y: number;
  above: boolean;
  pressesLabel: string;
}

const TOOLTIP_W = 180;
const TOOLTIP_H = 52;
const PAD = 8;

function Tooltip({ count, label, x, y, above, pressesLabel }: TooltipProps) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Horizontal: center on cursor, but clamp so the tooltip's full width
  // fits inside the viewport.
  const halfW = TOOLTIP_W / 2;
  const clampedX = Math.max(halfW + PAD, Math.min(vw - halfW - PAD, x));

  // Vertical: place above key by default, flip below when there's no
  // room above. Apply the gap directly to top so we can avoid CSS
  // transform on the Y axis (no transform conflicts of any kind).
  const flippedAbove = above && y - TOOLTIP_H - PAD - 10 >= 0;
  const top = flippedAbove ? y - TOOLTIP_H - 10 : y + 10;
  const clampedTop = Math.max(PAD, Math.min(vh - TOOLTIP_H - PAD, top));

  return (
    <div
      className="pointer-events-none fixed z-50 rounded-xl border border-[var(--color-glass-stroke)] bg-[var(--color-bg-elevated)] px-3 py-2 text-xs shadow-2xl"
      style={{
        left: clampedX - halfW,
        top: clampedTop,
        width: TOOLTIP_W,
      }}
    >
      <div className="font-semibold text-[var(--color-text-primary)]">
        {label}
      </div>
      <div className="mt-0.5 tabular-nums text-[var(--color-text-muted)]">
        {formatNumber(count)} {pressesLabel}
      </div>
    </div>
  );
}
