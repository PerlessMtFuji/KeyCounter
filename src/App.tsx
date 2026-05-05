import { motion } from "framer-motion";

function App() {
  return (
    <div className="bg-fallback noise relative h-full w-full overflow-hidden">
      <main className="relative flex h-full w-full items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="glass relative w-full max-w-xl rounded-3xl p-10 shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-accent)] shadow-[0_0_12px_var(--color-accent)]" />
            <span className="text-xs font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
              KeyCounter · v0.1
            </span>
          </div>

          <h1 className="mt-6 text-5xl font-semibold tracking-tight">
            Hello,{" "}
            <span className="bg-gradient-to-r from-[var(--color-accent)] to-sky-400 bg-clip-text text-transparent">
              keyboard
            </span>
            .
          </h1>

          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[var(--color-text-muted)]">
            Privacy-first keystroke analytics. Counts only — never content.
            Backend, heatmap and stats coming online in the next phases.
          </p>

          <div className="mt-8 flex gap-3">
            <button className="rounded-xl border border-[var(--color-glass-stroke)] bg-[var(--color-accent-soft)] px-5 py-2.5 text-sm font-medium transition hover:bg-[var(--color-accent)]/30">
              Get started
            </button>
            <button className="rounded-xl border border-[var(--color-glass-stroke)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-muted)] transition hover:text-white">
              Privacy
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default App;
