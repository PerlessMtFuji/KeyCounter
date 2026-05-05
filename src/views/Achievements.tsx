import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { useStore } from "@/store/useStore";
import { formatNumber } from "@/lib/format";
import { deriveAchievements } from "@/lib/derived";
import { useT, type TranslationKey } from "@/lib/i18n";

const TITLE_KEY: Record<string, TranslationKey> = {
  first_100: "ach.firstStepsTitle",
  ten_k: "ach.warmingUpTitle",
  hundred_k: "ach.cruiseTitle",
  one_m: "ach.millionTitle",
  ten_m: "ach.deciTitle",
  streak_7: "ach.weeklongTitle",
  streak_30: "ach.marathonTitle",
};

const DESC_KEY: Record<string, TranslationKey> = {
  first_100: "ach.firstStepsDesc",
  ten_k: "ach.warmingUpDesc",
  hundred_k: "ach.cruiseDesc",
  one_m: "ach.millionDesc",
  ten_m: "ach.deciDesc",
  streak_7: "ach.weeklongDesc",
  streak_30: "ach.marathonDesc",
};

export function Achievements() {
  const lifetime = useStore((s) => s.lifetime);
  const streak = useStore((s) => s.streak);
  const t = useT();
  const achievements = deriveAchievements(lifetime, streak);
  const earned = achievements.filter((a) => a.earned).length;

  return (
    <div className="space-y-6">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-semibold tracking-tight"
        >
          {t("ach.title")}
        </motion.h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {earned} {t("common.of")} {achievements.length}{" "}
          {t("common.unlocked")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((a, i) => (
          <GlassCard key={a.id} delay={0.05 + i * 0.04}>
            <div className="flex items-start gap-3">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-2xl ${
                  a.earned
                    ? "border-amber-300/40 bg-gradient-to-br from-amber-300/30 to-orange-400/20 shadow-lg shadow-amber-400/10"
                    : "border-[var(--color-glass-stroke)] bg-white/[0.02] opacity-50"
                }`}
              >
                {a.earned ? "★" : "☆"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">
                  {t(TITLE_KEY[a.id] ?? ("ach.firstStepsTitle" as TranslationKey))}
                </div>
                <div className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">
                  {t(DESC_KEY[a.id] ?? ("ach.firstStepsDesc" as TranslationKey))}
                </div>
                {!a.earned && (
                  <div className="mt-3">
                    <div className="relative h-1 overflow-hidden rounded-full bg-white/[0.05]">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-300 to-orange-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${a.progress * 100}%` }}
                        transition={{
                          duration: 1,
                          delay: 0.2 + i * 0.04,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      />
                    </div>
                    <div className="mt-1 text-[10px] tabular-nums text-[var(--color-text-muted)]">
                      {Math.round(a.progress * 100)}% · {t("common.target")}{" "}
                      {formatNumber(a.threshold)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
