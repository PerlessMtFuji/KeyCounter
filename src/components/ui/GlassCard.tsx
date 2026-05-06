import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  /// Kept on the API for backwards compatibility — the per-frame
  /// repaint of the radial-gradient pseudo-element was a measurable
  /// CPU drain on cursor movement, so the spotlight is gone. Cards
  /// now rely on border + bg-fallback gradient backdrop for tactility.
  delay?: number;
  spotlight?: boolean;
}

// Plain styled card. Was a `motion.div` with entry tween + spotlight
// pseudo-element pointer tracking; both removed for performance — the
// entry animations triggered on every view mount and the cursor
// tracking re-painted a large radial gradient on every frame of
// movement.
export function GlassCard({
  children,
  className = "",
  delay: _delay,
  spotlight: _spotlight,
  ...rest
}: Props & React.HTMLAttributes<HTMLDivElement>) {
  void _delay;
  void _spotlight;
  return (
    <div
      className={`glass relative overflow-hidden rounded-2xl p-5 ${className}`}
      {...rest}
    >
      {/* subtle inner highlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />
      {children}
    </div>
  );
}
