# Privacy

KeyCounter is designed so that even if its database leaked, it would reveal **how much** you typed — not **what** you typed.

## What we store

| Data | Stored? | Notes |
|---|---|---|
| Per-key counters | ✅ | e.g. `KeyA → 18421` |
| Daily/hourly aggregates | ✅ | for charts |
| Modifier counters (Shift/Ctrl/Alt/Cmd) | ✅ | for "power user" stats |
| Keystroke timestamps (rounded) | ✅ | minute-bucket only |
| Actual characters / words / sentences | ❌ | never |
| Clipboard contents | ❌ | never accessed |
| Active application name | ❌ | not in v1 |
| Window titles | ❌ | not in v1 |
| Mouse data | ❌ | not in v1 |
| Anything over the network | ❌ | the app makes zero network calls |

## Where data lives

A single SQLite file in your OS application data directory:

| OS | Path |
|---|---|
| Windows | `%APPDATA%\io.keycounter.app\keycounter.db` |
| macOS | `~/Library/Application Support/io.keycounter.app/keycounter.db` |
| Linux | `~/.local/share/io.keycounter.app/keycounter.db` |

Delete that file → all history gone.

## N-grams (planned)

A future feature may count common 2- and 3-key **code** sequences (e.g. `Ctrl+C`, or codes for `t→h→e`). These will be stored as **frequency counts of key-code tuples**, never as decoded text, and the feature will be **opt-in** with a clear UI toggle.

## Verifying privacy claims

The repository is fully open source. The keyboard hook is implemented in [`src-tauri/src/`](../src-tauri/src/) and is the only place where keystroke data enters the app. Every release is built reproducibly via GitHub Actions — you can compare the binary you downloaded with one built from the tagged commit.
