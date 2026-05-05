import { motion } from "framer-motion";

interface Props {
  data: { label: string; value: number }[];
  height?: number;
  showLabels?: boolean;
}

export function BarChart({ data, height = 140, showLabels = true }: Props) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 100 / data.length;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="h-[var(--h)] w-full"
        style={{ ["--h" as string]: `${height}px` }}
      >
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#7c5cff" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 12);
          const x = i * barWidth + barWidth * 0.18;
          const w = barWidth * 0.64;
          const y = height - h;
          return (
            <motion.rect
              key={`${d.label}-${i}`}
              x={x}
              width={w}
              fill="url(#barGrad)"
              rx="0.6"
              initial={{ y: height, height: 0, opacity: 0 }}
              animate={{ y, height: h, opacity: 1 }}
              transition={{
                duration: 0.7,
                delay: i * 0.012,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          );
        })}
      </svg>
      {showLabels && (
        <div className="mt-2 flex justify-between text-[10px] text-[var(--color-text-muted)]">
          {data.map((d, i) => (
            <span
              key={`${d.label}-${i}`}
              style={{
                width: `${barWidth}%`,
                textAlign: "center",
                opacity: i % Math.ceil(data.length / 8) === 0 ? 1 : 0,
              }}
            >
              {d.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
