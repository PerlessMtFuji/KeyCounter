import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { useStore } from "@/store/useStore";
import { api, isTauri } from "@/lib/api";
import { LAYOUT_NAMES, type LayoutId } from "@/lib/layouts";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";

interface ToggleProps {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

function Toggle({ label, hint, value, onChange, disabled }: ToggleProps) {
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
        disabled={disabled}
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
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
  const paused = useStore((s) => s.paused);
  const togglePaused = useStore((s) => s.togglePaused);
  const layout = useStore((s) => s.layout);
  const setLayout = useStore((s) => s.setLayout);
  const refreshAll = useStore((s) => s.refreshAll);
  const [autostart, setAutostart] = useState(false);
  const [dbPath, setDbPath] = useState<string>("");
  const [version, setVersion] = useState<string>("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isTauri()) {
      setDbPath("(browser preview — no database)");
      setVersion("0.1.0");
      return;
    }
    api.appInfo().then((info) => {
      setDbPath(info.db_path);
      setVersion(info.version);
    });
    invoke<boolean>("plugin:autostart|is_enabled").then(setAutostart).catch(() => {});
  }, []);

  async function onAutostartChange(v: boolean) {
    if (!isTauri()) return;
    try {
      await invoke(v ? "plugin:autostart|enable" : "plugin:autostart|disable");
      setAutostart(v);
    } catch (e) {
      console.error(e);
    }
  }

  async function onExport() {
    if (!isTauri()) return;
    setBusy(true);
    try {
      const data = await api.exportData();
      const path = await save({
        defaultPath: `keycounter-export-${new Date().toISOString().slice(0, 10)}.json`,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (path) await writeTextFile(path, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  async function onReset() {
    if (!isTauri()) return;
    setBusy(true);
    try {
      await api.resetDatabase();
      await refreshAll();
      setConfirmReset(false);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

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
          Everything stays on this machine.
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
            hint="Launch KeyCounter when you log in."
            value={autostart}
            onChange={onAutostartChange}
            disabled={!isTauri()}
          />
        </div>
      </GlassCard>

      <GlassCard delay={0.1}>
        <div className="text-[11px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
          Display
        </div>
        <div className="mt-2 divide-y divide-white/[0.04]">
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm">Keyboard layout</div>
              <div className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">
                Affects how labels are drawn on the heatmap. Counts are
                physical-position based and never change.
              </div>
            </div>
            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value as LayoutId)}
              className="cursor-pointer rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs outline-none"
            >
              {(Object.keys(LAYOUT_NAMES) as LayoutId[]).map((id) => (
                <option key={id} value={id} className="bg-zinc-900">
                  {LAYOUT_NAMES[id]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      <GlassCard delay={0.15}>
        <div className="text-[11px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
          Data
        </div>
        <div className="mt-2 divide-y divide-white/[0.04]">
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm">Database location</div>
              <div className="mt-0.5 break-all font-mono text-[11px] text-[var(--color-text-muted)]">
                {dbPath}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm">Export</div>
              <div className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">
                Save all counters to a JSON file.
              </div>
            </div>
            <button
              onClick={onExport}
              disabled={!isTauri() || busy}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium transition hover:bg-white/[0.06] disabled:opacity-40"
            >
              Export…
            </button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm">Reset all data</div>
              <div className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">
                Wipes the local database. Cannot be undone.
              </div>
            </div>
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                disabled={!isTauri()}
                className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-400/20 disabled:opacity-40"
              >
                Reset
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmReset(false)}
                  className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={onReset}
                  disabled={busy}
                  className="rounded-lg border border-rose-400/40 bg-rose-500/30 px-3 py-1.5 text-xs font-medium text-rose-100 disabled:opacity-40"
                >
                  Confirm reset
                </button>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      <GlassCard delay={0.2}>
        <div className="text-[11px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
          About
        </div>
        <div className="mt-3 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Version</span>
            <span className="tabular-nums">{version || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">License</span>
            <span>MIT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Privacy</span>
            <span>counts only · no network</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
