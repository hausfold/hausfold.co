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
`worker.js` behave. `/haus` should 307 to `/haus/`, `/desktops` should 301 to
`/#desktops`, and a made-up path should 404 rather than answer 200.

## the map

```
src/app/                          the routes
  page.tsx                        landing page — masthead, the desktop catalogue (#desktops), the apps
  haus/, perch/, pounce/,         one page each; perch/privacy/ is linked from the App Store
  desktops/nebelhaus/,            — don't move or rename that URL
  terms/, refunds/
  not-found.tsx                   the 404; Next's export always writes out/404.html from this
  layout.tsx                      the head every route carries — icons, both theme-colours
  docs/                           the Fumadocs shell
  global.css                      Fumadocs re-pointed at hausfold.css's tokens
src/components/
  sheet.tsx                       the breadcrumb, the colophon, the ⌂ mark
  command.tsx                     a fenced command with its copy button
  mdx.tsx, page-actions.tsx       what the docs render, and the "Open in…" menu
src/lib/
  page-meta.ts                    a page's canonical + og: tags, in one call
  shared.ts                       the strings the build repeats, theme-color included
  icons.tsx                       the docs' whole icon vocabulary, by name
content/docs/                     the docs, as MDX — haus/ and nebelhaus/ are both root folders
public/                           assets only; no HTML lives here
  hausfold.css                    tokens, type, and the design decisions in its header
  _redirects  _headers            consumed by Cloudflare, never served
  favicon.svg  favicon.ico  robots.txt
worker.js  test/                  the three code routes, and their tests
scripts/                          generators — not deployed
```

Two conventions the linter enforces and one it can't: an internal link is
`<Link>`, an external one a plain `<a>` — and a `worker.js` route
(`/nebelhaus.sh`, `/download/<app>`) is internal but *not* a Next route, so it
takes a plain `<a>` too, or the router client-navigates to a page it has never
heard of.

## the generated files

Three outputs are committed and none is written by hand.

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

**The options reference** (`content/docs/haus/reference/options.mdx`) and **the
keybinding snapshot** (`src/data/rice-bindings.json`) both read haus's committed
`docs/site-data/`, so neither needs Nix:

```sh
npm run options -- --haus /path/to/haus          # regenerate
npm run options:check -- --haus /path/to/haus    # is the committed page current?
npm run bindings:check -- --haus /path/to/haus   # did haus's bindings move?
npm run bindings:update -- --haus /path/to/haus  # accept them, after reviewing the prose
```

Two weekly workflows watch `hausfold/haus`, one per file — and both also fail on
a PR that hand-edits the output. Options drift opens or updates one generated
PR; keybinding drift only *fails*, on purpose — its fix is prose someone has to
read, not a regeneration.

## what CI checks

| workflow | on a PR touching | what it does |
|---|---|---|
| `docs.yml` | `src/`, `content/`, `public/`, the build config | type-check, lint, then **two cold builds diffed against each other**, plus a non-empty `out/api/search` |
| `worker.yml` | `worker.js`, `test/`, either wrangler config, the package files | `npm test`, plus: both wrangler configs must name the same `main` and `ASSETS` |
| `palette.yml` | `public/hausfold.css`, `src/lib/shared.ts`, either favicon, `scripts/` | `sync-nebelung.mjs --check` against the pinned revision |

The reproducible-build check is the one that isn't boilerplate. The export is
byte-identical across cold builds today (`generateBuildId` in
`next.config.mjs` is what makes it so); without the check, the day a Next or
Fumadocs release introduces a timestamp is a day nothing tells you about.

`palette.yml` goes red when the vendored block is stale, when a dark block
stops spending it, when a `--nebelung-*` reference lands in the light theme, or
when the dark `theme-color` in `src/lib/shared.ts` stops matching crust. One
command fixes all of those except two, which are hand work: `themeColor`, which
nothing generates, and an upstream *rename* — a token that stopped existing
leaves a dangling `var()` and a dark page with no background.

Two things it guards that aren't colours: `favicon.ico` is compared as
**decoded pixels, not bytes** (identical input, different zlib version, different
compressed output — that broke a real CI run), and `favicon.svg`'s comment must
not contain two hyphens in a row, which is illegal XML that silently stops the
icon rendering with nothing in any console.
