import { animate, useMotionValue, useTransform, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { formatNumber } from "@/lib/format";

interface Props {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
  /// Skip the tween entirely and write the value instantly. Use for
  /// high-frequency live counters (e.g. KPM, which updates every 200ms);
  /// each tween runs at 60Hz for `duration` seconds, so a 0.4s tween
  /// retriggered every 300ms is effectively a continuous animation.
  snap?: boolean;
}

// Snap when the relative jump is below this threshold — covers small
// variations between samples on otherwise-static numbers.
const SNAP_THRESHOLD_REL = 0.02;
const SNAP_THRESHOLD_ABS = 1;

export function AnimatedNumber({
  value,
  duration = 0.4,
  format = formatNumber,
  className = "",
  snap = false,
}: Props) {
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (v) => format(Math.round(v)));
  const lastValue = useRef(0);

  useEffect(() => {
    if (snap) {
      motionValue.set(value);
      lastValue.current = value;
      return;
    }
    const prev = lastValue.current;
    const diff = Math.abs(value - prev);
    const rel = prev === 0 ? 1 : diff / prev;
    lastValue.current = value;

    if (diff < SNAP_THRESHOLD_ABS || rel < SNAP_THRESHOLD_REL) {
      motionValue.set(value);
      return;
    }
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [value, duration, motionValue, snap]);

  return <motion.span className={className}>{display}</motion.span>;
}
