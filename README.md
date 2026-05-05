# KeyCounter

> Privacy-first cross-platform keystroke counter with a modern glass UI.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tauri 2](https://img.shields.io/badge/Tauri-2-24C8DB)](https://v2.tauri.app)
[![Status](https://img.shields.io/badge/status-MVP-brightgreen)]()

KeyCounter tracks how much you type and turns it into beautiful, privacy-respecting analytics — keyboard heatmap, KPM, top keys, streaks, finger load and more. **Counts only — never content.** No cloud, no telemetry, no key sequences stored.

## Features

- **Real-time KPM** — animated pulse on every keystroke, accurate one-minute / five-minute / one-hour averages
- **Keyboard heatmap** with switchable layouts: QWERTY, QWERTZ, Dvorak, Colemak
- **Top keys ranking** for today, last 7 days, last 30 days, all time
- **Finger load balance** — find out which finger is overworked under standard touch-typing
- **Punch card** (day × hour) and **365-day activity calendar** like GitHub contribution graph
- **Streaks**, **modifier mix**, **backspace ratio** (typing-confidence proxy)
- **Achievements** with progress bars and a celebratory toast on every new milestone
- **System tray** with show/hide/pause/quit; **autostart** on login
- **Export** all counters to JSON; **reset** wipes the local database
- Modern glass UI with system blur (Mica on Win 11, Vibrancy on macOS), spring animations, dark mode by default

## Privacy

KeyCounter is designed so that even if its database leaked, it would reveal **how much** you typed — not **what** you typed. See [docs/privacy.md](docs/privacy.md) for the full breakdown.

- Per-key counters and per-minute totals only
- Modifier counts (Shift / Ctrl / Alt / Meta) — but no held-modifier-with-X tracking
- Zero network calls
- Single SQLite file in your OS app-data directory; delete it → all history gone

## Platforms

Priority: **Windows → macOS → Linux**. Builds for all three are produced by GitHub Actions on every tagged release.

| OS | Installer | Notes |
|---|---|---|
| Windows 10/11 | `.msi` / `.nsis-setup.exe` | First run triggers SmartScreen — see below |
| macOS 11+ | `.dmg` | Requires Accessibility permission; onboarding screen guides setup |
| Linux | `.AppImage` / `.deb` | X11 only currently (Wayland support is upstream of `rdev`) |

## Install

### Pre-built releases

Grab the artifact for your OS from the [Releases page](../../releases). All builds are unsigned for now — see [docs/antivirus.md](docs/antivirus.md) for what that means and how to verify the binary.

### From source

Requirements:
- Node.js ≥ 20
- Rust ≥ 1.77 (`rustup`)
- Linux only: see Tauri's [system dependencies](https://v2.tauri.app/start/prerequisites/#linux)

```bash
git clone https://github.com/perlessmtfuji/keycounter.git
cd keycounter
npm install

# Run the desktop app in dev mode (recommended — full functionality)
npm run tauri:dev

# Or run the UI alone in a browser with mock data (design preview, no key tracking)
npm run dev

# Production build (creates installers for the host OS)
npm run tauri:build
```

## "My antivirus flagged it" — read this first

Global keyboard hooks are the same primitive used by keyloggers, so heuristic AV scanners may flag unsigned builds. KeyCounter is open source — you can read the entire hook implementation in `src-tauri/src/hook.rs` (about 50 lines) and audit that nothing leaves your machine. See [docs/antivirus.md](docs/antivirus.md) for verification steps and how to whitelist.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Tauri 2 Application                  │
│                                                         │
│  ┌──────────────────────────┐   ┌────────────────────┐  │
│  │  WebView (React + TS)    │   │   Rust core        │  │
│  │  ──────────────────────  │   │   ───────────────  │  │
│  │  Glass UI                │◄──┤  rdev hook         │  │
│  │  Heatmap / Charts        │   │  SQLite store      │  │
│  │  Zustand store           │   │  Live emitter      │  │
│  │  Framer Motion           │   │  Tauri commands    │  │
│  └──────────────────────────┘   └────────────────────┘  │
│              ▲                            │             │
│              └─── invoke / events ────────┘             │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ~/AppData/io.keycounter.app/
                          keycounter.db
```

See [docs/architecture.md](docs/architecture.md) for the detailed module breakdown.

## Tech stack

| Layer | Tech |
|---|---|
| Shell | Tauri 2 (Rust + WebView) |
| UI | React 18, TypeScript, Tailwind CSS v4, Framer Motion |
| State | Zustand |
| Charts | Hand-rolled SVG (no chart library) |
| Backend | Rust 2021, `rdev` (keyboard hook), `rusqlite` (SQLite, bundled) |
| Plugins | window-state, autostart, dialog, fs, shell |

Final bundle: ~10 MB binary, ~50 MB resident memory.

## Roadmap

| Phase | Scope | Status |
|---|---|---|
| 1 | Scaffold Tauri 2 + React + TS + Tailwind v4 | ✅ |
| 2 | Rust backend: global key listener + SQLite | ✅ |
| 3 | UI: dashboard, heatmap, charts (mock data) | ✅ |
| 4 | Wire-up real data, real-time KPM, tray icon | ✅ |
| 5 | Streaks calendar, finger load, layouts, milestone toasts | ✅ |
| 6 | CI release pipeline, autostart, settings, export | ✅ |
| 7 | Real-time UI tick, hover spotlight, themed scrollbar, floating widget, pulsing tray | ✅ |

### Post-MVP ideas

- Per-application stats (requires extra macOS permission, more AV scrutiny)
- Mouse tracking (separate scope)
- Cloud sync (opt-in, end-to-end encrypted)
- Top key n-grams (count of code sequences — not text — opt-in)
- Wayland support (upstream of `rdev`)
- Code signing certificate for Windows (pending)

## License

MIT — see [LICENSE](LICENSE).
