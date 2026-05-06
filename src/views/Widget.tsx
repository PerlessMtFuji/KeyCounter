import { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { api, isTauri } from "@/lib/api";
import { recordPulse, useStore } from "@/store/useStore";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { formatNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";

const SIZE_FULL: [number, number] = [240, 110];
const SIZE_COMPACT: [number, number] = [168, 36];

// Standalone window: minimal always-on-top KPM/today display.
// Each Tauri window has its own JS context, so we re-hydrate the store
// via the same API helpers used by the main window.

export function Widget() {
  const liveKpm = useStore((s) => s.liveKpm);
  const pulseTick = useStore((s) => s.pulseTick);
  const todayTotal = useStore((s) => s.today?.total ?? 0);
  const paused = useStore((s) => s.paused);
  const widgetMode = useStore((s) => s.widgetMode);
  const widgetSnap = useStore((s) => s.widgetSnap);
  const widgetOpacity = useStore((s) => s.widgetOpacity);
  const widgetTint = useStore((s) => s.widgetTint);
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

  // Resize the window when mode changes. After resize, re-snap to the
  // taskbar corner if snap is enabled (the new size would otherwise
  // leave the widget anchored at its old top-left).
  useEffect(() => {
    if (!isTauri()) return;
    const [w, h] = widgetMode === "compact" ? SIZE_COMPACT : SIZE_FULL;
    getCurrentWindow()
      .setSize(new LogicalSize(w, h))
      .then(() => {
        if (useStore.getState().widgetSnap) {
          return invoke("snap_widget_to_taskbar");
        }
      })
      .catch((e) => console.error("widget setSize/snap failed:", e));
  }, [widgetMode]);

  // Snap-to-taskbar lifecycle: re-position whenever snap is freshly
  // enabled, when the window becomes visible (open from sidebar/tray),
  // and on mount.
  useEffect(() => {
    if (!isTauri() || !widgetSnap) return;
    invoke("snap_widget_to_taskbar").catch((e) =>
      console.error("snap failed:", e),
    );
  }, [widgetSnap]);

  useEffect(() => {
    if (!isTauri()) return;
    const onVisChange = () => {
      if (
        document.visibilityState === "visible" &&
        useStore.getState().widgetSnap
      ) {
        invoke("snap_widget_to_taskbar").catch((e) =>
          console.error("snap failed:", e),
        );
      }
    };
    document.addEventListener("visibilitychange", onVisChange);
    return () => document.removeEventListener("visibilitychange", onVisChange);
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
      // Hide instead of close — the window is declared in tauri.conf.json
      // with `visible: false` and we just toggle visibility from then on.
      // Closing would destroy it; the next open_widget call would have
      // nothing to re-show.
      await getCurrentWindow().hide();
    } catch (e) {
      console.error(e);
    }
  }

  if (widgetMode === "compact") {
    return (
      <CompactWidget
        liveKpm={liveKpm}
        pulseTick={pulseTick}
        paused={paused}
        kpmLabel={t("widget.kpm")}
        opacity={widgetOpacity}
        tint={widgetTint}
        onTogglePause={togglePause}
        onOpenMain={openMain}
        onClose={closeWidget}
      />
    );
  }

  return (
    <FullWidget
      liveKpm={liveKpm}
      pulseTick={pulseTick}
      todayTotal={todayTotal}
      paused={paused}
      labels={{
        kpm: t("widget.kpm"),
        today: t("widget.today"),
      }}
      onTogglePause={togglePause}
      onOpenMain={openMain}
      onClose={closeWidget}
    />
  );
}

interface CompactProps {
  liveKpm: number;
  pulseTick: number;
  paused: boolean;
  kpmLabel: string;
  opacity: number;
  tint: string;
  onTogglePause: () => void;
  onOpenMain: () => void;
  onClose: () => void;
}

function CompactWidget({
  liveKpm,
  pulseTick,
  paused,
  kpmLabel,
  opacity,
  tint,
  onTogglePause,
  onOpenMain,
  onClose,
}: CompactProps) {
  // Translucent pill — gradient + inner highlights read as a glassy
  // object. The user-controlled opacity and tint dial in the look
  // against any wallpaper.
  const bg = useMemo(() => buildPillBackground(opacity, tint), [opacity, tint]);
  return (
    <div
      data-tauri-drag-region
      className="group relative flex h-full w-full select-none items-center gap-1.5 rounded-full border border-[var(--color-glass-stroke)] py-1 pr-1.5 pl-2"
      style={{
        background: bg,
        boxShadow:
          "inset 0 1px 0 rgba(255, 255, 255, 0.10), " +
          "inset 0 -1px 0 rgba(0, 0, 0, 0.18)",
      }}
    >
      <span
        data-tauri-drag-region
        className="relative flex h-4 w-4 shrink-0 items-center justify-center"
      >
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
      <AnimatedNumber
        value={liveKpm}
        duration={0.6}
        format={(n) => Math.round(n).toString()}
        className="text-sm font-semibold leading-none tabular-nums text-[var(--color-text-primary)]"
      />
      <span
        data-tauri-drag-region
        className="text-[9px] font-medium tracking-wider text-[var(--color-text-muted)] uppercase"
      >
        {kpmLabel}
      </span>
      <span data-tauri-drag-region className="ml-auto" />
      <PillIconButton
        onClick={onTogglePause}
        title={paused ? "Resume" : "Pause"}
      >
        {paused ? (
          <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="currentColor">
            <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
          </svg>
        )}
      </PillIconButton>
      <PillIconButton onClick={onOpenMain} title="Open KeyCounter">
        <svg
          viewBox="0 0 24 24"
          className="h-2.5 w-2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 3h7v7" />
          <path d="M21 3l-9 9" />
          <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
        </svg>
      </PillIconButton>
      <PillIconButton onClick={onClose} title="Hide">
        <svg
          viewBox="0 0 24 24"
          className="h-2.5 w-2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </PillIconButton>
    </div>
  );
}

function PillIconButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-[var(--color-text-muted)] opacity-0 transition group-hover:opacity-100 hover:text-[var(--color-text-primary)]"
    >
      {children}
    </button>
  );
}

