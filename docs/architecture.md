# Architecture

## High-level

```
┌─────────────────────────────────────────────────────────┐
│                    Tauri 2 Application                  │
│                                                         │
│  ┌──────────────────────────┐   ┌────────────────────┐  │
│  │  WebView (React + TS)    │   │   Rust core        │  │
│  │  ──────────────────────  │   │   ───────────────  │  │
│  │  • Glass UI              │◄──┤  • rdev hook       │  │
│  │  • Heatmap               │   │  • SQLite store    │  │
│  │  • Charts                │   │  • Aggregator      │  │
│  │  • Settings              │   │  • Tauri commands  │  │
│  └──────────────────────────┘   └────────────────────┘  │
│              ▲                            │             │
│              └─── invoke / events ────────┘             │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ~/AppData/io.keycounter.app/
                          keycounter.db
```

## Modules (planned)

### `src-tauri/src/hook.rs`
Spawns a background thread running `rdev::listen`. The callback only inspects `EventType::KeyPress`, maps it to a stable numeric code, and pushes it to an in-memory MPSC channel. **No allocation of strings, no hashmaps in the hot path.**

### `src-tauri/src/store.rs`
Owns the SQLite connection pool. Receives events from the channel, batches them (e.g. flush every 5 seconds or every 500 events), and updates aggregate tables.

### `src-tauri/src/stats.rs`
Tauri-exposed query functions:
- `get_today_stats()`
- `get_range_stats(from, to)`
- `get_heatmap(range)`
- `get_top_keys(range, limit)`
- `get_streak()`

### `src-tauri/src/tray.rs`
System tray icon with quick stats on hover; menu for Pause / Open / Quit.

### `src/` (frontend)
Standard React app with route-less view switching (sidebar). State is read from Tauri commands, with `tauri://event` push for live KPM.

## Database schema (draft)

```sql
-- Per-day per-key counter
CREATE TABLE keystrokes (
    day  TEXT NOT NULL,        -- "YYYY-MM-DD"
    code INTEGER NOT NULL,     -- platform-stable virtual key code
    count INTEGER NOT NULL,
    PRIMARY KEY (day, code)
);

-- Per-minute total for KPM/heatmap-over-time
CREATE TABLE minute_totals (
    minute INTEGER PRIMARY KEY, -- unix minute
    count  INTEGER NOT NULL
);

-- Per-day modifier usage (Shift/Ctrl/Alt/Meta)
CREATE TABLE modifier_usage (
    day      TEXT NOT NULL,
    modifier TEXT NOT NULL,     -- 'shift'|'ctrl'|'alt'|'meta'
    count    INTEGER NOT NULL,
    PRIMARY KEY (day, modifier)
);

-- Lifetime achievements
CREATE TABLE achievements (
    id        TEXT PRIMARY KEY,
    earned_at INTEGER NOT NULL
);
```
