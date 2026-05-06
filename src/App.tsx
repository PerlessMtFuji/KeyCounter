import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
          if (v === "full" || v === "compact" || v === "acrylic") {
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

function WidgetShell() {
  const init = useStore((s) => s.init);
  const refreshLive = useStore((s) => s.refreshLive);
  const refreshAll = useStore((s) => s.refreshAll);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!isTauri()) return;
    let mounted = true;
    let unlisten: (() => void) | null = null;
    api.onLivePulse((p) => {
      if (mounted) recordPulse(p.delta);
    }).then((u) => {
      if (mounted) unlisten = u;
      else u();
    });
    return () => {
      mounted = false;
      unlisten?.();
    };
  }, []);

  useEffect(() => {
    if (!isTauri()) return;
    const liveTimer = setInterval(refreshLive, 2000);
    const allTimer = setInterval(refreshAll, 5_000);
    return () => {
      clearInterval(liveTimer);
      clearInterval(allTimer);
    };
  }, [refreshLive, refreshAll]);

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
    api.onLivePulse((p) => {
      if (mounted) recordPulse(p.delta);
    }).then((u) => {
      if (mounted) unlisten = u;
      else u();
    });
    return () => {
      mounted = false;
      unlisten?.();
    };
  }, []);

  useEffect(() => {
    if (!isTauri()) return;
    const liveTimer = setInterval(refreshLive, 2000);
    const allTimer = setInterval(refreshAll, 5_000);
    return () => {
      clearInterval(liveTimer);
      clearInterval(allTimer);
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
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <View />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <MilestoneToast />
      <ErrorToast />
    </div>
  );
}

export default App;
