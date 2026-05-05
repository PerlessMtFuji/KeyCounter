import { animate, useMotionValue, useTransform, motion } from "framer-motion";
import { useEffect } from "react";
import { formatNumber } from "@/lib/format";

interface Props {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 1.6,
  format = formatNumber,
  className = "",
}: Props) {
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (v) => format(Math.round(v)));

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [value, duration, motionValue]);

  return <motion.span className={className}>{display}</motion.span>;
}
