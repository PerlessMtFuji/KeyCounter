import { create } from "zustand";
import { generateMock, type MockDataset } from "@/data/mock";

export type View =
  | "dashboard"
  | "heatmap"
  | "stats"
  | "achievements"
  | "settings";

interface AppState {
  view: View;
  setView: (v: View) => void;
  paused: boolean;
  togglePaused: () => void;
  data: MockDataset;
  liveKpm: number;
  setLiveKpm: (n: number) => void;
}

export const useStore = create<AppState>((set) => ({
  view: "dashboard",
  setView: (v) => set({ view: v }),
  paused: false,
  togglePaused: () => set((s) => ({ paused: !s.paused })),
  data: generateMock(42),
  liveKpm: 0,
  setLiveKpm: (n) => set({ liveKpm: n }),
}));
