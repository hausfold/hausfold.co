# Copilot instructions

**Read [`AGENTS.md`](../AGENTS.md) at the repo root first — it is the full,
authoritative instruction set for every agent working here, and this file is
only a pointer to it.** (Copilot doesn't follow file imports, hence the
duplication below; if the two ever disagree, `AGENTS.md` wins.)

The short version:

- This is **hausfold.co**: a small static site on a Cloudflare Worker. `public/`
  is the whole thing and there is no build step — what's in the directory is what
  the domain serves. **Pushing to `main` deploys**; there is no staging.
- **This repo is public and starts at one commit on purpose.** Nothing private
  may ever be committed here — no handles register, no account facts, no
  "temporarily" pasted ids. Register-shaped things live in the private
  `hausfold/ops`, and must not be summarised here either: the gaps are the
  sensitive half.
- **Most changes belong in another repo.** Product behaviour goes to that
  product's repo (pounce, perch, nebelung, holt, trill), `haus.*` options and the
  rice go to `hausfold/hausfold`, docs and the install one-liner go to the
  workshop's `web/`. `AGENTS.md`'s routing table decides.
- **Positioning is not a copy edit.** A new claim about what hausfold *is* needs
  backing in the workshop's `notes/hausfold-rename.md`; three reversals are on
  record. Same for adding a gallery row or naming a product that isn't real yet.
- House rules that are easy to break by accident: greyscale at rest (accents are
  borrowed from nebelung and hover-only), no motion beyond the one hover sheen,
  no `og:image` (a decision, not an omission), and **every page carries the same
  head** — a canonical, `og:` tag or `theme-color` changed on one page must
  change on all of them. Nothing checks the canonical or the `og:` tags at all;
  the dark `theme-color` is checked by `sync-nebelung.mjs`, but `palette.yml`'s
  path filter means an HTML-only PR never runs it.
- The dark theme's nebelung values are **generated, not typed**: `node
  scripts/sync-nebelung.mjs`, guarded by the Palette workflow's `--check`.
  Don't hand-edit the vendored block.
- **Land through a PR** — never a direct push to `main` from an agent branch.

For review comments, the bar is: right repo, no private material, positioning
backed by a decision, and head/token consistency across pages — over style.
