export function formatNumber(n: number): string {
  if (n < 1000) return n.toString();
  if (n < 10_000) return n.toLocaleString("en-US");
  if (n < 1_000_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  return `${(n / 1_000_000_000).toFixed(2)}B`;
}

export function formatDelta(delta: number): { text: string; positive: boolean } {
  const positive = delta >= 0;
  const sign = positive ? "+" : "";
  if (Math.abs(delta) < 0.1) return { text: "—", positive };
  return { text: `${sign}${delta.toFixed(1)}%`, positive };
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

export function isoDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDay(d);
}
