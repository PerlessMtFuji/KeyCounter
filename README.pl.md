# KeyCounter

Mała aplikacja desktopowa, która liczy ile walisz w klawiaturę i robi z tego ładne wykresy. **Liczy klawisze — nigdy treści.**

🇬🇧 [English version](README.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tauri 2](https://img.shields.io/badge/Tauri-2-24C8DB)](https://v2.tauri.app)

---

To projekt na luzie, nie produkt. Chciałem wiedzieć, ile faktycznie piszę dziennie, żadnemu z istniejących trackerów nie chciało mi się powierzać tych danych, więc napisałem swój. Liczy **ile** klawiszy wciskasz — nigdy **jakie** sekwencje, nigdy treści. Nie ma chmury, nie ma telemetrii, nie ma konta. Całość to jeden lokalny plik SQLite, który możesz w każdej chwili usunąć.

## Co potrafi

- Live KPM z animowanym pulsem przy każdym uderzeniu
- Mapa cieplna klawiatury (QWERTY / QWERTZ / Dvorak / Colemak)
- Top klawisze: dziś / 7 dni / 30 dni / cały czas
- Obciążenie palców (który palec ma najgorzej przy standardowym touch typingu)
- Punch card (dzień × godzina) i 365-dniowy kalendarz aktywności w stylu GitHuba
- Streaki, mix modyfikatorów, stosunek backspace
- Achievementy z toastem przy każdym milestonie
- Tray (pokaż / ukryj / pauza / wyjście), autostart przy logowaniu
- Opcjonalny pływający widget (pełny lub kompaktowa pigułka)
- Eksport do JSON, reset całej historii
- Domyślnie tryb ciemny, polski i angielski

## Prywatność po ludzku

Baza trzyma liczniki per-klawisz i totale per-minuta. Tyle. Nawet gdyby wyciekła, powiedziałaby tylko, że dziś nacisnąłem `e` 4127 razy — nie co napisałem tymi `e`-ami. W całym kodzie nie ma ani jednego wywołania sieciowego. Pełen rozkład: [docs/privacy.md](docs/privacy.md).

## Uwaga: antywirus może krzyczeć

Globalne liczenie klawiszy wymaga niskopoziomowego hooka klawiatury — tej samej prymitywy systemowej, której używają keyloggery. Defender / SmartScreen / inne AV czasem flagują niepodpisane buildy z tego powodu. Hook to jeden krótki plik (`src-tauri/src/hook.rs`, ~50 linii), który przeczytasz w minutę. Cała historia + jak zweryfikować binarkę + jak whitelistować: [docs/antivirus.md](docs/antivirus.md).

Prawdziwy certyfikat do podpisywania kodu kosztuje więcej niż chcę wydać na projekt po godzinach, więc póki co: niepodpisany. Sorry.

## Instalacja

### Gotowe buildy

Złap `.msi` / `.exe` dla Windowsa (albo `.dmg` / `.AppImage` dla reszty) ze [strony Releases](../../releases). Każdy release ma `SHA256SUMS.txt`, więc sprawdzisz, czy to co pobrałeś zgadza się z tym, co zbudował GitHub Actions.

### Ze źródeł

Potrzebny Node 20+ i Rust (przez `rustup`). Na Linuksie: zobacz [zależności systemowe Tauri](https://v2.tauri.app/start/prerequisites/#linux).

```bash
git clone https://github.com/perlessmtfuji/keycounter.git
cd keycounter
npm install

# Prawdziwa aplikacja desktopowa w trybie dev
npm run tauri:dev

# Albo samo UI w przeglądarce z mockowymi danymi (tylko podgląd, nie liczy klawiszy)
npm run dev

# Build instalatorów dla twojego OS-a
npm run tauri:build
```

## Platformy

Windows jest priorytetem i jest najlepiej dopracowany. macOS i Linux wychodzą z tego samego CI, ale są mniej testowane.

| OS | Instalator | Uwagi |
|---|---|---|
| Windows 10/11 | `.msi` / `.exe` | Pierwsze uruchomienie pokaże SmartScreen — patrz dokument o AV |
| macOS 11+ | `.dmg` | Wymaga uprawnienia Accessibility; ekran startowy prowadzi przez to |
| Linux | `.AppImage` / `.deb` | Tylko X11 (wsparcie Waylanda zależy od `rdev`) |

## Architektura w jednym diagramie

```
┌─────────────────────────────────────────────────────────┐
│                  Aplikacja Tauri 2                      │
│                                                         │
│  ┌──────────────────────────┐   ┌────────────────────┐  │
│  │  WebView (React + TS)    │   │   Rdzeń Rust       │  │
│  │                          │◄──┤                    │  │
│  │  Heatmapa / wykresy / UI │   │  hook rdev         │  │
│  │  Zustand store           │   │  store SQLite      │  │
│  │  Framer Motion (oszczęd) │   │  emitter live      │  │
│  └──────────────────────────┘   └────────────────────┘  │
│              ▲                            │             │
│              └─── invoke / eventy ────────┘             │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ~/AppData/io.keycounter.app/
                          keycounter.db
```

Więcej szczegółów: [docs/architecture.md](docs/architecture.md).

## Tech

Tauri 2 (Rust + WebView), React 18 + TypeScript, Tailwind v4, Zustand, Framer Motion, ręcznie pisane wykresy SVG, `rdev` na hook klawiatury, `rusqlite` na storage. Finalna binarka ~10 MB, RAM w idle ~50 MB.

## Słowo o wydajności

Tauri zaszywa WebView2 (Edge Chromium) per aplikacja, i to ten WebView dźwiga całe UI. Przy szybkim pisaniu spodziewaj się kilku procent CPU i odrobiny GPU. Zoptymalizowałem najgorsze rzeczy (zero `backdrop-filter`, zero animacji per klatka, pauza timerów gdy okno jest schowane), ale pod spodem dalej chodzi Chromium, więc nigdy nie zrówna się z natywnym shellem. Jeśli chcesz absolutnie zerowego narzutu, ten tracker nie jest dla ciebie.

## Status

Praktycznie MVP-complete i zamrożone. Zestaw MVP jest w środku, ta wersja jest jaka jest. Może kiedyś wrócę do tego z natywnym shellem (Avalonia / Slint), ale nic nie obiecuję.

Co bym dorzucił, gdybym miał nieskończony czas: statystyki per-aplikacja, liczniki myszy, n-gramy (kody klawiszy, nie tekst), wsparcie Waylanda, podpisany Windowsowy build.

## Licencja

MIT — patrz [LICENSE](LICENSE). Używaj, forkuj, ucz się.
