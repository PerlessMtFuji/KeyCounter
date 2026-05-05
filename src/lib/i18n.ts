import { useStore } from "@/store/useStore";

export type Lang = "en" | "pl";

const en = {
  // Sidebar / nav
  "nav.dashboard": "Dashboard",
  "nav.heatmap": "Heatmap",
  "nav.stats": "Stats",
  "nav.achievements": "Achievements",
  "nav.settings": "Settings",
  "nav.widget": "Floating widget",
  "nav.recording": "Recording",
  "nav.paused": "Paused",
  "nav.pause": "Pause",
  "nav.resume": "Resume",

  // Common
  "common.keys": "keys",
  "common.kpm": "KPM",
  "common.day": "day",
  "common.days": "days",
  "common.perMin": "/ min",
  "common.perDay": "/ day",
  "common.avg": "avg",
  "common.today": "Today",
  "common.last7": "7d",
  "common.last30": "30d",
  "common.all": "All",
  "common.less": "less",
  "common.more": "more",
  "common.totalPresses": "total presses",
  "common.noData": "No data yet.",
  "common.notEnough": "Not enough data yet.",
  "common.target": "target",
  "common.unlocked": "unlocked",
  "common.of": "of",
  "common.cancel": "Cancel",
  "common.confirm": "Confirm",

  // Dashboard
  "dashboard.title": "Dashboard",
  "dashboard.subtitleNormal":
    "Snapshot of your typing activity. All numbers stay on this machine.",
  "dashboard.subtitleFresh":
    "Type something — your stats appear here in real time.",
  "dashboard.kpmHint": "Live · last minute",
  "dashboard.streak": "Streak",
  "dashboard.lifetime": "Lifetime",
  "dashboard.last30": "Last 30 days",
  "dashboard.trend7": "7-day trend",
  "dashboard.top5": "Top 5 keys · last 30 days",
  "dashboard.byHour": "Today by hour",

  // Heatmap
  "heatmap.title": "Keyboard heatmap",
  "heatmap.subtitle": "Where your fingers actually go.",
  "heatmap.fingerLoad": "Finger load · {layout} touch-typing",
  "heatmap.fingerLoadHint":
    "Assumes standard finger assignment. Consider remapping if any finger is doing too much work.",
  "heatmap.punchCard": "When you type · day × hour · last 30 days",
  "heatmap.calendar": "Activity calendar · last 365 days",

  // Stats
  "stats.title": "Stats",
  "stats.subtitle": "Detailed breakdown across all keys and behaviours.",
  "stats.top20": "Top 20 keys · last 30 days",
  "stats.modifierMix": "Modifier mix · today",
  "stats.ofAllKeys": "of all keys",
  "stats.backspaceRatio": "Backspace ratio · today",
  "stats.backspaceWarmup": "Type a bit, then come back.",
  "stats.backspaceLow": "You delete less than most. Confident typist.",
  "stats.backspaceMid": "Healthy correction rate.",
  "stats.backspaceHigh": "Consider slowing down for accuracy.",
  "stats.leastUsed": "Least used (with non-zero count)",

  // Achievements
  "ach.title": "Achievements",
  "ach.firstStepsTitle": "First Steps",
  "ach.firstStepsDesc": "Hit 100 keystrokes",
  "ach.warmingUpTitle": "Warming Up",
  "ach.warmingUpDesc": "Hit 10,000 keystrokes",
  "ach.cruiseTitle": "Cruise Control",
  "ach.cruiseDesc": "Hit 100,000 keystrokes",
  "ach.millionTitle": "Million Club",
  "ach.millionDesc": "Hit 1,000,000 keystrokes",
  "ach.deciTitle": "Decimillion",
  "ach.deciDesc": "Hit 10,000,000 keystrokes",
  "ach.weeklongTitle": "Weeklong",
  "ach.weeklongDesc": "7-day streak",
  "ach.marathonTitle": "Marathon",
  "ach.marathonDesc": "30-day streak",

  // Settings
  "settings.title": "Settings",
  "settings.subtitle": "Everything stays on this machine.",
  "settings.recording": "Recording",
  "settings.pauseLabel": "Pause counting",
  "settings.pauseHint": "Hook stays installed; events are silently dropped.",
  "settings.autostartLabel": "Start with system",
  "settings.autostartHint": "Launch KeyCounter when you log in.",
  "settings.display": "Display",
  "settings.layoutLabel": "Keyboard layout",
  "settings.layoutHint":
    "Affects how labels are drawn on the heatmap. Counts are physical-position based and never change.",
  "settings.themeLabel": "Theme",
  "settings.themeDark": "Dark",
  "settings.themeLight": "Light",
  "settings.langLabel": "Language",
  "settings.langEn": "English",
  "settings.langPl": "Polski",
  "settings.data": "Data",
  "settings.dbPath": "Database location",
  "settings.exportLabel": "Export",
  "settings.exportHint": "Save all counters to a JSON file.",
  "settings.exportButton": "Export…",
  "settings.resetLabel": "Reset all data",
  "settings.resetHint": "Wipes the local database. Cannot be undone.",
  "settings.resetButton": "Reset",
  "settings.confirmReset": "Confirm reset",
  "settings.about": "About",
  "settings.version": "Version",
  "settings.license": "License",
  "settings.privacy": "Privacy",
  "settings.privacyValue": "counts only · no network",

  // Milestone toast
  "toast.milestone": "Milestone unlocked",
  "toast.keystrokes": "{n} keystrokes",
  "toast.keepGoing": "Keep going.",

  // Widget
  "widget.kpm": "KPM",
  "widget.today": "Today",

  // Welcome (macOS Accessibility)
  "welcome.tag": "One-time setup",
  "welcome.title": "KeyCounter needs Accessibility permission",
  "welcome.body1":
    "macOS requires explicit user permission for any app that observes global keyboard input — this is the same primitive a keylogger would use, so the OS forces a deliberate opt-in.",
  "welcome.body2":
    "KeyCounter only counts presses; it never stores characters, words, or sequences. The implementation is one small file you can read on GitHub.",
  "welcome.step1": "Click “Open System Settings” below.",
  "welcome.step2": "Find KeyCounter in the Accessibility list.",
  "welcome.step3":
    "Toggle it on. macOS may ask you to quit and re-launch.",
  "welcome.step4": "Come back and click “I granted access”.",
  "welcome.openButton": "Open System Settings",
  "welcome.recheckButton": "I granted access",
};

