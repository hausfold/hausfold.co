# CLAUDE.md

@AGENTS.md

Claude-only wiring: `.claude/settings.json` runs `.agents/setup.sh` on `SessionStart` (installs Nix in cloud containers for `scripts/sync-nebelung.mjs`; no-ops locally).
The `scruff hook create` / `scruff hook remove` worktree hooks live in your `~/.claude/settings.json`, declared by haus.
The cross-harness map is [`.agents/README.md`](./.agents/README.md).
