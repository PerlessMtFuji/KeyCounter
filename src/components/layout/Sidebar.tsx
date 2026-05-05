import { motion } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import { useStore, type View } from "@/store/useStore";
import { isTauri } from "@/lib/api";

interface Item {
  view: View;
  label: string;
  icon: string;
}

const ITEMS: Item[] = [
  { view: "dashboard", label: "Dashboard", icon: "M3 12l9-9 9 9M5 10v10a1 1 0 0 0 1 1h4v-7h4v7h4a1 1 0 0 0 1-1V10" },
  { view: "heatmap", label: "Heatmap", icon: "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7l-4 4z" },
  { view: "stats", label: "Stats", icon: "M3 21V8m6 13V3m6 18v-9m6 9V13" },
  { view: "achievements", label: "Achievements", icon: "M12 2l3 7h7l-5.5 4 2 7-6.5-4.5L5 20l2-7L1.5 9h7z" },
  { view: "settings", label: "Settings", icon: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm9 4a8.96 8.96 0 0 0-.6-3.2l1.7-1.4-2-3.5-2 .8a9 9 0 0 0-2.7-1.6L15 1h-4l-.4 2.1a9 9 0 0 0-2.7 1.6l-2-.8-2 3.5 1.7 1.4A8.96 8.96 0 0 0 5 12c0 1.1.2 2.2.6 3.2L4 16.6l2 3.5 2-.8a9 9 0 0 0 2.7 1.6L11 23h4l.4-2.1a9 9 0 0 0 2.7-1.6l2 .8 2-3.5-1.7-1.4c.4-1 .6-2.1.6-3.2z" },
];

export function Sidebar() {
  const { view, setView, paused, togglePaused } = useStore();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-[var(--color-glass-stroke)] bg-white/[0.015] p-5">
      <div className="flex items-center gap-2.5 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-sky-400 shadow-lg shadow-violet-500/40">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="currentColor">
            <path d="M4 6h16v2H4zm0 5h10v2H4zm0 5h16v2H4z" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight">KeyCounter</div>
          <div className="text-[10px] text-[var(--color-text-muted)]">v0.1.0 · early</div>
        </div>
      </div>

      <nav className="mt-8 flex flex-col gap-1">
        {ITEMS.map((it) => {
          const active = view === it.view;
          return (
            <button
              key={it.view}
              onClick={() => setView(it.view)}
              className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                active
                  ? "text-white"
                  : "text-[var(--color-text-muted)] hover:text-white"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl border border-white/[0.06] bg-[var(--color-accent-soft)]"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="relative h-4 w-4"
              >
                <path d={it.icon} />
              </svg>
              <span className="relative">{it.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2">
        <button
          onClick={() => isTauri() && invoke("open_widget").catch(console.error)}
          disabled={!isTauri()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[11px] font-medium text-[var(--color-text-muted)] transition hover:bg-white/[0.05] hover:text-white disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 9h6v6H9z" />
          </svg>
          Floating widget
        </button>
        <button
          onClick={togglePaused}
          className="glass flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition hover:bg-white/[0.06]"
        >
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  paused ? "bg-amber-400" : "animate-ping bg-emerald-400"
                }`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  paused ? "bg-amber-400" : "bg-emerald-400"
                }`}
              />
            </span>
            <span className="text-[11px] font-medium">
              {paused ? "Paused" : "Recording"}
            </span>
          </div>
          <span className="text-[10px] text-[var(--color-text-muted)]">
            {paused ? "Resume" : "Pause"}
          </span>
        </button>
      </div>
    </aside>
  );
}
