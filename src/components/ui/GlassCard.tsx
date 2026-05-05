import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode, MouseEvent } from "react";

interface Props extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
  delay?: number;
  spotlight?: boolean;
}

export function GlassCard({
  children,
  className = "",
  delay = 0,
  spotlight = true,
  ...rest
}: Props) {
  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!spotlight) return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      onMouseMove={handleMouseMove}
      className={`glass relative overflow-hidden rounded-2xl p-5 ${
        spotlight ? "spotlight" : ""
      } ${className}`}
      {...rest}
    >
      {/* subtle inner highlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />
      {children}
    </motion.div>
  );
}
