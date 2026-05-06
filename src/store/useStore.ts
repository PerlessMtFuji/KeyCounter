import { create } from "zustand";
import {
  api,
  isTauri,
  type DayStats,
  type DayTotal,
  type LiveSnapshot,
  type KeyCount,
  type PermissionStatus,
  type RangeStats,
} from "@/lib/api";
import { generateMock } from "@/data/mock";
import { daysAgo } from "@/lib/format";
import type { LayoutId } from "@/lib/layouts";
import type { Lang } from "@/lib/i18n";

type Theme = "dark" | "light";
type WidgetMode = "full" | "compact";

export const DEFAULT_WIDGET_OPACITY = 60;
export const DEFAULT_WIDGET_TINT = "";

function readLocalStorage<T extends string>(
  key: string,
  fallback: T,
  allowed: readonly T[],
): T {
  if (typeof localStorage === "undefined") return fallback;
  const v = localStorage.getItem(key);
  return v && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("theme-light", theme === "light");
  document.documentElement.classList.toggle("theme-dark", theme === "dark");
}

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
  /// Sliding 60-second window of pulse deltas → instant client-side KPM.
  pulseHistory: { ts: number; delta: number }[];
  liveKpm: number;

  // Year-view streak calendar
  calendar: DayTotal[];
  loadCalendar: () => Promise<void>;

  // Heatmap range fetching
  heatmapRange: "today" | "7d" | "30d" | "all";
  heatmapKeys: KeyCount[];
  setHeatmapRange: (r: "today" | "7d" | "30d" | "all") => Promise<void>;
  fetchHeatmapKeys: () => Promise<void>;

  // Layout
  layout: LayoutId;
  setLayout: (l: LayoutId) => void;

  // Appearance + i18n
  theme: Theme;
  setTheme: (t: Theme) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  widgetMode: WidgetMode;
  setWidgetMode: (m: WidgetMode) => void;
  widgetSnap: boolean;
  setWidgetSnap: (v: boolean) => void;
  perfHud: boolean;
  setPerfHud: (v: boolean) => void;
  widgetOpacity: number;
  setWidgetOpacity: (n: number) => void;
  widgetTint: string;
  setWidgetTint: (c: string) => void;

  // Visible error notifications (for failures we'd otherwise only see in
  // a devtools console — useful when running a packaged build).
  errors: { id: number; title: string; detail?: string }[];
  pushError: (title: string, detail?: string) => void;
  dismissError: (id: number) => void;

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
  pulseHistory: [],
  liveKpm: 0,

  calendar: [],
  loadCalendar: async () => {
    if (!isTauri()) {
      // Mock: use 365 days of byDay30 repeated/scaled
      const m = generateMock(42);
      const out: DayTotal[] = [];
      const today = new Date();
      for (let i = 364; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dow = d.getDay();
        const weekend = dow === 0 || dow === 6;
        const seed = (i * 7919) % 1000;
        const noise = (seed / 1000 - 0.5) * 12000;
        const base = weekend ? 9000 : 16000;
        out.push({
          day: d.toISOString().slice(0, 10),
          total: Math.max(0, Math.round(base + noise)),
        });
      }
      void m;
      set({ calendar: out });
      return;
    }
    try {
      const cal = await api.getCalendar(365);
      set({ calendar: cal });
    } catch (e) {
      console.error(e);
    }
  },

  heatmapRange: "30d",
  heatmapKeys: [],
  setHeatmapRange: async (r) => {
    set({ heatmapRange: r });
    await get().fetchHeatmapKeys();
  },
  fetchHeatmapKeys: async () => {
    const r = get().heatmapRange;
    if (!isTauri()) {
      const all = get().topKeys;
      const factor =
        r === "today" ? 1 / 30 : r === "7d" ? 7 / 30 : r === "30d" ? 1 : 12;
      set({
        heatmapKeys: all.map((k) => ({
          ...k,
          count: Math.round(k.count * factor),
        })),
      });
      return;
    }
    const today = daysAgo(0);
    const from =
      r === "today"
        ? today
        : r === "7d"
          ? daysAgo(6)
          : r === "30d"
            ? daysAgo(29)
            : daysAgo(3650);
    try {
      const keys = await api.getTopKeys(from, today, 200);
      set({ heatmapKeys: keys });
    } catch (e) {
      console.error(e);
    }
  },

  layout: readLocalStorage<LayoutId>(
    "kc-layout",
    "qwerty",
    ["qwerty", "qwertz", "dvorak", "colemak"],
  ),
  setLayout: (l) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("kc-layout", l);
    }
    set({ layout: l });
  },

  theme: (() => {
    const t = readLocalStorage<Theme>("kc-theme", "dark", ["dark", "light"]);
    applyTheme(t);
    return t;
  })(),
  setTheme: (t) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("kc-theme", t);
    }
    applyTheme(t);
    set({ theme: t });
  },
  lang: readLocalStorage<Lang>("kc-lang", "en", ["en", "pl"]),
  setLang: (l) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("kc-lang", l);
    }
    set({ lang: l });
  },
  widgetMode: (() => {
    if (typeof localStorage === "undefined") return "full" as WidgetMode;
    const raw = localStorage.getItem("kc-widget-mode");
    // Migrate the old "acrylic" mode (removed): fall back to full layout.
    if (raw === "acrylic") {
      localStorage.setItem("kc-widget-mode", "full");
      return "full" as WidgetMode;
    }
    return raw === "compact" || raw === "full" ? raw : "full";
  })(),
  setWidgetMode: (m) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("kc-widget-mode", m);
    }
    set({ widgetMode: m });
  },
  widgetSnap: (() => {
    if (typeof localStorage === "undefined") return false;
    return localStorage.getItem("kc-widget-snap") === "1";
  })(),
  setWidgetSnap: (v) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("kc-widget-snap", v ? "1" : "0");
    }
    set({ widgetSnap: v });
  },
  perfHud: (() => {
    if (typeof localStorage === "undefined") return false;
    return localStorage.getItem("kc-perf-hud") === "1";
  })(),
  setPerfHud: (v) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("kc-perf-hud", v ? "1" : "0");
    }
    set({ perfHud: v });
  },
  widgetOpacity: (() => {
    if (typeof localStorage === "undefined") return DEFAULT_WIDGET_OPACITY;
    const raw = localStorage.getItem("kc-widget-opacity");
    if (raw === null) return DEFAULT_WIDGET_OPACITY;
    const n = Number(raw);
    if (!Number.isFinite(n)) return DEFAULT_WIDGET_OPACITY;
    return Math.max(10, Math.min(100, Math.round(n)));
  })(),
  setWidgetOpacity: (n) => {
    const clamped = Math.max(10, Math.min(100, Math.round(n)));
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("kc-widget-opacity", String(clamped));
    }
    set({ widgetOpacity: clamped });
  },
  widgetTint: (() => {
    if (typeof localStorage === "undefined") return DEFAULT_WIDGET_TINT;
    return localStorage.getItem("kc-widget-tint") ?? DEFAULT_WIDGET_TINT;
  })(),
  setWidgetTint: (c) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("kc-widget-tint", c);
    }
    set({ widgetTint: c });
  },

  errors: [],
  pushError: (title, detail) =>
    set((s) => ({
      errors: [
        ...s.errors,
        { id: Date.now() + Math.random(), title, detail },
      ],
    })),
  dismissError: (id) =>
    set((s) => ({ errors: s.errors.filter((e) => e.id !== id) })),

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
    await get().loadCalendar();
    await get().fetchHeatmapKeys();
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

// Called from a global event listener in App on every backend live-pulse
// (~5 Hz while typing). Throttles the visible "ripple" pulseTick to ~3 Hz
// so framer-motion doesn't stack 5 concurrent ripple animations per
// second, and keeps the live KPM history accurate. Heavier counters
// (today/range/lifetime) are NOT bumped optimistically anymore — every
// keystroke firing a setState that re-renders every Dashboard card was
// the dominant CPU cost. The 5 s backend poll catches them up.
const PULSE_TICK_MIN_INTERVAL_MS = 300;
let lastPulseTickAt = 0;

export function recordPulse(delta: number) {
  const now = Date.now();
  const advanceTick = now - lastPulseTickAt >= PULSE_TICK_MIN_INTERVAL_MS;
  if (advanceTick) lastPulseTickAt = now;

  useStore.setState((s) => {
    const history = [
      ...s.pulseHistory.filter((p) => now - p.ts < 60_000),
      { ts: now, delta },
    ];
    const liveKpm = history.reduce((a, b) => a + b.delta, 0);
    return {
      pulseTick: advanceTick ? s.pulseTick + 1 : s.pulseTick,
      lastPulseDelta: delta,
      pulseHistory: history,
      liveKpm,
    };
  });
}
