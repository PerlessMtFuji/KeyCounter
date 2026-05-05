import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { api, isTauri } from "@/lib/api";
import { recordPulse, useStore } from "@/store/useStore";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { formatNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";

// Standalone window: minimal always-on-top KPM/today display.
// Each Tauri window has its own JS context, so we re-hydrate the store
// via the same API helpers used by the main window.

export function Widget() {
  const liveKpm = useStore((s) => s.liveKpm);
  const pulseTick = useStore((s) => s.pulseTick);
  const todayTotal = useStore((s) => s.today?.total ?? 0);
  const paused = useStore((s) => s.paused);
  const t = useT();

  // Subscribe to live-pulse events (broadcast by backend to all windows)
  useEffect(() => {
    if (!isTauri()) return;
    let mounted = true;
    let unlisten: (() => void) | null = null;
    api
      .onLivePulse((p) => {
        if (mounted) recordPulse(p.delta);
      })
      .then((u) => {
        if (mounted) unlisten = u;
        else u();
      });
    return () => {
      mounted = false;
      unlisten?.();
    };
  }, []);

  // Hydrate today/lifetime/paused on mount + every 5 s
  useEffect(() => {
    if (!isTauri()) return;
    const refresh = async () => {
      try {
        const [info, today] = await Promise.all([
          api.appInfo(),
          api.getTodayStats(),
        ]);
        useStore.setState({ paused: info.paused, today });
      } catch (e) {
        console.error(e);
      }
    };
    refresh();
    const i = setInterval(refresh, 5_000);
    return () => clearInterval(i);
  }, []);

  async function togglePause() {
    const next = !paused;
    useStore.setState({ paused: next });
    if (isTauri()) {
      try {
        await api.setPaused(next);
      } catch (e) {
        console.error(e);
      }
    }
  }

  async function openMain() {
    if (!isTauri()) return;
    try {
      await invoke("show_main");
    } catch (e) {
      console.error(e);
    }
  }

  async function closeWidget() {
    if (!isTauri()) return;
    try {
      await getCurrentWindow().close();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div
      data-tauri-drag-region
      className="bg-fallback noise relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] p-3 select-none"
    >
      <div
        data-tauri-drag-region
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-5 w-5 items-center justify-center">
            <AnimatePresence>
              <motion.span
                key={pulseTick}
                initial={{ scale: 0.6, opacity: 0.55 }}
                animate={{ scale: 2.4, opacity: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 rounded-full bg-emerald-400/40"
              />
            </AnimatePresence>
            <span
              className={`relative h-1.5 w-1.5 rounded-full ${
                paused
                  ? "bg-amber-400"
                  : pulseTick > 0
                    ? "bg-emerald-400"
                    : "bg-white/30"
              }`}
            />
          </span>
          <span className="text-[10px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
            KeyCounter
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={togglePause}
            title={paused ? "Resume" : "Pause"}
            className="flex h-5 w-5 items-center justify-center rounded text-[var(--color-text-muted)] hover:text-white"
          >
            {paused ? (
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
              </svg>
            )}
          </button>
          <button
            onClick={openMain}
            title="Open KeyCounter"
            className="flex h-5 w-5 items-center justify-center rounded text-[var(--color-text-muted)] hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 3h7v7" />
              <path d="M21 3l-9 9" />
              <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
            </svg>
          </button>
          <button
            onClick={closeWidget}
            title="Hide widget"
            className="flex h-5 w-5 items-center justify-center rounded text-[var(--color-text-muted)] hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </div>

      <div
        data-tauri-drag-region
        className="mt-2 flex items-end justify-between"
      >
        <div data-tauri-drag-region>
          <div className="text-[9px] tracking-wider text-[var(--color-text-muted)] uppercase">
            {t("widget.kpm")}
          </div>
          <div className="bg-gradient-to-r from-violet-300 to-sky-300 bg-clip-text text-3xl font-semibold tabular-nums tracking-tight text-transparent leading-none">
            <AnimatedNumber
              value={liveKpm}
              duration={0.6}
              format={(n) => Math.round(n).toString()}
            />
          </div>
        </div>
        <div data-tauri-drag-region className="text-right">
          <div className="text-[9px] tracking-wider text-[var(--color-text-muted)] uppercase">
            {t("widget.today")}
          </div>
          <div className="text-base font-semibold tabular-nums leading-none">
            <AnimatedNumber value={todayTotal} format={formatNumber} />
          </div>
        </div>
      </div>
    </div>
  );
}
