// Deterministic mock data for Phase 3. Phase 4 replaces with real Tauri invokes.

import { KC, type KeyCode } from "@/lib/keycode";
import { isoDay } from "@/lib/format";

// Simple seeded RNG (mulberry32)
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Approximate English letter frequency (×1000) — gives a realistic ranking.
const LETTER_FREQ: Record<number, number> = {
  [KC.E]: 127, [KC.T]: 91, [KC.A]: 82, [KC.O]: 75, [KC.I]: 70,
  [KC.N]: 67, [KC.S]: 63, [KC.H]: 61, [KC.R]: 60, [KC.D]: 43,
  [KC.L]: 40, [KC.U]: 28, [KC.C]: 28, [KC.M]: 24, [KC.W]: 23,
  [KC.F]: 22, [KC.G]: 20, [KC.Y]: 20, [KC.P]: 19, [KC.B]: 15,
  [KC.V]: 10, [KC.K]: 8, [KC.J]: 2, [KC.X]: 2, [KC.Q]: 1, [KC.Z]: 1,
};

const NON_LETTER_RATIO: Record<number, number> = {
  [KC.Space]: 180, [KC.Backspace]: 60, [KC.Return]: 30, [KC.Tab]: 8,
  [KC.ShiftLeft]: 45, [KC.ShiftRight]: 8, [KC.ControlLeft]: 25,
  [KC.AltLeft]: 6, [KC.MetaLeft]: 4, [KC.Escape]: 3,
  [KC.Comma]: 12, [KC.Dot]: 14, [KC.Slash]: 4, [KC.Semicolon]: 3,
  [KC.Quote]: 6, [KC.Minus]: 4, [KC.Equal]: 2,
  [KC.Num0]: 3, [KC.Num1]: 3, [KC.Num2]: 3, [KC.Num3]: 2, [KC.Num4]: 2,
  [KC.Num5]: 2, [KC.Num6]: 2, [KC.Num7]: 2, [KC.Num8]: 2, [KC.Num9]: 3,
  [KC.Up]: 5, [KC.Down]: 5, [KC.Left]: 7, [KC.Right]: 7,
  [KC.Delete]: 4,
};

export interface DayTotal {
  day: string;
  total: number;
}

export interface KeyCount {
  code: KeyCode;
  count: number;
}

export interface MockDataset {
  todayTotal: number;
  todayKpm: number;
  weekTotal: number;
  monthTotal: number;
  lifetimeTotal: number;
  streak: number;
  byDay30: DayTotal[];
  byDay7: DayTotal[];
  perKeyLifetime: KeyCount[];
  hourly: number[];                      // 24
  punchCard: number[][];                 // 7 × 24
  modifiers: { shift: number; ctrl: number; alt: number; meta: number };
  backspaceRatio: number;                // 0..1
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  progress: number; // 0..1
  threshold: number;
}

function distribute(total: number, weights: Record<number, number>): KeyCount[] {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  return Object.entries(weights).map(([code, w]) => ({
    code: Number(code) as KeyCode,
    count: Math.round((total * w) / sum),
  }));
}

export function generateMock(seed = 42): MockDataset {
  const rand = rng(seed);

  // 60 days back: weekday-pattern with noise
  const byDay60: DayTotal[] = [];
  const today = new Date();
  for (let i = 59; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dow = d.getDay(); // 0 = Sun
    const weekdayBoost = dow === 0 || dow === 6 ? 0.55 : 1;
    const base = 18000 * weekdayBoost;
    const noise = (rand() - 0.5) * 14000;
    const total = Math.max(800, Math.round(base + noise));
    byDay60.push({ day: isoDay(d), total });
  }

  const byDay30 = byDay60.slice(-30);
  const byDay7 = byDay60.slice(-7);
  const todayTotal = byDay60[byDay60.length - 1]!.total;
  const weekTotal = byDay7.reduce((a, b) => a + b.total, 0);
  const monthTotal = byDay30.reduce((a, b) => a + b.total, 0);
  const lifetimeTotal = byDay60.reduce((a, b) => a + b.total, 0) * 14; // ≈ ~2y

  // Streak: count back consecutive days with total > 100
  let streak = 0;
  for (let i = byDay60.length - 1; i >= 0; i--) {
    if (byDay60[i]!.total > 100) streak++;
    else break;
  }

  const todayKpm = Math.round((todayTotal / 60 / 7) * 1.0); // assume ~7h active

  // Per-key lifetime distribution
  const allWeights = { ...LETTER_FREQ, ...NON_LETTER_RATIO };
  const perKeyLifetime = distribute(lifetimeTotal, allWeights).sort(
    (a, b) => b.count - a.count,
  );

  // Hourly (today): bell-ish curve
  const hourly = Array.from({ length: 24 }, (_, h) => {
    const x = h - 14;
    const bell = Math.exp(-(x * x) / 24);
    const morning = h >= 9 && h <= 11 ? 0.4 : 0;
    const noise = rand() * 0.2;
    return Math.round(todayTotal * (bell * 0.07 + morning * 0.04 + noise * 0.02));
  });

  // Punch card: dow × hour
  const punchCard: number[][] = [];
  for (let dow = 0; dow < 7; dow++) {
    const row: number[] = [];
    for (let h = 0; h < 24; h++) {
      const weekend = dow === 0 || dow === 6;
      const x = h - 14;
      const bell = Math.exp(-(x * x) / 24);
      const v = bell * (weekend ? 0.4 : 1) * (1500 + rand() * 1000);
      row.push(Math.round(v));
    }
    punchCard.push(row);
  }

  const modifiers = {
    shift: Math.round(monthTotal * 0.075),
    ctrl: Math.round(monthTotal * 0.045),
    alt: Math.round(monthTotal * 0.012),
    meta: Math.round(monthTotal * 0.008),
  };

  const backspaceRatio = 0.062 + rand() * 0.04;

  const achievements: Achievement[] = [
    {
      id: "first_100",
      title: "First Steps",
      description: "Hit 100 keystrokes",
      earned: true,
      progress: 1,
      threshold: 100,
    },
    {
      id: "ten_k",
      title: "Warming Up",
      description: "Hit 10,000 keystrokes",
      earned: true,
      progress: 1,
      threshold: 10_000,
    },
    {
      id: "hundred_k",
      title: "Cruise Control",
      description: "Hit 100,000 keystrokes",
      earned: true,
      progress: 1,
      threshold: 100_000,
    },
    {
      id: "one_m",
      title: "Million Club",
      description: "Hit 1,000,000 keystrokes",
      earned: lifetimeTotal >= 1_000_000,
      progress: Math.min(1, lifetimeTotal / 1_000_000),
      threshold: 1_000_000,
    },
    {
      id: "ten_m",
      title: "Decimillion",
      description: "Hit 10,000,000 keystrokes",
      earned: false,
      progress: Math.min(1, lifetimeTotal / 10_000_000),
      threshold: 10_000_000,
    },
    {
      id: "streak_7",
      title: "Weeklong",
      description: "7-day streak",
      earned: streak >= 7,
      progress: Math.min(1, streak / 7),
      threshold: 7,
    },
    {
      id: "streak_30",
      title: "Marathon",
      description: "30-day streak",
      earned: streak >= 30,
      progress: Math.min(1, streak / 30),
      threshold: 30,
    },
  ];

  return {
    todayTotal,
    todayKpm,
    weekTotal,
    monthTotal,
    lifetimeTotal,
    streak,
    byDay30,
    byDay7,
    perKeyLifetime,
    hourly,
    punchCard,
    modifiers,
    backspaceRatio,
    achievements,
  };
}
