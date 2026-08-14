# Copilot instructions

**Read [`AGENTS.md`](../AGENTS.md) at the repo root first — it is the full,
authoritative instruction set for every agent working here, and this file is
only a pointer to it.** (Copilot doesn't follow file imports, hence the
duplication below; if the two ever disagree, `AGENTS.md` wins.)

The short version:

- This is **hausfold.co**: a static site on a Cloudflare Worker. **There is a
  build step** — the pages are Next routes under `src/app/`, the docs are MDX in
  `content/docs/`, `npm run build` writes `out/` (with `public/` copied in
  verbatim), and `out/` is what deploys. `worker.js` serves the three routes
  that can't be files: `/<desktop>.sh`, `/download/<app>`, `/api/release/<app>`.
  **Pushing to `main` deploys**; there is no staging.
- **This repo is public and starts at one commit on purpose.** Nothing private
  may ever be committed here — no handles register, no account facts, no
  "temporarily" pasted ids. Register-shaped things live in the private
  `hausfold/ops`, and must not be summarised here either: the gaps are the
  sensitive half.
- **Many changes belong in another repo.** Product behaviour goes to that
  product's repo (pounce, perch, nebelung, holt, trill), and `haus.*` options,
  the desktop's opinions and `bootstrap.sh` itself go to `hausfold/haus`. The
  docs and the install one-liner's *route* are here. `AGENTS.md`'s routing table
  decides.
- **Positioning is not a copy edit.** A new claim about what hausfold *is* needs
  backing in the workshop's `notes/hausfold-rename.md`; three reversals are on
  record. Same for adding a gallery row or naming a product that isn't real yet.
- House rules that are easy to break by accident: greyscale at rest (accents are
  borrowed from nebelung and hover-only), no motion beyond the one hover sheen,
  no `og:image` (a decision, not an omission), and **the head comes from a
  template** — `src/lib/page-meta.ts` for the canonical and `og:` tags,
  `src/app/layout.tsx` for both `theme-color`s. A new page that forgets
  `pageMetadata` has neither, and nothing checks that. The docs deliberately
  spend colour at rest, one hue per tree; the greyscale rule is the landing
  pages'.
- The dark theme's nebelung values are **generated, not typed**: `node
  scripts/sync-nebelung.mjs`, guarded by the Palette workflow's `--check`.
  Don't hand-edit the vendored block.
- **Land through a PR** — never a direct push to `main` from an agent branch.

For review comments, the bar is: right repo, no private material, positioning
backed by a decision, and head/token consistency across pages — over style.
