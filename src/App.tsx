import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Dashboard } from "@/views/Dashboard";
import { Heatmap } from "@/views/Heatmap";
import { Stats } from "@/views/Stats";
import { Achievements } from "@/views/Achievements";
import { Settings } from "@/views/Settings";
import { useStore } from "@/store/useStore";

const VIEWS = {
  dashboard: Dashboard,
  heatmap: Heatmap,
  stats: Stats,
  achievements: Achievements,
  settings: Settings,
} as const;

function App() {
  const view = useStore((s) => s.view);
  const View = VIEWS[view];

  return (
    <div className="bg-fallback noise relative flex h-full w-full overflow-hidden">
      <Sidebar />
      <main className="relative flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-10">
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