// Build the pill's background gradient from user-controlled opacity (10-100)
// and an optional hex tint. When tint is empty we fall back to the theme's
// elevated bg, which means the pill follows light/dark mode automatically.
function buildPillBackground(opacity: number, tint: string): string {
  const top = Math.max(10, Math.min(100, Math.round(opacity)));
  const bottom = Math.max(10, top - 16);
  const base =
    tint && /^#[0-9a-fA-F]{6}$/.test(tint)
      ? tint
      : "var(--color-bg-elevated)";
  return (
    "linear-gradient(135deg, " +
    `color-mix(in srgb, ${base} ${top}%, transparent), ` +
    `color-mix(in srgb, ${base} ${bottom}%, transparent))`
  );
}

interface FullProps {
  liveKpm: number;
  pulseTick: number;
  todayTotal: number;
  paused: boolean;
  labels: { kpm: string; today: string };
  onTogglePause: () => void;
  onOpenMain: () => void;
  onClose: () => void;
}

function FullWidget({
  liveKpm,
  pulseTick,
  todayTotal,
  paused,
  labels,
  onTogglePause,
  onOpenMain,
  onClose,
}: FullProps) {
  return (
    <div
      data-tauri-drag-region
      className="bg-fallback noise relative flex h-full w-full select-none flex-col overflow-hidden rounded-2xl border border-[var(--color-glass-stroke)] p-3"
    >
      <WidgetHeader
        pulseTick={pulseTick}
        paused={paused}
        onTogglePause={onTogglePause}
        onOpenMain={onOpenMain}
        onClose={onClose}
      />
      <WidgetBody
        liveKpm={liveKpm}
        todayTotal={todayTotal}
        labels={labels}
      />
    </div>
  );
}

interface HeaderProps {
  pulseTick: number;
  paused: boolean;
  onTogglePause: () => void;
  onOpenMain: () => void;
  onClose: () => void;
}

function WidgetHeader({
  pulseTick,
  paused,
  onTogglePause,
  onOpenMain,
  onClose,
}: HeaderProps) {
  return (
    <div data-tauri-drag-region className="flex items-center justify-between">
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
          onClick={onTogglePause}
          title={paused ? "Resume" : "Pause"}
          className="flex h-5 w-5 items-center justify-center rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
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
          onClick={onOpenMain}
          title="Open KeyCounter"
          className="flex h-5 w-5 items-center justify-center rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 3h7v7" />
            <path d="M21 3l-9 9" />
            <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
          </svg>
        </button>
        <button
          onClick={onClose}
          title="Hide widget"
          className="flex h-5 w-5 items-center justify-center rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

interface BodyProps {
  liveKpm: number;
  todayTotal: number;
  labels: { kpm: string; today: string };
}

function WidgetBody({ liveKpm, todayTotal, labels }: BodyProps) {
  return (
    <div data-tauri-drag-region className="mt-2 flex items-end justify-between">
      <div data-tauri-drag-region>
        <div className="text-[9px] tracking-wider text-[var(--color-text-muted)] uppercase">
          {labels.kpm}
        </div>
        <div className="bg-gradient-to-r from-violet-300 to-sky-300 bg-clip-text text-3xl font-semibold leading-none tracking-tight tabular-nums text-transparent">
          <AnimatedNumber
            value={liveKpm}
            duration={0.6}
            format={(n) => Math.round(n).toString()}
          />
        </div>
      </div>
      <div data-tauri-drag-region className="text-right">
        <div className="text-[9px] tracking-wider text-[var(--color-text-muted)] uppercase">
          {labels.today}
        </div>
        <div className="text-base font-semibold leading-none tabular-nums">
          <AnimatedNumber value={todayTotal} format={formatNumber} />
        </div>
      </div>
    </div>
  );
}
