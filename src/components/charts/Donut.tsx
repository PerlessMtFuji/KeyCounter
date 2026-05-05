import { motion } from "framer-motion";

interface Slice {
  label: string;
  value: number;
  color: string;
}

interface Props {
  slices: Slice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSubLabel?: string;
}

export function Donut({
  slices,
  size = 180,
  thickness = 18,
  centerLabel,
  centerSubLabel,
}: Props) {
  const total = slices.reduce((a, b) => a + b.value, 0) || 1;
  const r = size / 2 - thickness / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={thickness}
        />
        {slices.map((s, i) => {
          const len = (s.value / total) * c;
          const dasharray = `${len} ${c - len}`;
          const dashoffset = -offset;
          offset += len;
          return (
            <motion.circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDasharray={dasharray}
              initial={{ strokeDashoffset: dashoffset + len, opacity: 0 }}
              animate={{ strokeDashoffset: dashoffset, opacity: 1 }}
              transition={{
                duration: 1,
                delay: 0.1 + i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {centerLabel && (
          <div className="text-2xl font-semibold tabular-nums">
            {centerLabel}
          </div>
        )}
        {centerSubLabel && (
          <div className="text-xs text-[var(--color-text-muted)]">
            {centerSubLabel}
          </div>
        )}
      </div>
    </div>
  );
}
