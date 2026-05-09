# KeyCounter

Desktopowy licznik klawiszy. Zlicza ile klawiszy wciskasz i pokazuje to na heatmapie i kilku wykresach. Liczy klawisze, nie treść.

[English version](README.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tauri 2](https://img.shields.io/badge/Tauri-2-24C8DB)](https://v2.tauri.app)

---

Chciałem mieć liczbę swojego pisania bez oddawania danych czemukolwiek online. Istniejące trackery albo wysyłały dane gdzieś dalej, albo wymagały konta, więc napisałem swój. Cała baza to jeden lokalny plik SQLite. Skasujesz go i historia znika.

Aplikacja trzyma liczniki per klawisz i totale per minuta. Nie zapisuje znaków, słów, sekwencji, schowka, tytułów okien ani niczego innego. W kodzie nie ma żadnych wywołań sieciowych. Szczegóły w [docs/privacy.md](docs/privacy.md).

## Funkcje

- Live KPM z pulsem przy każdym uderzeniu
- Heatmapa klawiatury (QWERTY, QWERTZ, Dvorak, Colemak)
- Top klawisze: dziś, 7 dni, 30 dni, cały czas
- Obciążenie palców przy standardowym touch typingu
- Punch card dzień × godzina i 365-dniowy kalendarz aktywności
- Streaki, mix modyfikatorów, stosunek backspace
- Achievementy
- Tray z pokaż / ukryj / pauza / wyjście, autostart
- Opcjonalny pływający widget (pełny albo kompaktowa pigułka, snap do paska zadań)
- Eksport do JSON, reset całej historii
- Polski i angielski, ciemny motyw

## Instalacja

Instalator znajdziesz w [Releases](../../releases). Każdy release ma `SHA256SUMS.txt`, więc możesz zweryfikować plik.

Build dla Windowsa jest niepodpisany, więc SmartScreen się przyczepi przy pierwszym uruchomieniu. Wybierasz **More info → Run anyway**. Cert do podpisywania kodu jest za drogi na projekt po godzinach.

### Ze źródeł

Node 20+ i Rust (przez `rustup`). Na Linuksie dodatkowo [zależności systemowe Tauri](https://v2.tauri.app/start/prerequisites/#linux).

```bash
git clone https://github.com/perlessmtfuji/keycounter.git
cd keycounter
npm install

npm run tauri:dev      # pełna aplikacja w trybie dev
npm run dev            # samo UI, mockowane dane, nie liczy klawiszy
npm run tauri:build    # build instalatorów
```

## Antywirus

Globalne liczenie klawiszy wymaga niskopoziomowego hooka — tej samej prymitywy systemowej, której używa keylogger. Defender i inne AV czasem flagują z tego powodu niepodpisane buildy. Sam hook to jakieś 50 linii w [`src-tauri/src/hook.rs`](src-tauri/src/hook.rs) i nigdy nie dotyka tego, jakie konkretnie klawisze były wciskane. Pełen rozkład i jak zweryfikować w [docs/antivirus.pl.md](docs/antivirus.pl.md).

## Platformy

Windows jest priorytetem i jest najlepiej dopracowany. macOS i Linux wychodzą z tego samego CI, ale są mniej testowane.

| OS | Instalator | Uwagi |
|---|---|---|
| Windows 10/11 | `.msi` / `.exe` | SmartScreen przy pierwszym uruchomieniu, patrz dokument o AV |
| macOS 11+ | `.dmg` | Wymaga uprawnienia Accessibility, ekran startowy prowadzi przez to |
| Linux | `.AppImage` / `.deb` | Tylko X11 — wsparcie Waylanda zależy od `rdev` |

## Architektura

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

Więcej w [docs/architecture.md](docs/architecture.md).

## Stack

Tauri 2 (Rust + WebView), React 18 + TypeScript, Tailwind v4, Zustand, Framer Motion, ręcznie pisane wykresy SVG, `rdev` na hook klawiatury, `rusqlite` na storage. Finalna binarka ~10 MB, RAM w idle ~50 MB.

## Wydajność

Tauri zaszywa WebView2 (Edge Chromium) per aplikacja i to ten WebView dźwiga całe UI. Przy szybkim pisaniu spodziewaj się kilku procent CPU i odrobiny GPU. Najgorsze rzeczy poszły (zero `backdrop-filter`, zero animacji per klatka, timery zatrzymane gdy okno schowane), ale pod spodem dalej chodzi Chromium, więc nie zrówna się z natywnym shellem. Jeśli chcesz absolutnie zerowego narzutu, ten tracker nie jest dla ciebie.

## Status

Zamrożone na MVP. Feature set jest jaki jest. Natywny shell (Avalonia albo Slint) to coś, co może kiedyś zrobię, nic nie obiecuję.

Co bym dorzucił mając nieskończony czas: statystyki per aplikacja, liczniki myszy, n-gramy (kody klawiszy, nie tekst), wsparcie Waylanda, podpisany build dla Windowsa.

## Licencja

MIT — patrz [LICENSE](LICENSE).
