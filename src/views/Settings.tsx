import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { useStore } from "@/store/useStore";

interface ToggleProps {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ label, hint, value, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="min-w-0">
        <div className="text-sm">{label}</div>
        {hint && (
          <div className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">
            {hint}
          </div>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          value ? "bg-[var(--color-accent)]" : "bg-white/[0.08]"
        }`}
      >
        <motion.span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
          animate={{ left: value ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 600, damping: 30 }}
        />
      </button>
    </div>
  );
}

export function Settings() {
  const { paused, togglePaused } = useStore();

  return (
    <div className="space-y-6">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-semibold tracking-tight"
        >
          Settings
        </motion.h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Most options become functional in Phase 6.
        </p>
      </div>

      <GlassCard delay={0.05}>
        <div className="text-[11px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
          Recording
        </div>
        <div className="mt-2 divide-y divide-white/[0.04]">
          <Toggle
            label="Pause counting"
            hint="Hook stays installed; events are silently dropped."
            value={paused}
            onChange={togglePaused}
          />
          <Toggle
            label="Start with system"
            hint="Launch KeyCounter on login (Phase 6)."
            value={false}
            onChange={() => {}}
          />
          <Toggle
            label="Minimize to tray on close"
            hint="Keeps counting in the background (Phase 4)."
            value={true}
            onChange={() => {}}
          />
        </div>
      </GlassCard>

      <GlassCard delay={0.1}>
        <div className="text-[11px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
          Privacy
        </div>
        <div className="mt-2 divide-y divide-white/[0.04]">
          <Toggle
            label="Track n-grams (opt-in)"
            hint="Counts of 2- and 3-key code sequences. Never decoded back to text."
            value={false}
            onChange={() => {}}
          />
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm">Database location</div>
              <div className="mt-0.5 break-all font-mono text-[11px] text-[var(--color-text-muted)]">
                %APPDATA%/io.keycounter.app/keycounter.db
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm">Reset all data</div>
              <div className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">
                Wipes the local database. Cannot be undone.
              </div>
            </div>
            <button className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-400/20">
              Reset
            </button>
          </div>
        </div>
      </GlassCard>

      <GlassCard delay={0.15}>
        <div className="text-[11px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
          About
        </div>
        <div className="mt-3 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Version</span>
            <span className="tabular-nums">0.1.0 (Phase 3)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">License</span>
            <span>MIT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Source</span>
            <span className="font-mono text-xs">github.com/.../keycounter</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
