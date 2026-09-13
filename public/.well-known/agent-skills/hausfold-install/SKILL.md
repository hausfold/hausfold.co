---
name: hausfold-install
description: Install haus on a macOS machine with one shell command, as the foundation (no desktop) or as the hacker desktop. Use when the user wants their Mac rebuilt from a config file, wants the hacker desktop, or asks how to try haus.
---

# Install haus

One command, run by the user (not you) in a terminal:

```sh
curl -fsSL https://hausfold.co/haus.sh | bash
```

The URL says what is selected:

- `haus.sh`: the foundation. The layer with no desktop: no bar, no tiling, no
  palette, no wallpaper. Rooms are turned on afterwards, one line each, or a
  desktop is selected with `haus desktop hacker`.
- `hacker.sh`: the hacker desktop. Tiling windows, a bar, a themed terminal,
  the one desktop haus ships.

`everyday.sh` and `minimal.sh` still resolve for whoever saved them, but are
retired: each installs the foundation plus the rooms that desktop turned on.
Never hand one to a new user.

## Before you run it

- macOS only. The installer checks what it needs and stops with a plain-language
  message if a prerequisite is missing.
- The script is public and readable at the same URL; read it before piping it
  to bash. It installs Nix and fetches the rest from public sources.
- Nothing installs silently: activation (`haus rebuild`) is a separate,
  visible step, and the installer walks the user through it.

## After

The machine is described by one file. `haus rebuild` applies it, `haus
rollback` undoes a rebuild. The loop and the agent-facing workflow are in
`https://hausfold.co/docs/haus/` (markdown twin: any page URL plus `.md`).
