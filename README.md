# KeyCounter

> Privacy-first cross-platform keystroke counter with a modern glass UI.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tauri 2](https://img.shields.io/badge/Tauri-2-24C8DB)](https://v2.tauri.app)
[![Status](https://img.shields.io/badge/status-early%20development-orange)]()

KeyCounter tracks how much you type and turns it into beautiful, privacy-respecting analytics — heatmaps, KPM trends, top keys, streaks and more. **Counts only — never content.** No cloud, no telemetry, no key sequences stored.

## Why another keystroke counter?

- **Native, lightweight** — built with Tauri 2 (Rust + WebView). ~10 MB, ~50 MB RAM.
- **Privacy by design** — only key codes and aggregate counters are persisted. No words, no clipboard, no per-app tracking in v1.
- **Beautiful** — modern glassmorphism UI with system blur (Mica on Windows 11, Vibrancy on macOS), spring physics animations, dark mode by default.
- **Open source** — every release built reproducibly from public source via GitHub Actions.

## Roadmap

| Phase | Scope | Status |
|---|---|---|
| 1 | Scaffold (Tauri + React + TS + Tailwind v4) | ✅ |
| 2 | Rust backend: global key listener + SQLite | ⏳ |
| 3 | UI: dashboard, heatmap, charts (mock data) | ⏳ |
| 4 | Wire-up real data, real-time KPM, tray icon | ⏳ |
| 5 | Streaks, punch card, finger load, achievements | ⏳ |
| 6 | CI release pipeline, autostart, settings, export | ⏳ |

## Platforms

Priority order: **Windows → macOS → Linux**.

## Tech stack

- **Tauri 2** — native shell, ~10 MB binaries
- **Rust** — backend, global keyboard hook (`rdev`), SQLite (`rusqlite`)
- **React 18 + TypeScript** — UI
- **Tailwind CSS v4** — styling
- **Framer Motion** — animations

## Development

Requirements:
- Node.js ≥ 20
- Rust ≥ 1.77 (`rustup`)
- Platform deps: see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

```bash
npm install
npm run tauri:dev
```

> **Icons:** placeholder icons aren't included yet. To generate them from a source PNG:
> ```bash
> npx @tauri-apps/cli icon path/to/source-1024.png
> ```

## Privacy

See [docs/privacy.md](docs/privacy.md). TL;DR: KeyCounter stores aggregated key-code counters in a local SQLite database in your OS app-data directory. **No keystroke content, no n-gram text, no network calls.**

## "My antivirus flagged it" — read this first

Global keyboard hooks are the same primitive used by keyloggers, so heuristics-based AV may flag unsigned builds. See [docs/antivirus.md](docs/antivirus.md) for what's happening, why, and how to verify the build.

## License

MIT — see [LICENSE](LICENSE).
