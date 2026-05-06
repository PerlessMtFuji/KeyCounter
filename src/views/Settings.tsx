import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { useStore } from "@/store/useStore";
import { api, isTauri } from "@/lib/api";
import { LAYOUT_NAMES, type LayoutId } from "@/lib/layouts";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { useT, type Lang } from "@/lib/i18n";

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
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const widgetMode = useStore((s) => s.widgetMode);
  const setWidgetMode = useStore((s) => s.setWidgetMode);
  const widgetBlur = useStore((s) => s.widgetBlur);
  const setWidgetBlur = useStore((s) => s.setWidgetBlur);
  const widgetSnap = useStore((s) => s.widgetSnap);
  const setWidgetSnap = useStore((s) => s.setWidgetSnap);
  const widgetOpacity = useStore((s) => s.widgetOpacity);
  const setWidgetOpacity = useStore((s) => s.setWidgetOpacity);
  const widgetTint = useStore((s) => s.widgetTint);
  const setWidgetTint = useStore((s) => s.setWidgetTint);
  const refreshAll = useStore((s) => s.refreshAll);
  const [autostart, setAutostart] = useState(false);
  const [dbPath, setDbPath] = useState<string>("");
  const [version, setVersion] = useState<string>("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const t = useT();

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
    invoke<boolean>("plugin:autostart|is_enabled")
      .then(setAutostart)
      .catch(() => {});
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
          {t("settings.title")}
        </motion.h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {t("settings.subtitle")}
        </p>
      </div>

      <GlassCard delay={0.05}>
        <div className="text-[11px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
          {t("settings.recording")}
        </div>
        <div className="mt-2 divide-y divide-white/[0.04]">
          <Toggle
            label={t("settings.pauseLabel")}
            hint={t("settings.pauseHint")}
            value={paused}
            onChange={togglePaused}
          />
          <Toggle
            label={t("settings.autostartLabel")}
            hint={t("settings.autostartHint")}
            value={autostart}
            onChange={onAutostartChange}
            disabled={!isTauri()}
          />
        </div>
      </GlassCard>

      <GlassCard delay={0.1}>
        <div className="text-[11px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
          {t("settings.display")}
        </div>
        <div className="mt-2 divide-y divide-white/[0.04]">
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm">{t("settings.themeLabel")}</div>
            </div>
            <div className="flex rounded-lg border border-[var(--color-glass-stroke)] bg-white/[0.02] p-0.5 text-xs">
              {(["dark", "light"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setTheme(k)}
                  className={`rounded-md px-3 py-1.5 transition ${
                    theme === k
                      ? "bg-[var(--color-accent-soft)] text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-muted)]"
                  }`}
                >
                  {k === "dark" ? t("settings.themeDark") : t("settings.themeLight")}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm">{t("settings.langLabel")}</div>
            </div>
            <div className="flex rounded-lg border border-[var(--color-glass-stroke)] bg-white/[0.02] p-0.5 text-xs">
              {(["en", "pl"] as Lang[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setLang(k)}
                  className={`rounded-md px-3 py-1.5 transition ${
                    lang === k
                      ? "bg-[var(--color-accent-soft)] text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-muted)]"
                  }`}
                >
                  {k === "en" ? t("settings.langEn") : t("settings.langPl")}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm">{t("settings.layoutLabel")}</div>
              <div className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">
                {t("settings.layoutHint")}
              </div>
            </div>
            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value as LayoutId)}
              className="cursor-pointer rounded-lg border border-[var(--color-glass-stroke)] bg-white/[0.03] px-3 py-1.5 text-xs outline-none"
            >
              {(Object.keys(LAYOUT_NAMES) as LayoutId[]).map((id) => (
                <option key={id} value={id} className="bg-zinc-900">
                  {LAYOUT_NAMES[id]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between py-3">
            <div className="min-w-0 pr-3">
              <div className="text-sm">{t("widget.modeLabel")}</div>
              <div className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">
                {t("widget.modeHint")}
              </div>
            </div>
            <div className="flex shrink-0 rounded-lg border border-[var(--color-glass-stroke)] bg-white/[0.02] p-0.5 text-xs">
              {(["full", "compact"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setWidgetMode(m)}
                  className={`rounded-md px-3 py-1.5 transition ${
                    widgetMode === m
                      ? "bg-[var(--color-accent-soft)] text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-muted)]"
                  }`}
                >
                  {m === "full"
                    ? t("widget.modeFull")
                    : t("widget.modeCompact")}
                </button>
              ))}
            </div>
          </div>
          <Toggle
            label={t("widget.blurLabel")}
            hint={t("widget.blurHint")}
            value={widgetBlur}
            onChange={setWidgetBlur}
          />
          {widgetMode === "compact" && (
            <>
              <div className="flex items-center justify-between py-3">
                <div className="min-w-0 pr-3">
                  <div className="text-sm">{t("widget.opacityLabel")}</div>
                  <div className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">
                    {t("widget.opacityHint")}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={widgetOpacity}
                    onChange={(e) => setWidgetOpacity(Number(e.target.value))}
                    className="h-1 w-32 cursor-pointer appearance-none rounded-full bg-white/[0.08] accent-[var(--color-accent)]"
                  />
                  <span className="w-9 text-right text-xs tabular-nums text-[var(--color-text-muted)]">
                    {widgetOpacity}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="min-w-0 pr-3">
                  <div className="text-sm">{t("widget.tintLabel")}</div>
                  <div className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">
                    {t("widget.tintHint")}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <input
                    type="color"
                    value={
                      /^#[0-9a-fA-F]{6}$/.test(widgetTint)
                        ? widgetTint
                        : "#1a1a22"
                    }
                    onChange={(e) => setWidgetTint(e.target.value)}
                    className="h-7 w-10 cursor-pointer rounded-md border border-[var(--color-glass-stroke)] bg-transparent p-0.5"
                  />
                  <button
                    onClick={() => setWidgetTint("")}
                    disabled={widgetTint === ""}
                    className="rounded-md border border-[var(--color-glass-stroke)] bg-white/[0.03] px-2.5 py-1 text-[11px] text-[var(--color-text-muted)] transition hover:bg-white/[0.06] disabled:opacity-40"
                  >
                    {t("widget.tintReset")}
                  </button>
                </div>
              </div>
            </>
          )}
          <Toggle
            label={t("widget.snapLabel")}
            hint={t("widget.snapHint")}
            value={widgetSnap}
            onChange={setWidgetSnap}
          />
        </div>
      </GlassCard>

      <GlassCard delay={0.15}>
        <div className="text-[11px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
          {t("settings.data")}
        </div>
        <div className="mt-2 divide-y divide-white/[0.04]">
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm">{t("settings.dbPath")}</div>
              <div className="mt-0.5 break-all font-mono text-[11px] text-[var(--color-text-muted)]">
                {dbPath}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm">{t("settings.exportLabel")}</div>
              <div className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">
                {t("settings.exportHint")}
              </div>
            </div>
            <button
              onClick={onExport}
              disabled={!isTauri() || busy}
              className="rounded-lg border border-[var(--color-glass-stroke)] bg-white/[0.03] px-3 py-1.5 text-xs font-medium transition hover:bg-white/[0.06] disabled:opacity-40"
            >
              {t("settings.exportButton")}
            </button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm">{t("settings.resetLabel")}</div>
              <div className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">
                {t("settings.resetHint")}
              </div>
            </div>
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                disabled={!isTauri()}
                className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-400/20 disabled:opacity-40"
              >
                {t("settings.resetButton")}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmReset(false)}
                  className="rounded-lg border border-[var(--color-glass-stroke)] px-3 py-1.5 text-xs"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={onReset}
                  disabled={busy}
                  className="rounded-lg border border-rose-400/40 bg-rose-500/30 px-3 py-1.5 text-xs font-medium text-rose-100 disabled:opacity-40"
                >
                  {t("settings.confirmReset")}
                </button>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      <GlassCard delay={0.2}>
        <div className="text-[11px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
          {t("settings.about")}
        </div>
        <div className="mt-3 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">
              {t("settings.version")}
            </span>
            <span className="tabular-nums">{version || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">
              {t("settings.license")}
            </span>
            <span>MIT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">
              {t("settings.privacy")}
            </span>
            <span>{t("settings.privacyValue")}</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
