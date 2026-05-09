# KeyCounter

Desktop keystroke counter. Counts how many keys you press and shows it as a heatmap and a few charts. Counts only — never content.

[Wersja PL](README.pl.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tauri 2](https://img.shields.io/badge/Tauri-2-24C8DB)](https://v2.tauri.app)

---

I wanted a number on my own typing without giving the data to anything online. The existing trackers either phoned home or wanted an account, so I wrote my own. The whole database is one local SQLite file. Delete it and the history is gone.

The app stores per-key counters and per-minute totals. It doesn't store the actual characters, words, sequences, clipboard, window titles or anything else. There are no network calls in the codebase. Details in [docs/privacy.md](docs/privacy.md).

## Features

- Live KPM with a pulse on each keystroke
- Keyboard heatmap (QWERTY, QWERTZ, Dvorak, Colemak)
- Top keys for today, 7 days, 30 days, all time
- Finger load under standard touch typing
- Day × hour punch card and a 365-day activity calendar
- Streaks, modifier mix, backspace ratio
- Achievements
- System tray with show / hide / pause / quit, autostart
- Optional floating widget (full or compact pill, can snap to the taskbar)
- JSON export, full-history reset
- English + Polish, dark theme

## Install

Grab the installer from [Releases](../../releases). Each release has a `SHA256SUMS.txt` you can verify against.

The Windows build is unsigned, so SmartScreen will complain on first run. Pick **More info → Run anyway**. A code-signing cert is too expensive for a side project.

### From source

Node 20+ and Rust (via `rustup`). On Linux you'll also need [Tauri's system deps](https://v2.tauri.app/start/prerequisites/#linux).

```bash
git clone https://github.com/perlessmtfuji/keycounter.git
cd keycounter
npm install

npm run tauri:dev      # full app in dev mode
npm run dev            # UI only, mocked data, no key tracking
npm run tauri:build    # build installers
```

## Antivirus

Counting global keystrokes needs a low-level keyboard hook, which is the same OS primitive a keylogger uses. Defender and other AVs sometimes flag unsigned builds because of that. The hook itself is about 50 lines in [`src-tauri/src/hook.rs`](src-tauri/src/hook.rs) and never touches the actual keys pressed. Full write-up and how to verify in [docs/antivirus.md](docs/antivirus.md).

## Platforms

Windows is the priority and the most polished. macOS and Linux builds come out of the same CI pipeline but get less testing.

| OS | Installer | Notes |
|---|---|---|
| Windows 10/11 | `.msi` / `.exe` | SmartScreen on first run, see antivirus doc |
| macOS 11+ | `.dmg` | Needs Accessibility permission, walked through on first launch |
| Linux | `.AppImage` / `.deb` | X11 only — Wayland support depends on `rdev` |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Tauri 2 application                  │
│                                                         │
│  ┌──────────────────────────┐   ┌────────────────────┐  │
│  │  WebView (React + TS)    │   │   Rust core        │  │
│  │                          │◄──┤                    │  │
│  │  Heatmap / charts / UI   │   │  rdev hook         │  │
│  │  Zustand store           │   │  SQLite store      │  │
│  │  Framer Motion (sparing) │   │  Live emitter      │  │
│  └──────────────────────────┘   └────────────────────┘  │
│              ▲                            │             │
│              └─── invoke / events ────────┘             │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ~/AppData/io.keycounter.app/
                          keycounter.db
```

More in [docs/architecture.md](docs/architecture.md).

## Stack

Tauri 2 (Rust + WebView), React 18 + TypeScript, Tailwind v4, Zustand, Framer Motion, hand-rolled SVG charts, `rdev` for the keyboard hook, `rusqlite` for storage. Final binary is around 10 MB, idle RAM around 50 MB.

## Performance

Tauri ships an embedded WebView2 (Edge Chromium) per app and that WebView runs the whole UI. While typing fast you can expect a few percent CPU and a small amount of GPU. The worst offenders are gone (no `backdrop-filter`, no per-frame animations, timers paused while hidden) but it's still Chromium underneath, so it won't match a native shell. If you want absolute zero overhead, this isn't the tracker for you.

## Status

Frozen at MVP. The feature set is what it is. A native-shell rewrite (Avalonia or Slint) is something I might do at some point, no promises.

Things I'd add given infinite time: per-application stats, mouse counters, n-gram counts (codes, not text), Wayland support, a signed Windows build.

## License

MIT — see [LICENSE](LICENSE).
