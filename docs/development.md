# development

One Next app, one build. `npm ci` once, then:

```sh
npm run dev                          # every page, docs and landing alike, hot reload
npm run build && npx wrangler dev    # the site as deployed
npm test                             # worker.js, offline, ~1s
npm run types:check && npm run lint  # what CI runs first
```

`npm run dev` is the loop for everything with a URL. Reach for `wrangler dev`
whenever you touch a *path*: it's the same asset server as production, so it's
the only way to see `_redirects`, `_headers`, `not_found_handling` and
`worker.js` behave. AGENTS.md ▸ Deploying lists the redirects worth checking;
`public/_redirects` is all of them.

## the map

```
src/app/                          the routes
  page.tsx                        the house's door — github, the masthead, #made (one list)
  perch/privacy/                  perch's policy URL, linked from the App Store — don't
                                  move or rename it. It is the only route here
                                  besides the door: every sheet is a docs page
                                  (the layer's is content/docs/haus/index.mdx)
                                  and the seller's pages don't exist, with 301s
                                  in _redirects for all of them
  not-found.tsx                   the 404; Next's export always writes out/404.html from this
  layout.tsx                      the head every route carries — icons, both theme-colours
  docs/                           the Fumadocs shell; /docs itself 301s to /docs/haus/
  global.css                      Fumadocs re-pointed at hausfold.css's tokens
src/components/
  sheet.tsx                       the colophon and the GitHub mark inside it
  command.tsx                     a fenced command with its copy button
  mdx.tsx, page-actions.tsx       what the docs render, and the "Open in…" menu
src/lib/
  page-meta.ts                    a page's canonical + og: tags, in one call
  jsonld.ts                       the homepage JSON-LD graph (page, /index.jsonld, /schema.jsonl)
  shared.ts                       the strings the build repeats, theme-color included
  icons.tsx                       the docs' whole icon vocabulary, by name
content/docs/                     the docs, as MDX — haus/, pounce/, perch/ and trill/ are root folders
public/                           assets only; no HTML lives here
  hausfold.css                    tokens, type, and the design decisions in its header
  _redirects  _headers            consumed by Cloudflare, never served
  favicon.svg  favicon.ico  robots.txt  schemamap.xml
  .well-known/                    the agent-skills tree (index.json is generated); agent-card.json is worker.js's, not a file here
worker.js  test/                  the machine routes, and their tests
scripts/                          generators, plus the OpenAI submission wizard — not deployed
```

🚨 **One id is load-bearing**, and it is the target of a 301 someone already
holds: `#made` on `/` (`/refunds`, both spellings). Renaming it means editing
`public/_redirects` in the same commit. `#desktops` does not exist — its two
callers land on `desktops/choosing` itself, a page rather than a fragment.

Two conventions the linter enforces and one it can't: an internal link is
`<Link>`, an external one a plain `<a>` — and a `worker.js` route
(`/hacker.sh`, `/download/<app>`) is internal but *not* a Next route, so it
takes a plain `<a>` too, or the router client-navigates to a page it has never
heard of.

## the generated files

Four outputs are committed and none is written by hand.

**The palette.** `public/hausfold.css` opens with a block vendored from
nebelung's own CSS port — fetched with `nix build github:hausfold/nebelung`, the
one script here that wants Nix — so the dark theme reads `var(--nebelung-*)`
instead of twenty hand-copied hexes. The same script draws both favicons.

```sh
npm run palette              # re-render the block from the pinned revision
node scripts/sync-nebelung.mjs --latest   # has nebelung moved, and what would a bump change?
```

The flake ref is **pinned** in the script, which is what keeps CI deterministic
— the palette check fails for what your PR did, never for what nebelung merged
that morning. The price is that drift is *pulled*: `--latest` is the asking.
(No node? `nix run nixpkgs#nodejs -- scripts/sync-nebelung.mjs`.)

**The options reference** (`content/docs/haus/reference/options.mdx`), **the
keybinding snapshot** (`src/data/rice-bindings.json`), **the bar's two colour
tables** (on `rooms/bar-widgets`) and **the room catalogue** (`rooms/index.mdx`
and the `---Rooms---` group) all read haus's committed `docs/site-data/`, so none
of them needs Nix:

```sh
npm run options -- --haus /path/to/haus             # regenerate
npm run options:check -- --haus /path/to/haus       # is the committed page current?
npm run bindings:check -- --haus /path/to/haus      # did haus's bindings move?
npm run bindings:update -- --haus /path/to/haus     # accept them, after reviewing the prose
npm run bar-tables:check -- --haus /path/to/haus    # do the tone/mark tables still match?
npm run bar-tables:update -- --haus /path/to/haus   # accept a rewording, after reading it
npm run rooms:check -- --haus /path/to/haus         # is the catalogue still haus's room list?
npm run rooms:update -- --haus /path/to/haus        # accept a reworded blurb, after reading it
```

