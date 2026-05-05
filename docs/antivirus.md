# Antivirus & SmartScreen warnings

If Windows Defender, SmartScreen, or another antivirus flagged KeyCounter — **this is expected for unsigned early builds**, and this document explains why and what we're doing about it.

## Why does this happen?

KeyCounter installs a global low-level keyboard hook (`SetWindowsHookEx(WH_KEYBOARD_LL)` on Windows, `CGEventTap` on macOS). This is the same OS primitive that **keyloggers** use, so heuristic scanners flag any binary that uses it — especially when the binary isn't signed by a known publisher.

It is impossible to count keystrokes globally without using this primitive. Every keystroke counter in existence (WhatPulse, Whatpulse-likes, etc.) faces the same situation.

## What KeyCounter actually does

- Reads only **virtual key codes** in the hook callback
- Increments **counters in memory**
- Periodically flushes counters to a local SQLite database
- Never stores the content of your typing
- Never makes network calls

The hook implementation is one small file you can audit: [`src-tauri/src/`](../src-tauri/src/).

## What we're doing to reduce false positives

1. **Reproducible builds via GitHub Actions** — every release is built in public so you can verify the binary matches the source.
2. **Code signing** — once the project stabilizes we plan to obtain an EV code signing certificate for Windows and Apple Developer ID notarization for macOS.
3. **Submitting false-positive reports** to Microsoft Defender after each release.
4. **No anti-analysis tricks** — no UPX packing, no obfuscation, no anti-debug.
5. **No autostart via the registry's `Run` key** — we use the OS-blessed Task Scheduler / Login Items APIs through Tauri plugins.

## How to run an unsigned build safely

If you trust the source (read it, build it yourself, or compare hashes with GitHub Actions output):

### Windows SmartScreen

1. Right-click the installer → **Properties** → check **Unblock** → **OK**.
2. Run the installer → click **More info** → **Run anyway**.

### Windows Defender false positive

1. Open **Windows Security** → **Virus & threat protection** → **Manage settings** → **Exclusions**.
2. Add the install folder (e.g. `C:\Program Files\KeyCounter`) as an exclusion.
3. Optionally submit the file as a false positive at [microsoft.com/wdsi/filesubmission](https://www.microsoft.com/en-us/wdsi/filesubmission).

### macOS Gatekeeper

If macOS refuses to open an unsigned/un-notarized build:
1. **System Settings → Privacy & Security** → scroll down → click **Open Anyway** next to the KeyCounter warning.
2. KeyCounter will also prompt for **Accessibility** permission — this is required for the global keyboard event tap.

## Verifying the binary

Each release on GitHub will include SHA-256 checksums and a link to the GitHub Actions workflow run that built it. To verify:

```bash
# Windows (PowerShell)
Get-FileHash KeyCounter-Setup-x64.exe -Algorithm SHA256

# macOS / Linux
shasum -a 256 KeyCounter.dmg
```

Compare the output against the published checksum and the workflow logs.
