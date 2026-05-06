import { useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { LivePulse } from "@/components/ui/LivePulse";
import { MilestoneToast } from "@/components/ui/MilestoneToast";
import { ErrorToast } from "@/components/ui/ErrorToast";
import { Dashboard } from "@/views/Dashboard";
import { Heatmap } from "@/views/Heatmap";
import { Stats } from "@/views/Stats";
import { Achievements } from "@/views/Achievements";
import { Settings } from "@/views/Settings";
import { Welcome } from "@/views/Welcome";
import { Widget } from "@/views/Widget";
import { useStore, recordPulse } from "@/store/useStore";
import { api, isTauri } from "@/lib/api";
import type { LayoutId } from "@/lib/layouts";
import type { Lang } from "@/lib/i18n";

const VIEWS = {
  dashboard: Dashboard,
  heatmap: Heatmap,
  stats: Stats,
  achievements: Achievements,
  settings: Settings,
} as const;

// Tauri windows share the same index.html. We dispatch on `window.label`
// at runtime: the main window renders the full app; the floating "widget"
// window renders its compact view. This avoids multi-page Vite setup
// entirely (which was failing to serve widget.html through Tauri).
function getWindowLabel(): string {
  if (typeof window === "undefined") return "main";
  const internals = (window as any).__TAURI_INTERNALS__;
  return internals?.metadata?.currentWindow?.label ?? "main";
}

// Cross-window settings sync: each Tauri window has its own JS context and
// its own in-memory Zustand store. When the user changes a setting in one
// window (e.g. widget mode in main → reshape the floating widget), the
// other window's store needs to learn about it. localStorage is shared
// across same-origin windows in the same WebView profile, and the
// `storage` event fires in *other* contexts on every write — exactly
// what we need.
function useCrossWindowSettingsSync() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.newValue === null) return;
      const v = e.newValue;
      switch (e.key) {
        case "kc-widget-mode":
          if (v === "full" || v === "compact") {
            useStore.setState({ widgetMode: v });
          }
          break;
        case "kc-widget-snap":
          useStore.setState({ widgetSnap: v === "1" });
          break;
        case "kc-widget-opacity": {
          const n = Number(v);
          if (Number.isFinite(n)) {
            useStore.setState({
              widgetOpacity: Math.max(10, Math.min(100, Math.round(n))),
            });
          }
          break;
        }
        case "kc-widget-tint":
          useStore.setState({ widgetTint: v });
          break;
        case "kc-theme":
          if (v === "dark" || v === "light") {
            useStore.getState().setTheme(v);
          }
          break;
        case "kc-lang":
          if (v === "en" || v === "pl") {
            useStore.setState({ lang: v as Lang });
          }
          break;
        case "kc-layout":
          useStore.setState({ layout: v as LayoutId });
          break;
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
}

function App() {
  useCrossWindowSettingsSync();
  const label = getWindowLabel();
  if (label === "widget") {
    return <WidgetShell />;
  }
  return <MainShell />;
}

// The widget runs in its own webview. Previously the shell here pulled
// in the full store init() (permissions check, lifetime totals, top
// keys, hourly buckets, punch card, calendar, heatmap keys, range
// stats) and then polled refreshAll on a 5-second timer — an order of
// magnitude more queries + IPC + setState than the widget actually
// renders. The inner <Widget /> already runs its own minimal refresh
// (paused + today total only, every 5s, paused while hidden) and
// subscribes to live-pulse with a hidden-document guard. So the shell
// doesn't need to do anything but render.
function WidgetShell() {
  return <Widget />;
}

function MainShell() {
  const view = useStore((s) => s.view);
  const init = useStore((s) => s.init);
  const refreshLive = useStore((s) => s.refreshLive);
  const refreshAll = useStore((s) => s.refreshAll);
  const permissions = useStore((s) => s.permissions);
  const View = VIEWS[view];

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!isTauri()) return;
    let mounted = true;
    let unlisten: (() => void) | null = null;
    api
      .onLivePulse((p) => {
        if (!mounted) return;
        // Skip pulse handling when this window is hidden — Tauri keeps
        // emitting events to hidden webviews, but the ripple animation
        // and store updates are wasted work no one can see.
        if (typeof document !== "undefined" && document.hidden) return;
        recordPulse(p.delta);
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

  // Refresh timers — only run while the window is actually visible.
  // Hiding the window to the tray was previously still ticking these
  // every 2 / 5 seconds, fetching data the user couldn't see.
  useEffect(() => {
    if (!isTauri()) return;
    let liveTimer: ReturnType<typeof setInterval> | undefined;
    let allTimer: ReturnType<typeof setInterval> | undefined;

    function start() {
      stop();
      liveTimer = setInterval(refreshLive, 2000);
      allTimer = setInterval(refreshAll, 5_000);
    }
    function stop() {
      if (liveTimer) clearInterval(liveTimer);
      if (allTimer) clearInterval(allTimer);
      liveTimer = undefined;
      allTimer = undefined;
    }
    function onVisibility() {
      if (document.hidden) {
        stop();
      } else {
        // Refresh once immediately on re-show, then resume the timers.
        refreshLive().catch(() => {});
        refreshAll().catch(() => {});
        start();
      }
    }

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, [refreshLive, refreshAll]);

  if (permissions && !permissions.accessibility) {
    return <Welcome />;
  }

  return (
    <div className="bg-fallback noise relative flex h-full w-full overflow-hidden">
      <Sidebar />
      <main className="relative flex-1 overflow-y-auto">
        <div className="sticky top-0 z-20 flex justify-end px-8 pt-5">
          <LivePulse />
        </div>
        <div className="mx-auto -mt-2 max-w-6xl px-8 pb-10">
          {/* No AnimatePresence wrapper here on purpose. Each view brings
              its own per-element enter animations (h1, GlassCard, etc.),
              and the Heatmap mounts ~70 motion.div keys with staggered
              delays + a layoutId pill. With mode="wait" + layoutId in
              the unmounting subtree, framer-motion sporadically failed
              to finish the exit animation and left the old view ghost-
              mounted under the new one — visible as an empty tab whose
              keyboard heatmap was still tooltip-interactive. */}
          <View key={view} />
        </div>
      </main>
      <MilestoneToast />
      <ErrorToast />
    </div>
  );
}

export default App;
