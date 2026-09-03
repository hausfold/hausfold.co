---
name: hausfold-install
description: Install a haus desktop (hacker, everyday, minimal) on a macOS machine with one shell command. Use when the user wants their Mac rebuilt from a config file, wants one of the named desktops, or asks how to try haus.
---

# Install haus

One command, run by the user (not you) in a terminal:

```sh
curl -fsSL https://hausfold.co/hacker.sh | bash
```

The URL names the desktop:

- `hacker.sh`: tiling windows, a bar, a themed terminal. The one most people
  mean when they install haus.
- `everyday.sh`: a better menu bar and a search box that opens anything, none
  of the developer tooling.
- `minimal.sh`: just the themed shell on an otherwise stock macOS.
- `haus.sh`: installs the layer and asks which desktop to build.

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
