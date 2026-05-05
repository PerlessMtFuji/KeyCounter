import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { LivePulse } from "@/components/ui/LivePulse";
import { Dashboard } from "@/views/Dashboard";
import { Heatmap } from "@/views/Heatmap";
import { Stats } from "@/views/Stats";
import { Achievements } from "@/views/Achievements";
import { Settings } from "@/views/Settings";
import { Welcome } from "@/views/Welcome";
import { useStore, recordPulse } from "@/store/useStore";
import { api, isTauri } from "@/lib/api";

const VIEWS = {
  dashboard: Dashboard,
  heatmap: Heatmap,
  stats: Stats,
  achievements: Achievements,
  settings: Settings,
} as const;

function App() {
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
    const allTimer = setInterval(refreshAll, 30_000);
    return () => {
      clearInterval(liveTimer);
      clearInterval(allTimer);
    };
  }, [refreshLive, refreshAll]);

  // Block UI behind welcome screen if Accessibility permission is missing
  // (macOS only — on Win/Linux `permissions.accessibility` is always true).
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
    </div>
  );
}

export default App;
