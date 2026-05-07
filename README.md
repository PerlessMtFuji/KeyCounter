# KeyCounter

Tiny desktop app that counts how much you bang on your keyboard and turns it into pretty charts. **Counts only — never content.**

🇵🇱 [Polish version / wersja PL](README.pl.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tauri 2](https://img.shields.io/badge/Tauri-2-24C8DB)](https://v2.tauri.app)

---

This is a fun project, not a product. I wanted to know how much I actually type in a day, didn't trust any of the existing trackers with that data, so I wrote one. It tracks **how many** keys you press — never **which** sequences, never the actual text. There is no cloud, no telemetry, no account. The whole thing is one local SQLite file you can delete any time.

## What it does

- Live KPM with a little pulse on every keystroke
- Keyboard heatmap (QWERTY / QWERTZ / Dvorak / Colemak)
- Top keys for today / 7 days / 30 days / all time
- Finger load (which finger is overworked under standard touch typing)
- Day × hour punch card and a 365-day GitHub-style activity calendar
- Streaks, modifier mix, backspace ratio
- Achievements with a celebration toast on every milestone
- System tray (show / hide / pause / quit), autostart on login
- Optional floating widget (full or compact pill)
- JSON export, full-history reset
- Dark mode by default, English + Polish

## Privacy, in plain words

The database stores per-key counters and per-minute totals. That's it. Even if it leaked, it would tell you that I pressed the letter `e` 4127 times today — not what I wrote with those `e`s. There are zero network calls in the entire codebase. Full breakdown in [docs/privacy.md](docs/privacy.md).

## Heads up: your antivirus might yell

Counting global keystrokes requires a low-level keyboard hook — the same OS primitive keyloggers use. Defender / SmartScreen / other AVs will sometimes flag unsigned builds because of that. The hook is one short file (`src-tauri/src/hook.rs`, ~50 lines) you can read top-to-bottom in a minute. Full story + how to verify the binary + how to whitelist: [docs/antivirus.md](docs/antivirus.md).

A real code-signing cert costs more than I want to pay for a side project, so for now: unsigned. Sorry.

## Install

### Prebuilt

Grab a `.msi` / `.exe` for Windows (or `.dmg` / `.AppImage` for the others) from the [Releases page](../../releases). Every release includes a `SHA256SUMS.txt` so you can verify what you downloaded matches what GitHub Actions built.

### From source

You'll need Node 20+ and Rust (via `rustup`). On Linux: see Tauri's [system deps](https://v2.tauri.app/start/prerequisites/#linux).

```bash
git clone https://github.com/perlessmtfuji/keycounter.git
cd keycounter
npm install

# Run the real desktop app in dev mode
npm run tauri:dev

# Or just the UI in a browser with mock data (preview only, no key tracking)
npm run dev

# Build installers for your OS
npm run tauri:build
```

## Platforms

Windows is the priority and the most polished. macOS and Linux builds come out of the same CI pipeline but are tested less.

| OS | Installer | Notes |
|---|---|---|
| Windows 10/11 | `.msi` / `.exe` | First run triggers SmartScreen — see antivirus doc |
| macOS 11+ | `.dmg` | Needs Accessibility permission; first launch screen walks you through it |
| Linux | `.AppImage` / `.deb` | X11 only (Wayland support is upstream of `rdev`) |

## Architecture, in one diagram

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

More detail in [docs/architecture.md](docs/architecture.md).

## Tech

Tauri 2 (Rust + WebView), React 18 + TypeScript, Tailwind v4, Zustand, Framer Motion, hand-rolled SVG charts, `rdev` for the keyboard hook, `rusqlite` for storage. Final binary is ~10 MB, idle RAM around 50 MB.

## A note on performance

Tauri ships an embedded WebView2 (Edge Chromium) per app, and that WebView is doing the heavy lifting for the entire UI. While typing fast, expect a few percent CPU and a small amount of GPU. I optimized the worst offenders (no `backdrop-filter`, no per-frame animations, paused timers when hidden), but it's still a Chromium browser running underneath, so it won't ever match a native shell. If you want absolute zero overhead, this isn't the tracker for you.

## Status

Effectively MVP-complete and frozen. The MVP set is in, this version is what it is. I might come back to it for a native-shell rewrite (Avalonia / Slint) some day, but no promises.

Things I'd add if I had infinite time: per-application stats, mouse counters, n-gram counts (codes, not text), Wayland support, Windows code signing.

## License

MIT — see [LICENSE](LICENSE). Use it, fork it, learn from it.
