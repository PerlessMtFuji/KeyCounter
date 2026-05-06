import { open } from "@tauri-apps/plugin-shell";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";

const MAC_PRIVACY_URL =
  "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility";

export function Welcome() {
  const checkPermissions = useStore((s) => s.checkPermissions);
  const t = useT();

  return (
    <div className="bg-fallback noise relative flex h-full w-full items-center justify-center overflow-hidden p-8">
      <div className="glass relative w-full max-w-xl rounded-3xl p-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-orange-400 shadow-lg shadow-orange-500/40">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
          </div>
          <span className="text-xs font-medium tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
            {t("welcome.tag")}
          </span>
        </div>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          {t("welcome.title")}
        </h1>

        <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
          <p>{t("welcome.body1")}</p>
          <p>{t("welcome.body2")}</p>
        </div>

        <ol className="mt-6 space-y-3 text-sm">
          {(
            [
              "welcome.step1",
              "welcome.step2",
              "welcome.step3",
              "welcome.step4",
            ] as const
          ).map((key, i) => (
            <li key={key} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--color-glass-stroke)] bg-[var(--color-accent-soft)] text-xs font-semibold">
                {i + 1}
              </span>
              <span>{t(key)}</span>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex gap-3">
          <button
            onClick={() => open(MAC_PRIVACY_URL).catch(console.error)}
            className="rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white hover:brightness-110"
          >
            {t("welcome.openButton")}
          </button>
          <button
            onClick={() => checkPermissions()}
            className="rounded-xl border border-[var(--color-glass-stroke)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          >
            {t("welcome.recheckButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
