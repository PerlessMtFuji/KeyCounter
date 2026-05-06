import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";

export function ErrorToast() {
  const errors = useStore((s) => s.errors);
  const dismissError = useStore((s) => s.dismissError);

  return (
    <div className="pointer-events-none fixed top-4 left-1/2 z-[100] flex -translate-x-1/2 flex-col gap-2">
      <AnimatePresence>
        {errors.map((err) => (
          <motion.div
            key={err.id}
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="pointer-events-auto flex max-w-md items-start gap-3 rounded-xl border border-rose-400/30 bg-[#28121a]/95 px-4 py-3 text-xs shadow-2xl"
          >
            <svg
              viewBox="0 0 24 24"
              className="mt-0.5 h-4 w-4 shrink-0 text-rose-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-rose-200">{err.title}</div>
              {err.detail && (
                <div className="mt-0.5 break-all font-mono text-[10px] text-rose-300/80">
                  {err.detail}
                </div>
              )}
            </div>
            <button
              onClick={() => dismissError(err.id)}
              className="text-rose-300/70 hover:text-rose-200"
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
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
