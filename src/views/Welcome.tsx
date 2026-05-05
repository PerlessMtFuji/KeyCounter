import { motion } from "framer-motion";
import { open } from "@tauri-apps/plugin-shell";
import { useStore } from "@/store/useStore";

const MAC_PRIVACY_URL =
  "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility";

export function Welcome() {
  const checkPermissions = useStore((s) => s.checkPermissions);

  return (
    <div className="bg-fallback noise relative flex h-full w-full items-center justify-center overflow-hidden p-8">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass relative w-full max-w-xl rounded-3xl p-10"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-orange-400 shadow-lg shadow-orange-500/40">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
          </div>
          <span className="text-xs font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
            One-time setup
          </span>
        </div>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          KeyCounter needs Accessibility permission
        </h1>

        <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
          <p>
            macOS requires explicit user permission for any app that observes
            global keyboard input — this is the same primitive a keylogger
            would use, so the OS forces a deliberate opt-in.
          </p>
          <p>
            KeyCounter only counts presses; it never stores characters,
            words, or sequences. The implementation is one small file you
            can read on GitHub.
          </p>
        </div>

        <ol className="mt-6 space-y-3 text-sm">
          {[
            "Click “Open System Settings” below.",
            "Find KeyCounter in the Accessibility list.",
            "Toggle it on. macOS may ask you to quit and re-launch.",
            "Come back and click “I granted access”.",
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-[var(--color-accent-soft)] text-xs font-semibold">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex gap-3">
          <button
            onClick={() => open(MAC_PRIVACY_URL).catch(console.error)}
            className="rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110"
          >
            Open System Settings
          </button>
          <button
            onClick={() => checkPermissions()}
            className="rounded-xl border border-[var(--color-glass-stroke)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-muted)] transition hover:text-white"
          >
            I granted access
          </button>
        </div>
      </motion.div>
    </div>
  );
}
