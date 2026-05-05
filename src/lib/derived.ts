import { KC } from "@/lib/keycode";
import type { DayStats } from "@/lib/api";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  progress: number;
  threshold: number;
}

export function backspaceRatio(today: DayStats | null): number {
  if (!today || today.total === 0) return 0;
  const back = today.by_code.find((k) => k.code === KC.Backspace);
  return (back?.count ?? 0) / today.total;
}

export function deriveAchievements(
  lifetime: number,
  streak: number,
): Achievement[] {
  const milestones: { id: string; title: string; description: string; threshold: number; current: number }[] = [
    {
      id: "first_100",
      title: "First Steps",
      description: "Hit 100 keystrokes",
      threshold: 100,
      current: lifetime,
    },
    {
      id: "ten_k",
      title: "Warming Up",
      description: "Hit 10,000 keystrokes",
      threshold: 10_000,
      current: lifetime,
    },
    {
      id: "hundred_k",
      title: "Cruise Control",
      description: "Hit 100,000 keystrokes",
      threshold: 100_000,
      current: lifetime,
    },
    {
      id: "one_m",
      title: "Million Club",
      description: "Hit 1,000,000 keystrokes",
      threshold: 1_000_000,
      current: lifetime,
    },
    {
      id: "ten_m",
      title: "Decimillion",
      description: "Hit 10,000,000 keystrokes",
      threshold: 10_000_000,
      current: lifetime,
    },
    {
      id: "streak_7",
      title: "Weeklong",
      description: "7-day streak",
      threshold: 7,
      current: streak,
    },
    {
      id: "streak_30",
      title: "Marathon",
      description: "30-day streak",
      threshold: 30,
      current: streak,
    },
  ];

  return milestones.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    threshold: m.threshold,
    progress: Math.min(1, m.current / m.threshold),
    earned: m.current >= m.threshold,
  }));
}
