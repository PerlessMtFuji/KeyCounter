import { animate, useMotionValue, useTransform, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { formatNumber } from "@/lib/format";

interface Props {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}

// Snap (no animation) when the relative jump is below this threshold —
// for live counters like KPM that change frequently, each animation
// triggers a 60Hz tween for `duration` seconds. With pulses arriving
// every ~300ms a long-running tween was effectively continuous.
const SNAP_THRESHOLD_REL = 0.02;
const SNAP_THRESHOLD_ABS = 1;

export function AnimatedNumber({
  value,
  duration = 0.4,
  format = formatNumber,
  className = "",
}: Props) {
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (v) => format(Math.round(v)));
  const lastValue = useRef(0);

  useEffect(() => {
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
  }, [value, duration, motionValue]);

  return <motion.span className={className}>{display}</motion.span>;
}
