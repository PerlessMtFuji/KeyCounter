import { motion } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import { useStore, type View } from "@/store/useStore";
import { isTauri } from "@/lib/api";
import { useT, type TranslationKey } from "@/lib/i18n";

interface Item {
  view: View;
  labelKey: TranslationKey;
  icon: string;
}

const ITEMS: Item[] = [
  { view: "dashboard", labelKey: "nav.dashboard", icon: "M3 12l9-9 9 9M5 10v10a1 1 0 0 0 1 1h4v-7h4v7h4a1 1 0 0 0 1-1V10" },
  { view: "heatmap", labelKey: "nav.heatmap", icon: "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7l-4 4z" },
  { view: "stats", labelKey: "nav.stats", icon: "M3 21V8m6 13V3m6 18v-9m6 9V13" },
  { view: "achievements", labelKey: "nav.achievements", icon: "M12 2l3 7h7l-5.5 4 2 7-6.5-4.5L5 20l2-7L1.5 9h7z" },
  { view: "settings", labelKey: "nav.settings", icon: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm9 4a8.96 8.96 0 0 0-.6-3.2l1.7-1.4-2-3.5-2 .8a9 9 0 0 0-2.7-1.6L15 1h-4l-.4 2.1a9 9 0 0 0-2.7 1.6l-2-.8-2 3.5 1.7 1.4A8.96 8.96 0 0 0 5 12c0 1.1.2 2.2.6 3.2L4 16.6l2 3.5 2-.8a9 9 0 0 0 2.7 1.6L11 23h4l.4-2.1a9 9 0 0 0 2.7-1.6l2 .8 2-3.5-1.7-1.4c.4-1 .6-2.1.6-3.2z" },
];

export function Sidebar() {
  const { view, setView, paused, togglePaused } = useStore();
  const pushError = useStore((s) => s.pushError);
  const t = useT();

  async function openWidget() {
    if (!isTauri()) return;
    try {
      await invoke("open_widget");
    } catch (e) {
      pushError(
        "Could not open the floating widget",
        e instanceof Error ? e.message : String(e),
      );
    }
  }

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
              className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${
                active
                  ? "text-[var(--color-text-primary)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl border border-[var(--color-glass-stroke)] bg-[var(--color-accent-soft)]"
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
              <span className="relative">{t(it.labelKey)}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2">
        <button
          onClick={openWidget}
          disabled={!isTauri()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-glass-stroke)] bg-white/[0.02] px-3 py-2 text-[11px] font-medium text-[var(--color-text-muted)] hover:bg-white/[0.05] hover:text-[var(--color-text-primary)] disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 9h6v6H9z" />
          </svg>
          {t("nav.widget")}
        </button>
        <button
          onClick={togglePaused}
          className="glass flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm hover:bg-white/[0.06]"
        >
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              {/* Static dot — `animate-ping` was an infinite CSS keyframe
                  (1s loop, opacity + scale) that ran for the entire app
                  lifetime and forced the layer to be re-composited each
                  frame, even when the sidebar wasn't visible (it never
                  unmounts). Color alone is enough to communicate state. */}
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  paused ? "bg-amber-400" : "bg-emerald-400"
                }`}
              />
            </span>
            <span className="text-[11px] font-medium">
              {paused ? t("nav.paused") : t("nav.recording")}
            </span>
          </div>
          <span className="text-[10px] text-[var(--color-text-muted)]">
            {paused ? t("nav.resume") : t("nav.pause")}
          </span>
        </button>
      </div>
    </aside>
  );
}
