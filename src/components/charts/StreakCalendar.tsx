import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { DayTotal } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { useT, type TranslationKey } from "@/lib/i18n";

interface Props {
  // Sparse list — only days with activity. Component fills in zeros.
  data: DayTotal[];
  days?: number; // default 365
}

const MONTH_KEYS: TranslationKey[] = [
  "month.jan",
  "month.feb",
  "month.mar",
  "month.apr",
  "month.may",
  "month.jun",
  "month.jul",
  "month.aug",
  "month.sep",
  "month.oct",
  "month.nov",
  "month.dec",
];

// Week-row labels: render only Mon, Wed, Fri — match GitHub's contribution graph.
const DAY_ROW_KEYS: (TranslationKey | "")[] = [
  "",
  "day.mon",
  "",
  "day.wed",
  "",
  "day.fri",
  "",
];

export function StreakCalendar({ data, days = 365 }: Props) {
  const t = useT();
  const cells = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of data) map.set(d.day, d.total);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(today.getDate() - (days - 1));
    // Snap start to previous Sunday for grid alignment
    while (start.getDay() !== 0) start.setDate(start.getDate() - 1);

    const out: { day: string; total: number; date: Date }[] = [];
    const cursor = new Date(start);
    while (cursor <= today) {
      const iso = cursor.toISOString().slice(0, 10);
      out.push({ day: iso, total: map.get(iso) ?? 0, date: new Date(cursor) });
      cursor.setDate(cursor.getDate() + 1);
    }
    return out;
  }, [data, days]);

  const max = Math.max(1, ...cells.map((c) => c.total));
  const weeks = Math.ceil(cells.length / 7);
  const [hover, setHover] = useState<{ day: string; total: number } | null>(
    null,
  );

  // Determine month label positions: first column where the month changes.
  const monthCols = useMemo(() => {
    const out: { col: number; label: string }[] = [];
    for (let w = 0; w < weeks; w++) {
      const cell = cells[w * 7];
      if (!cell) continue;
      const m = cell.date.getMonth();
      if (w === 0 || cells[(w - 1) * 7]?.date.getMonth() !== m) {
        out.push({ col: w, label: t(MONTH_KEYS[m]!) });
      }
    }
    return out;
  }, [cells, weeks]);

  return (
    <div className="relative inline-block">
      <div className="ml-7 mb-1 flex text-[10px] text-[var(--color-text-muted)]">
        {monthCols.map((m, i) => (
          <span
            key={i}
            className="absolute"
            style={{ left: `${28 + m.col * 13}px` }}
          >
            {m.label}
          </span>
        ))}
        {/* spacer */}
        <span className="invisible">x</span>
      </div>
      <div className="flex gap-[3px] pt-3">
        <div className="flex w-6 flex-col gap-[3px] text-[9px] text-[var(--color-text-muted)]">
          {DAY_ROW_KEYS.map((k, i) => (
            <span key={i} className="h-[10px] leading-[10px]">
              {k ? t(k) : ""}
            </span>
          ))}
        </div>
        {Array.from({ length: weeks }).map((_, w) => (
          <div key={w} className="flex flex-col gap-[3px]">
            {Array.from({ length: 7 }).map((_, d) => {
              const cell = cells[w * 7 + d];
              if (!cell) return <div key={d} className="h-[10px] w-[10px]" />;
              const intensity = cell.total > 0 ? cell.total / max : 0;
              const isFuture = cell.date > new Date();
              return (
                <motion.div
                  key={d}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.1 + (w * 7 + d) * 0.001,
                  }}
                  onMouseEnter={() =>
                    setHover({ day: cell.day, total: cell.total })
                  }
                  onMouseLeave={() => setHover(null)}
                  className="h-[10px] w-[10px] rounded-[2px] cursor-pointer transition-transform hover:scale-150"
                  style={{
                    background: isFuture
                      ? "transparent"
                      : `rgba(124, 92, 255, ${0.06 + intensity * 0.85})`,
                    boxShadow:
                      intensity > 0.4
                        ? `0 0 ${4 + intensity * 6}px rgba(124,92,255,${intensity * 0.5})`
                        : "none",
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      {/* Reserve space so the legend below doesn't jump as hover content
          comes and goes. */}
      <div className="mt-2 h-[14px] text-[10px] text-[var(--color-text-muted)]">
        {hover ? (
          <>
            <span className="font-mono text-[var(--color-text-primary)]">
              {hover.day}
            </span>
            {" · "}
            <span className="tabular-nums text-[var(--color-text-primary)]">
              {formatNumber(hover.total)}
            </span>{" "}
            {t("common.keystrokes")}
          </>
        ) : null}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px] text-[var(--color-text-muted)]">
        <span>less</span>
        <div className="flex gap-[3px]">
          {[0.1, 0.3, 0.55, 0.8, 1].map((v) => (
            <div
              key={v}
              className="h-[10px] w-[10px] rounded-[2px]"
              style={{ background: `rgba(124,92,255,${0.06 + v * 0.85})` }}
            />
          ))}
        </div>
        <span>more</span>
      </div>
    </div>
  );
}
