import { motion, type HTMLMotionProps } from "framer-motion";
import { useRef, type ReactNode, type MouseEvent } from "react";

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
  // Throttle the spotlight CSS-variable writes to one DOM hit per
  // animation frame. Mouse move events fire up to ~1000 Hz on
  // high-poll-rate hardware; writing a CSS custom property invalidates
  // the spotlight radial-gradient and triggers a paint, so doing it
  // per-event was a measurable CPU cost during hover. The pending ref
  // collapses every same-frame event into a single rAF callback.
  const pendingRef = useRef<{
    el: HTMLDivElement;
    x: number;
    y: number;
  } | null>(null);
  const rafRef = useRef(0);
  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!spotlight) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    pendingRef.current = {
      el,
      x: e.clientX - r.left,
      y: e.clientY - r.top,
    };
    if (rafRef.current === 0) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        const p = pendingRef.current;
        if (!p) return;
        p.el.style.setProperty("--mx", `${p.x}px`);
        p.el.style.setProperty("--my", `${p.y}px`);
      });
    }
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