`gen-options.mjs` renders haus's prose, it never rewrites it — what it decides
is how much arrives at once. A description over ~700 characters opens on its
first paragraph and keeps the rest behind `More detail`; AGENTS.md's
options-reference table has that rule and the 240-character one for a shared
description, and the constants are `FOLD_OVER`, `FOLD_MIN_REST` and
`SHARED_FOLD_OVER` in the script. Two more shaping decisions live only there: a
one-token example goes on the metadata line instead of into a fenced block, and
an indented block inside a description is fenced rather than flattened into a
paragraph. None of them can be tuned from this side by editing the page.

Three weekly workflows watch `hausfold/haus`, and all three also fail on a PR
that hand-edits what they cover. Options drift opens or updates one generated
PR; the other two only *fail*, on purpose — their fix is prose someone has to
read, not a regeneration.

**A red drift PR is usually superseded rather than broken.** Its own `check` job
re-renders against haus's tip, so the branch goes red as soon as haus moves, and
the next Monday force-pushes a fresh render onto it. If `main` caught up in the
meantime — someone regenerated by hand — that run finds no drift and closes the
PR instead. Check `main` against a current haus before trying to fix one.

Bar-tables drift is the one that reads a **written** page rather than a
generated file or a snapshot alone: it parses the two tables under "Tones, not
colours", holds their row names and order to haus's lists exactly, and snapshots
the `meaning` column separately. The wording on that page stays this repo's —
AGENTS.md ▸ The generated page has what doesn't.

**The agent-skills index** (`public/.well-known/agent-skills/index.json`) lists
the domain's agent skills with the SHA-256 of each `SKILL.md`, per the Agent
Skills Discovery draft. `scripts/gen-agent-skills.mjs` derives every field —
name, description, digest — from the SKILL.md files themselves, so the index
cannot disagree with its artifacts. It runs as the first half of `npm run
build`, so a PR editing a SKILL.md and the committed index together is exactly
the digest the build recomputes; one that edits only the index fails loud.

## what CI checks

| workflow | on a PR touching | what it does |
|---|---|---|
| `docs.yml` | `src/`, `content/`, `public/`, the build config | type-check, lint, then **two cold builds diffed against each other**, plus a non-empty `out/api/search` |
| `worker.yml` | `worker.js`, `test/`, `scripts/dns-aid.mjs`, `scripts/submit-openai-app.sh`, either wrangler config, the package files | `npm test`, plus: both wrangler configs must name the same `main` and `ASSETS`. The two scripts are in the filter because the suite *parses* them |
| `palette.yml` | `public/hausfold.css`, `src/lib/shared.ts`, either favicon, `scripts/` | `sync-nebelung.mjs --check` against the pinned revision |
| `bar-tables-drift.yml` | `scripts/check-bar-tables.mjs`, `src/data/bar-tables.json`, `rooms/bar-widgets.mdx` | `check-bar-tables.mjs` against haus's published tone ladder and mark set. The page is in that filter because this one *parses* it |
| `rooms-drift.yml` | `scripts/check-rooms.mjs`, `src/data/rooms.json`, `content/docs/haus/rooms/**`, the haus tree's `meta.json` | `check-rooms.mjs` against haus's room registry: the cards and namespace table on `rooms/index`, the `---Rooms---` group, and whether every room haus publishes has a page. The page and `meta.json` are in the filter because this one *parses* both |
| `dns.yml` | nothing on a PR (no secrets there); `main`, on `scripts/dns-aid.mjs` or `worker-config.js`, plus a Monday cron | converges the DNS-AID records under `_agents.hausfold.co` on the table, then asks 1.1.1.1 what it sees. `test/dns-aid.test.js` covers the table on PRs through `worker.yml`; see [deploying](deploying.md#the-dns-aid-records) |

The reproducible-build check is the one that isn't boilerplate: the export is
byte-identical across cold builds (`generateBuildId` in `next.config.mjs` is what
makes it so), and without the check, the day a Next or Fumadocs release
introduces a timestamp is a day nothing tells you about. AGENTS.md ▸ Deploying
has what it does and doesn't catch.

`palette.yml` goes red when the vendored block is stale, when a dark block
stops spending it, when a `--nebelung-*` reference lands in the light theme, or
when the dark `theme-color` in `src/lib/shared.ts` stops matching crust. `npm run
palette` fixes all but two, which are hand work: `themeColor`, which nothing
generates, and an upstream *rename* — a token that stopped existing leaves a
dangling `var()` and a dark page with no background.

Its two non-colour guards are worth knowing for *why*: `favicon.ico` is compared
as **decoded pixels, not bytes**, because identical input through a different
zlib version gives different compressed output and that broke a real CI run; and
`favicon.svg`'s comment may not contain two hyphens in a row, which is illegal
XML that stops the icon rendering with nothing in any console.
