import { create } from "zustand";
import {
  api,
  isTauri,
  type DayStats,
  type LiveSnapshot,
  type KeyCount,
  type PermissionStatus,
  type RangeStats,
} from "@/lib/api";
import { generateMock } from "@/data/mock";
import { daysAgo } from "@/lib/format";

export type View =
  | "dashboard"
  | "heatmap"
  | "stats"
  | "achievements"
  | "settings";

interface AppState {
  // Routing
  view: View;
  setView: (v: View) => void;

  // Permissions (macOS Accessibility primarily)
  permissions: PermissionStatus | null;
  checkPermissions: () => Promise<void>;

  // Pause / resume
  paused: boolean;
  togglePaused: () => Promise<void>;

  // Data slices (null = not yet loaded)
  today: DayStats | null;
  range7: RangeStats | null;
  range30: RangeStats | null;
  topKeys: KeyCount[];
  hourly: number[];
  punchCard: number[][];
  streak: number;
  lifetime: number;
  live: LiveSnapshot | null;

  // Live pulse: increments on each live-pulse event from backend
  pulseTick: number;
  lastPulseDelta: number;

  // Demo / mock-only mode (true when not running inside Tauri)
  demo: boolean;

  // Actions
  init: () => Promise<void>;
  refreshAll: () => Promise<void>;
  refreshLive: () => Promise<void>;
}

const initialEmpty = {
  today: null,
  range7: null,
  range30: null,
  topKeys: [],
  hourly: Array(24).fill(0) as number[],
  punchCard: Array.from({ length: 7 }, () =>
    Array(24).fill(0) as number[],
  ),
  streak: 0,
  lifetime: 0,
  live: null,
};

// Build a mock-backed initial slice that matches DTO shapes (used in browser
// preview / when running outside Tauri).
function mockSlice() {
  const m = generateMock(42);
  const today: DayStats = {
    day: daysAgo(0),
    total: m.todayTotal,
    by_code: m.perKeyLifetime
      .map((k) => ({
        code: k.code as number,
        // scale lifetime ratio down to a single day
        count: Math.round((k.count / m.lifetimeTotal) * m.todayTotal),
      }))
      .filter((k) => k.count > 0),
    modifiers: {
      shift: Math.round(m.modifiers.shift / 30),
      ctrl: Math.round(m.modifiers.ctrl / 30),
      alt: Math.round(m.modifiers.alt / 30),
      meta: Math.round(m.modifiers.meta / 30),
    },
  };
  const range7: RangeStats = {
    from: m.byDay7[0]!.day,
    to: m.byDay7[m.byDay7.length - 1]!.day,
    total: m.weekTotal,
    days_active: 7,
    by_day: m.byDay7,
  };
  const range30: RangeStats = {
    from: m.byDay30[0]!.day,
    to: m.byDay30[m.byDay30.length - 1]!.day,
    total: m.monthTotal,
    days_active: 30,
    by_day: m.byDay30,
  };
  return {
    today,
    range7,
    range30,
    topKeys: m.perKeyLifetime.slice(0, 30).map((k) => ({
      code: k.code as number,
      count: k.count,
    })),
    hourly: m.hourly,
    punchCard: m.punchCard,
    streak: m.streak,
    lifetime: m.lifetimeTotal,
    live: {
      last_minute: m.todayKpm,
      last_5_minutes: m.todayKpm * 5,
      last_hour: m.todayKpm * 50,
    } as LiveSnapshot,
  };
}

export const useStore = create<AppState>((set, get) => ({
  view: "dashboard",
  setView: (v) => set({ view: v }),

  permissions: null,
  checkPermissions: async () => {
    if (!isTauri()) {
      set({ permissions: { accessibility: true } });
      return;
    }
    try {
      const p = await api.checkPermissions();
      set({ permissions: p });
    } catch (e) {
      console.error(e);
      set({ permissions: { accessibility: true } });
    }
  },

  paused: false,
  togglePaused: async () => {
    const next = !get().paused;
    set({ paused: next });
    if (isTauri()) {
      try {
        await api.setPaused(next);
      } catch (e) {
        console.error(e);
      }
    }
  },

  ...initialEmpty,

  pulseTick: 0,
  lastPulseDelta: 0,

  demo: !isTauri(),

  init: async () => {
    await get().checkPermissions();

    if (!isTauri()) {
      // Browser preview: hydrate with mock so the design remains reviewable.
      set(mockSlice());
      return;
    }

    try {
      const info = await api.appInfo();
      set({ paused: info.paused });
    } catch (e) {
      console.error(e);
    }

    await get().refreshAll();
  },

  refreshAll: async () => {
    if (!isTauri()) {
      set(mockSlice());
      return;
    }

    const today = daysAgo(0);
    const day7 = daysAgo(6);
    const day30 = daysAgo(29);

    const [
      todayStats,
      range7,
      range30,
      topKeys,
      hourly,
      punchCard,
      streak,
      lifetime,
      live,
    ] = await Promise.all([
      api.getTodayStats().catch(() => null),
      api.getRangeStats(day7, today).catch(() => null),
      api.getRangeStats(day30, today).catch(() => null),
      api.getTopKeys(day30, today, 30).catch(() => []),
      api.getTodayHourly().catch(() => Array(24).fill(0) as number[]),
      api
        .getPunchCard()
        .catch(
          () => Array.from({ length: 7 }, () => Array(24).fill(0)) as number[][],
        ),
      api.getStreak().catch(() => 0),
      api.getLifetimeTotal().catch(() => 0),
      api.getLive().catch(() => null),
    ]);

    set({
      today: todayStats,
      range7,
      range30,
      topKeys,
      hourly,
      punchCard,
      streak,
      lifetime,
      live,
    });
  },

  refreshLive: async () => {
    if (!isTauri()) return;
    try {
      const live = await api.getLive();
      set({ live });
    } catch (e) {
      console.error(e);
    }
  },
}));

// Increment pulse tick (called from a global event listener in App)
export function recordPulse(delta: number) {
  useStore.setState((s) => ({
    pulseTick: s.pulseTick + 1,
    lastPulseDelta: delta,
  }));
}
