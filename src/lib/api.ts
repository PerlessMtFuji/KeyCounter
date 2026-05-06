import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

// Mirrors src-tauri DTOs. Keep field names snake_case to match Rust serde.
export interface KeyCount {
  code: number;
  count: number;
}

export interface ModifierBreakdown {
  shift: number;
  ctrl: number;
  alt: number;
  meta: number;
}

export interface DayStats {
  day: string;
  total: number;
  by_code: KeyCount[];
  modifiers: ModifierBreakdown;
}

export interface DayTotal {
  day: string;
  total: number;
}

export interface RangeStats {
  from: string;
  to: string;
  total: number;
  days_active: number;
  by_day: DayTotal[];
}

export interface LiveSnapshot {
  last_minute: number;
  last_5_minutes: number;
  last_hour: number;
}

export interface AppInfo {
  name: string;
  version: string;
  db_path: string;
  paused: boolean;
}

export interface PermissionStatus {
  accessibility: boolean;
}

export interface LivePulse {
  delta: number;
  total: number;
}

export const api = {
  appInfo: () => invoke<AppInfo>("app_info"),
  setPaused: (paused: boolean) => invoke<void>("set_paused", { paused }),
  checkPermissions: () => invoke<PermissionStatus>("check_permissions"),

  getTodayStats: () => invoke<DayStats>("get_today_stats"),
  getDayStats: (day: string) => invoke<DayStats>("get_day_stats", { day }),
  getRangeStats: (from: string, to: string) =>
    invoke<RangeStats>("get_range_stats", { from, to }),
  getTopKeys: (from: string, to: string, limit: number) =>
    invoke<KeyCount[]>("get_top_keys", { from, to, limit }),
  getLive: () => invoke<LiveSnapshot>("get_live"),
  getStreak: () => invoke<number>("get_streak"),
  getTodayHourly: () => invoke<number[]>("get_today_hourly"),
  getPunchCard: () => invoke<number[][]>("get_punch_card"),
  getLifetimeTotal: () => invoke<number>("get_lifetime_total"),
  getCalendar: (days: number) => invoke<DayTotal[]>("get_calendar", { days }),
  resetDatabase: () => invoke<void>("reset_database"),
  exportData: () => invoke<unknown>("export_data"),

  onLivePulse: (cb: (p: LivePulse) => void): Promise<UnlistenFn> =>
    listen<LivePulse>("live-pulse", (e) => cb(e.payload)),
};

/// True when this is a real Tauri runtime (window has `__TAURI_INTERNALS__`).
/// In a plain browser dev (e.g. `vite dev` without `tauri dev`) we render
/// against mock data so designers can iterate without Rust.
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}