const pl: typeof en = {
  // Sidebar / nav
  "nav.dashboard": "Pulpit",
  "nav.heatmap": "Mapa cieplna",
  "nav.stats": "Statystyki",
  "nav.achievements": "Osiągnięcia",
  "nav.settings": "Ustawienia",
  "nav.widget": "Widżet",
  "nav.recording": "Rejestruję",
  "nav.paused": "Wstrzymane",
  "nav.pause": "Pauza",
  "nav.resume": "Wznów",

  // Common
  "common.keys": "klawiszy",
  "common.kpm": "KPM",
  "common.day": "dzień",
  "common.days": "dni",
  "common.perMin": "/ min",
  "common.perDay": "/ dzień",
  "common.avg": "śr.",
  "common.today": "Dzisiaj",
  "common.last7": "7 dni",
  "common.last30": "30 dni",
  "common.all": "Całość",
  "common.less": "mniej",
  "common.more": "więcej",
  "common.totalPresses": "naciśnięć łącznie",
  "common.noData": "Brak danych.",
  "common.notEnough": "Za mało danych.",
  "common.target": "cel",
  "common.unlocked": "odblokowano",
  "common.of": "z",
  "common.cancel": "Anuluj",
  "common.confirm": "Potwierdź",

  // Dashboard
  "dashboard.title": "Pulpit",
  "dashboard.subtitleNormal":
    "Migawka Twojej aktywności. Wszystkie liczby zostają na tym komputerze.",
  "dashboard.subtitleFresh":
    "Napisz coś — statystyki pojawią się tutaj w czasie rzeczywistym.",
  "dashboard.kpmHint": "Na żywo · ostatnia minuta",
  "dashboard.streak": "Seria",
  "dashboard.lifetime": "Łącznie",
  "dashboard.last30": "Ostatnie 30 dni",
  "dashboard.trend7": "Trend 7-dniowy",
  "dashboard.top5": "Top 5 klawiszy · ostatnie 30 dni",
  "dashboard.byHour": "Dzisiaj wg godziny",

  // Heatmap
  "heatmap.title": "Mapa cieplna klawiatury",
  "heatmap.subtitle": "Tu naprawdę chodzą Twoje palce.",
  "heatmap.fingerLoad": "Obciążenie palców · układ {layout}",
  "heatmap.fingerLoadHint":
    "Standardowy przydział palców. Jeśli któryś za bardzo pracuje — rozważ remapowanie.",
  "heatmap.punchCard": "Kiedy piszesz · dzień × godzina · ostatnie 30 dni",
  "heatmap.calendar": "Kalendarz aktywności · ostatnie 365 dni",

  // Stats
  "stats.title": "Statystyki",
  "stats.subtitle": "Szczegółowe rozbicie po klawiszach i nawykach.",
  "stats.top20": "Top 20 klawiszy · ostatnie 30 dni",
  "stats.modifierMix": "Modyfikatory · dzisiaj",
  "stats.ofAllKeys": "wszystkich klawiszy",
  "stats.backspaceRatio": "Wskaźnik backspace · dzisiaj",
  "stats.backspaceWarmup": "Napisz trochę i wróć później.",
  "stats.backspaceLow": "Kasujesz mniej niż większość. Pewny pisarz.",
  "stats.backspaceMid": "Zdrowy poziom korekt.",
  "stats.backspaceHigh": "Może warto spowolnić dla lepszej celności.",
  "stats.leastUsed": "Najrzadziej (z niezerowym licznikiem)",

  // Achievements
  "ach.title": "Osiągnięcia",
  "ach.firstStepsTitle": "Pierwsze kroki",
  "ach.firstStepsDesc": "100 naciśnięć",
  "ach.warmingUpTitle": "Rozgrzewka",
  "ach.warmingUpDesc": "10 000 naciśnięć",
  "ach.cruiseTitle": "Tempomat",
  "ach.cruiseDesc": "100 000 naciśnięć",
  "ach.millionTitle": "Klub Miliona",
  "ach.millionDesc": "1 000 000 naciśnięć",
  "ach.deciTitle": "Dziesięć milionów",
  "ach.deciDesc": "10 000 000 naciśnięć",
  "ach.weeklongTitle": "Tydzień z rzędu",
  "ach.weeklongDesc": "Seria 7 dni",
  "ach.marathonTitle": "Maraton",
  "ach.marathonDesc": "Seria 30 dni",

  // Settings
  "settings.title": "Ustawienia",
  "settings.subtitle": "Wszystko zostaje na tym komputerze.",
  "settings.recording": "Rejestrowanie",
  "settings.pauseLabel": "Wstrzymaj zliczanie",
  "settings.pauseHint": "Hook pozostaje aktywny; zdarzenia są ignorowane.",
  "settings.autostartLabel": "Uruchamiaj z systemem",
  "settings.autostartHint": "Włącz KeyCounter przy logowaniu.",
  "settings.display": "Wygląd",
  "settings.layoutLabel": "Układ klawiatury",
  "settings.layoutHint":
    "Wpływa tylko na etykiety na mapie cieplnej. Liczniki bazują na fizycznych pozycjach i się nie zmieniają.",
  "settings.themeLabel": "Motyw",
  "settings.themeDark": "Ciemny",
  "settings.themeLight": "Jasny",
  "settings.langLabel": "Język",
  "settings.langEn": "English",
  "settings.langPl": "Polski",
  "settings.data": "Dane",
  "settings.dbPath": "Lokalizacja bazy",
  "settings.exportLabel": "Eksport",
  "settings.exportHint": "Zapisz liczniki do pliku JSON.",
  "settings.exportButton": "Eksportuj…",
  "settings.resetLabel": "Wyczyść wszystkie dane",
  "settings.resetHint":
    "Usuwa lokalną bazę. Operacja nieodwracalna.",
  "settings.resetButton": "Wyczyść",
  "settings.confirmReset": "Potwierdź wyczyszczenie",
  "settings.about": "O programie",
  "settings.version": "Wersja",
  "settings.license": "Licencja",
  "settings.privacy": "Prywatność",
  "settings.privacyValue": "tylko liczniki · bez sieci",

  // Milestone toast
  "toast.milestone": "Osiągnięcie odblokowane",
  "toast.keystrokes": "{n} naciśnięć",
  "toast.keepGoing": "Tak trzymaj.",

  // Widget
  "widget.kpm": "KPM",
  "widget.today": "Dzisiaj",

  // Welcome (macOS Accessibility)
  "welcome.tag": "Jednorazowa konfiguracja",
  "welcome.title": "KeyCounter potrzebuje uprawnienia Accessibility",
  "welcome.body1":
    "macOS wymaga jawnej zgody dla aplikacji obserwujących globalne wejście klawiatury — to ten sam mechanizm co keyloggery, więc system wymusza świadomą zgodę.",
  "welcome.body2":
    "KeyCounter zlicza tylko naciśnięcia; nigdy nie zapisuje znaków, słów ani sekwencji. Implementacja to jeden mały plik na GitHubie do audytu.",
  "welcome.step1": "Kliknij „Otwórz Ustawienia systemowe”.",
  "welcome.step2": "Znajdź KeyCounter w sekcji Accessibility.",
  "welcome.step3":
    "Włącz przełącznik. macOS może poprosić o restart aplikacji.",
  "welcome.step4": "Wróć i kliknij „Dostęp przyznany”.",
  "welcome.openButton": "Otwórz Ustawienia systemowe",
  "welcome.recheckButton": "Dostęp przyznany",
};

const TR: Record<Lang, typeof en> = { en, pl };

export type TranslationKey = keyof typeof en;

export function translate(
  lang: Lang,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  let s: string = TR[lang][key] ?? TR.en[key] ?? key;
  if (vars) {
    for (const k of Object.keys(vars)) {
      s = s.replace(`{${k}}`, String(vars[k]));
    }
  }
  return s;
}

export function useT() {
  const lang = useStore((s) => s.lang);
  return (key: TranslationKey, vars?: Record<string, string | number>) =>
    translate(lang, key, vars);
}
