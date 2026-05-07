# When your antivirus screams at KeyCounter

🇵🇱 [Wersja PL](antivirus.pl.md)

So you downloaded KeyCounter and Defender / SmartScreen / your AV of choice threw a red flag. That's annoying, but it's expected, and here's why.

## Why this happens

To count global keystrokes, KeyCounter has to register a low-level keyboard hook with the OS:

- Windows: `SetWindowsHookEx(WH_KEYBOARD_LL)`
- macOS: `CGEventTap`
- Linux: X11 input event listener

That's the same OS primitive **keyloggers** use. Heuristic AV scanners can't tell from the binary alone whether the program counts keys or steals passwords, so any unsigned binary that touches that API gets flagged. Every keystroke counter in existence (WhatPulse and friends) hits the same wall.

There is no workaround. You can't count global keystrokes without that primitive.

## What KeyCounter actually does in that hook

- Reads only the **virtual key code** (so: "this was the key in slot 30") — not the character, not the typed string
- Bumps a counter in memory
- Periodically flushes counters to a local SQLite file
- Never assembles the keys into text
- Never makes a network call. Anywhere. The codebase has zero outbound HTTP

It's a small file you can audit in a minute: [`src-tauri/src/`](../src-tauri/src/).

## What I'm doing about false positives

A few practical things, in order of effort:

1. **All builds happen on GitHub Actions** — public, reproducible, you can match the binary you downloaded against the workflow run that built it
2. **No anti-analysis tricks** — no UPX packing, no obfuscation, no anti-debug, no DLL injection
3. **No autostart via the registry `Run` key** — KeyCounter uses Task Scheduler / Login Items via official Tauri plugins
4. **Submitting false-positive reports** to Microsoft Defender after each tagged release
5. **Code signing** — would solve most of this, but a real EV cert is more than I want to pay for a side project. If KeyCounter ever gets popular enough to justify it, I'll grab one

## How to actually run an unsigned build

If you trust the source — read it, build it yourself, or check hashes against the GitHub Actions run — here's how to get past each warning.

### Windows SmartScreen

1. Right-click the installer → **Properties** → tick **Unblock** → **OK**
2. Double-click the installer → **More info** → **Run anyway**

### Windows Defender quarantining the installed binary

1. **Windows Security** → **Virus & threat protection** → **Manage settings** → **Exclusions**
2. Add the install folder (e.g. `C:\Program Files\KeyCounter`) as an exclusion
3. (Optional, helps everyone else): submit it as a false positive at [microsoft.com/wdsi/filesubmission](https://www.microsoft.com/en-us/wdsi/filesubmission)

### macOS Gatekeeper

1. Try to open the `.app` once — it'll fail
2. **System Settings → Privacy & Security** → scroll to the bottom → click **Open Anyway** next to the KeyCounter warning
3. KeyCounter will then ask for **Accessibility** permission — that's required for the keyboard event tap; the welcome screen guides you through it

### Linux

No SmartScreen equivalent. `chmod +x` the AppImage and run it, or `dpkg -i` the .deb.

## Verifying you got the real binary

Each release on GitHub includes a `SHA256SUMS.txt` file with hashes of every artifact, plus a link to the GitHub Actions workflow that built them. To check what you downloaded:

```powershell
# Windows (PowerShell)
Get-FileHash KeyCounter-Setup-x64.exe -Algorithm SHA256
```

```bash
# macOS / Linux
shasum -a 256 KeyCounter.dmg
```

Compare the output line to the matching line in `SHA256SUMS.txt`. If they don't match — don't run it, ping me with an issue.

## Still uncomfortable?

Totally fair. The codebase is open. Build it yourself:

```bash
git clone https://github.com/perlessmtfuji/keycounter.git
cd keycounter
npm install
npm run tauri:build
```

That gives you a binary built on your machine from source you read.
