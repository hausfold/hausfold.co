# AGENTS.md

**hausfold.co** — a small static site on a Cloudflare Worker. This file is the
one set of instructions for every agent working here; [`README.md`](./README.md)
and the four pages under [`docs/`](./docs) cover what the thing is and how it is
built, run and deployed, and this file covers what you may change.

> **Terminology update, decided 2026-08-13:** user-facing copy calls an
> installable `{ haus = { … }; }` configuration a **desktop**, not a "rice".
> Existing "rice" spellings in this file are legacy wording; preserve them only
> in historical quotations, URLs, filenames, and code identifiers, and do not
> introduce the term into new prose.

> **This repo is public, and it starts at one commit on purpose.** The site
> lived in the private `hausfold/website` until 2026-08-08. It moved here rather
> than being flipped, because that repo's history could not be made safe — see
> [`docs/history.md`](./docs/history.md).
> Two consequences you will feel: **`git log` before 2026-08-08 is in the old
> repo, not this one**, and **nothing private may ever be committed here again**
> — no register, no account facts, no "temporarily" pasted ids. There is no
> second migration available.

## What belongs here, and what doesn't

**hausfold is the platform, the org and the seller** (decided 2026-08-08 — the
header of `PRESENCE.md` in the private
[`hausfold/ops`](https://github.com/hausfold/ops), and
[`notes/hausfold-rename.md`](https://github.com/hausfold/workshop/blob/main/notes/hausfold-rename.md)
in the workshop). The nix-darwin ricing platform every rice sets `haus.*` options
on, the apps, the tools — *and* still the name on terms, refunds and press.
**nebelhaus is one rice built on it.**

> ⚠️ **This section used to say the opposite, in a way that will actively fight
> you.** It read *hausfold is the commercial umbrella … deliberately not a
> product brand and not the rice gallery*, and **"Nothing in the nebelhaus
> family may move into this org."** That rule is **repealed**: all ten repos
> migrate in, and the gallery is **`hausfold.co/#desktops`** (it was
> `/desktops`, its own page, until 2026-08-12 — written `/market`
> here and in the rename plan until later the same day; see the desktops
> section below).
> If you meet that sentence anywhere else, it's stale — fix it rather than obey
> it.

> ✅ **Decided 2026-08-10 — the layer is `haus`, the house is `hausfold`.**
> Say **`haus`** for the nix-darwin layer a user installs and writes options
> for; say **`hausfold`** for the org, the maker and the seller. So the section
> above still holds with one word swapped: hausfold *makes* the platform and is
> still the name on terms, refunds and press — but the platform itself is what
> the site calls `haus`, which is also its CLI and its option namespace.
> Recorded as decision 8 in
> [`hausfold-rename.md`](https://github.com/hausfold/workshop/blob/main/notes/hausfold-rename.md),
> which explains at length why this refines the 2026-08-08 reversal rather than
> becoming a third position on it.
>
> 🚨 **This is not a licence to sweep `hausfold` → `haus`.** Nothing in code
> moved — the namespace was already `haus.*`, the org already `hausfold`, the
> domain already `hausfold.co` — and every existing spelling still names the
> thing it always named. The word changes only where prose meant *the layer*:
> the landing page's closing section, the landing index, `/desktops`. (It used
> to name `/haus` first; that page was retired into `/docs/haus` on
> 2026-08-14 — see the page table below.)

| Want to change… | Where |
|---|---|
| the hausfold.co landing page — copy, design, the products it lists | here, `src/app/page.tsx` (it was `public/index.html` until 2026-08-14) |
| the desktops **catalogue** | here, and it is **not** a page of its own any more — it is the first section of `src/app/page.tsx` (`/#desktops`). See below |
| a **desktop's own page** | here, `src/app/desktops/<name>/page.tsx` — that half didn't move, only its file extension did |
| a handle, an account, a claimed namespace | **not here** — `PRESENCE.md` in the private [`hausfold/ops`](https://github.com/hausfold/ops) |
| anything about a **product** (pounce, perch, nebelung, holt, trill) | that product's own repo, all under `github.com/hausfold`. Plan §3.2 transferred the nine on 2026-08-08, so `nebelhaus/pounce` and friends are redirects rather than addresses. 🚨 **`trill` is the exception**: it was *created* at `hausfold/trill` on 2026-08-09, and `nebelhaus/trill` now resolves to `nebelhaus/messages` — the archived iMessage client, a different project (§3.4). Typing the old spelling for trill lands you on a tombstone, silently |
| the **platform** — any `haus.*` option, presets, packs, the `haus` CLI | the platform repo, `hausfold/haus` (the checkout is `./haus` in the workshop as of 2026-08-11 — **not** `./hausfold.co`, which is this repo. It was `./hausfold`, one dot away, until then) |
| the **nebelhaus rice** — its opinions and defaults | the platform repo too, for now; it becomes a rice file of its own later (plan §7). The rice keeps the name nebelhaus, forever — only the org, the repo and the option namespace moved |
| anything about **trill**, the notification compositor | [`hausfold/trill`](https://github.com/hausfold/trill) — its own repo since 2026-08-09. It was called **flick** while it incubated in the workshop; both names appear in older text here |
| **the docs** (`/docs/*`) | **here**, `content/docs/` — Fumadocs MDX, since 2026-08-12. ✅ All twenty-nine source decisions are closed as of 2026-08-13: twenty-eight were ported and `start/the-family` was deliberately retired. The old tree still lives on nebelhaus.com until the 301s land, so a fact fixed in one tree and not the other will disagree |
| the install one-liner — the URL, the desktop table, the ref pinning | **here**, `worker.js`, since 2026-08-14. `curl -fsSL https://hausfold.co/nebelhaus.sh \| bash`. A second desktop is a row in `DESKTOPS`, not a new route |
| the install *script* itself (`bootstrap.sh`) | `hausfold/haus` — the Worker only proxies it, and pins the ref |
| the family's strategy notes (`go-to-market.md`, monetization) | `notes/` in the workshop |

**The change in flight is half-landed** (plan §5.2) — know exactly which half
before you make architectural assumptions here:

✅ **`/docs` has arrived**, rebuilt on [Fumadocs](https://fumadocs.dev) — Next,
`output: 'export'`, static. Not a port of the workshop's Astro/Starlight tree;
that was the user's call on 2026-08-09. **All twenty-nine source decisions are
now closed:** twenty-eight became Fumadocs pages, and `start/the-family` was
deliberately retired. This repo therefore **has a build step** now: `npm run
build` writes `out/`, Next copies `public/` into it verbatim, and `out/` is what
deploys.

✅ **`worker.js` has arrived too** (2026-08-14), so this is no longer an
assets-only Worker: `wrangler.toml` has a `main`, and three routes run code —
`/<desktop>.sh`, `/download/<app>` and `/api/release/<app>`. Assets still
short-circuit first, so no page on the site touches it. **The install one-liner
is `curl -fsSL https://hausfold.co/nebelhaus.sh | bash`** and every page that
prints it says so; `nebelhaus.com/init.sh` keeps working meanwhile, and becomes
a redirect to this one when the 301s land. There is deliberately **no
`/init.sh` here** — the desktop's name is the point of the route.

✅ **The landing pages arrived on 2026-08-14** — all eight became Next routes
under `src/app/`, and `public/` holds no HTML at all any more. Same markup, same
`.sheet` classes out of `public/hausfold.css`, same words; what stopped being
hand-copied is the head (`src/lib/page-meta.ts`), the copy-button script
(`src/components/command.tsx`) and the breadcrumb/colophon
(`src/components/sheet.tsx`). **Every "the markup is temporary, the copy is
not" note below has now cashed in**: the markup was replaced, the copy was
carried across unchanged.

❌ **Not yet:** the `nebelhaus.com/*` 301s, which live in the workshop's `web/`
and are what finally retires the old tree. **Until they land there are two live
copies of every docs page**, so a fact fixed in one tree and not the other will
disagree.

*(§5.1's other prerequisite — "this repo goes public" — was settled on
2026-08-08 by creating this repo public rather than flipping the old one. The
plan was amended to match in
[workshop#260](https://github.com/hausfold/workshop/pull/260), so read it as
written; if you meet `hausfold/website` in it anywhere, that's a leftover and
it means this repo.)*

**`hausfold/ops` is where a register-shaped thing goes** — handles, account
facts, where credentials live. Not here, and not the workshop, which is also
public. If you find yourself about to write down what we hold and what we don't,
you are in the wrong repo.

### The desktops — the consolidation's first pages, arriving early

Added 2026-08-08, in the same hours as the repositioning above and by a
different session, so read the two together:

- 🚨 **The catalogue is not a page any more — it is the landing page.** From
  2026-08-08 to 2026-08-12 it lived at `/desktops`; it is now the first section
  of `src/app/page.tsx`, and `/desktops` + `/desktops/` 301 to `/#desktops`
  through `public/_redirects`. **The deep page did not move**:
  `/desktops/nebelhaus/` is untouched, and the `/desktops/` URL segment stays
  because it is the namespace the second and third desktop land in. So: edit
  the catalogue in `src/app/page.tsx`, edit a desktop in
  `src/app/desktops/<name>/page.tsx`. Add a `src/app/desktops/page.tsx` only
  when there are enough entries to need a list of their own — and if you do,
  drop the two `_redirects` lines in the same commit, or the new page will 301
  away from itself. (Cloudflare evaluates `_redirects` ahead of the assets, so
  a route existing does not beat a redirect pointing away from it.)
- **It is the gallery, in substance.** A catalogue of rices with a page each,
  carrying what a rice is, what's in it, what it needs, and the command that
  installs it. Under the old rule that was forbidden; under the new one it's
  §5.1 arriving ahead of schedule.
- ✅ **The name is `/desktops`, and the plan was amended to match.** For a few
  hours on 2026-08-08 the plan said `/market` and the page said `/desktops` —
  two sessions deciding in parallel, both with the user. The user resolved it in
  favour of the page, so `hausfold-rename.md` decision 7, `go-to-market.md` §5
  and `options-roadmap.md` now all read `/desktops`
  ([workshop#258](https://github.com/hausfold/workshop/pull/258)). ⚠️ If you
  meet `hausfold.co/market` anywhere, it's stale — fix it rather than obey it.
- ~~**It is plain HTML, not Astro.** §5.1 replaces this markup wholesale when
  the build lands.~~ **Done, 2026-08-14** — and it went the way this bullet
  asked: the structure was replaced, the copy was carried across word for word.
  The instruction that outlives it is the second half: the copy was written
  against the real sources, so keep it.
- **Every fact on a desktop's page is a copy, and copies rot** — especially the
  install one-liner and the requirements, the two that hurt. ✅ **The source
  changed on 2026-08-14, and it's now inside this repo**: check the page against
  `content/docs/haus/install.mdx` and `content/docs/haus/desktops/choosing.mdx`,
  not against a README in another org. Those pages were verified against haus
  when they were ported, `reference/options.mdx` is *generated* from haus's
  module system with CI re-rendering it, and a drift you fix there fixes the
  docs at the same time.
  The old source is what let this page drift for six days: it listed haus's
  internal module names (`den`, `prowl`, `sill`, `hearth`, `collar`) at readers
  who will only ever meet the **rooms** those modules implement, and claimed the
  installer runs on any Mac when it stops on Intel. **The reader-facing
  vocabulary is rooms** — the same ones the docs sidebar is organised around,
  and `/desktops/nebelhaus` names the eight nebelhaus turns on (windows, the
  bar, the launcher, the shelf, the terminal, focus, security, agents), per
  `desktops/choosing.mdx`. A `haus.*` namespace is a thing you type, not a
  thing a landing page names. ⚠️ Don't put a *count* of the rooms on a page:
  `content/docs/haus/index.mdx` says twelve and `content/docs/haus/meta.json`
  lists thirteen entries under `---Rooms---` (`rooms/agent-rebuilds` is the
  odd one), so any number you write here is wrong somewhere.

The desktops aren't the only product surface here. `/perch/privacy` predates them: an
App Store listing needs a policy URL on a domain the seller owns, and hausfold
is the seller. That one is a legal obligation, not a shop window.

### `/perch`, `/terms`, `/refunds` — the seller's surface, arriving before the sale

Added 2026-08-08, the same §5.1-early move `/desktops` was: treat the markup as
temporary and the copy as not. **The markup half of that came due on
2026-08-14** — all three are Next routes now, with the copy unchanged. Three
things to know before editing them:

- **`/perch` is the product page, moved here.** It's the consumer-voice page
  [`notes/perch-monetization.md`](https://github.com/hausfold/workshop/blob/main/notes/perch-monetization.md)
  Phase 3 asks for, and the landing page links it internally now instead of
  pointing at `nebelhaus.com/perch`. ⚠️ **The Astro page in `workshop/web` is
  still live and still what `nebelhaus.com/perch` serves.** Two pages about one
  product will not agree for long — when §5.1 lands, delete the Astro one rather
  than reconciling them, and until then fix a fact in *both* or in neither.
  **`/pounce` (added 2026-08-09) inherits every word of that warning** —
  `workshop/web/src/pages/pounce.astro` is still what `nebelhaus.com/pounce`
  serves, and it is a *denser* page than perch's, so there is more to drift.
  Two products, two duplicate pairs, one rule.
- **`/terms` and `/refunds` exist because Paddle asks for them.** Paddle's
  account review sits in front of every other step of Phase 2, and it wants
  policy URLs on the seller's own domain. They describe a licence nobody can buy
  yet; that's deliberate, not a leak. The app's licence layer is inert until a
  public key is baked in (`perch/docs/going-paid.md` is that runbook), so these
  pages are ahead of the software on purpose.
- **None of the three names a price**, and that was the user's call on
  2026-08-08: no price goes up before there's a checkout to click, because a
  price with no button reads as a rug-pull warning to people using perch free
  today. The price and the Paddle overlay land together, on `/perch`, in one
  commit on flip day.
- 🚨 **The contact address is `hi@hausfold.co`, and that is deliberate — do not
  "upgrade" it to `support@`.** It reads informal for a legal page and a later
  session will want to fix it. Settled 2026-08-09
  ([`notes/hausfold-rename.md`](https://github.com/hausfold/workshop/blob/main/notes/hausfold-rename.md)
  §5.4): `hi@` is the address that actually routes, `support@hausfold.co` never
  existed outside three checkboxes in perch's runbooks, and swapping the
  printed address is only free *before* the first receipt. If `support@` is
  ever wanted it lands as an **alias onto `hi@`**, which changes nothing here.
  ⚠️ **It is not just `/terms`.** The address still reaches all eight pages, but
  since 2026-08-14 it is *written* five times rather than ten: once in
  `src/components/sheet.tsx`'s `<Colophon>` (which is every page's footer), and
  once each in the prose of `/terms`, `/refunds` and `/perch/privacy` — the
  three that name it in a sentence as well as a footer. The fifth is the
  **JSON-LD organization record** in `src/app/page.tsx`, which is the one a
  find-and-replace over visible copy misses. `rg 'hi@hausfold' src/` finds all
  of them; there is nothing under `public/` to grep any more.

## The site

**`public/` is assets now, not pages.** It held the hand-written half until
2026-08-14; the eight pages became Next routes and what is left is six files
Next copies into `out/` untouched. The hand-written *half* still exists — it is
just spelled in TSX and lives under `src/app/` beside the docs.

The pages, and the one rule each carries that isn't obvious:

| Route | Source | What it is |
|---|---|---|
| `/` | `src/app/page.tsx` | the landing page — masthead, the **desktop catalogue** (`#desktops`), the `Apps` list, then the **haus** section (the one-file example, inherited from `/haus`) and a closing line for holt + nebelung. Also the **JSON-LD organization record**, which is the site's machine-readable identity and lists both GitHub orgs on purpose |
| `/desktops/nebelhaus` | `src/app/desktops/nebelhaus/page.tsx` | a desktop's page: install, what you get, requirements. There is deliberately **no** `src/app/desktops/page.tsx` — see the catalogue note above |
| `/perch` | `src/app/perch/page.tsx` | perch's product page: the dance, install, the one system setting, how it behaves |
| `/perch/privacy` | `src/app/perch/privacy/page.tsx` | perch's privacy policy. **Linked from the App Store — don't move or rename this URL.** The one page with a layout of its own, in `privacy.module.css` |
| `/pounce` | `src/app/pounce/page.tsx` | pounce's product page: install, the ⌘Space collision, what's in it, the command format, how it behaves |
| `/terms` | `src/app/terms/page.tsx` | what a licence grants, the update year, the fair-source note, what we don't promise |
| `/refunds` | `src/app/refunds/page.tsx` | fourteen days, no questions. **Paddle's review wants this URL** — don't move it either |
| `404` | `src/app/not-found.tsx` | **moved out of `public/` on 2026-08-12**, two days before the rest — Next's export always writes its own `out/404.html` and overwrites a same-named file copied from `public/`, so leaving it there produced Next's grey default on the live site |
| `/docs/*` | `content/docs/` | a different animal; see [The docs](#the-docs) |

🚨 **`/haus` is gone, as of 2026-08-14 — don't rebuild it.** It was written
before the docs existed, and once `/docs/haus` landed it was a second, shorter,
staler account of the same subject: its commands list was a subset of
[`reference/haus`](content/docs/haus/reference/haus.mdx), its "what it covers"
a subset of the rooms table, its four-desktops paragraph a subset of
[`desktops/choosing`](content/docs/haus/desktops/choosing.mdx). Two pages about
one thing do not stay in step — the same rule this file applies to
`nebelhaus.com/perch`. `/haus` and `/haus/` now 301 to `/docs/haus/` in
`public/_redirects`, and the docs sidebar lost its `haus` way-out row for the
same reason (a link out of the docs that lands in the docs is the tree switcher).
**The one piece that was worth keeping is the example file**, which is a sales
argument rather than a reference and so belongs on a sheet someone reads once:
it moved to the landing page's closing `haus` section, which gained a heading
in the same commit. That section is still the **postscript by position** — the
2026-08-12 decision that haus closes the page rather than opening it stands, and
the reason still holds.

The three things every page above shares, and where they live now — this is the
part that used to be hand-copied nine times:

| Thing | Where |
|---|---|
| canonical, the six `og:` tags, `twitter:card` | `src/lib/page-meta.ts`, called once per page |
| both `theme-color`s, both `<link rel=icon>`, `og:site_name`/`type`/`locale` | `src/app/layout.tsx` — every route in the build, docs included |
| the breadcrumb, the colophon, the GitHub mark | `src/components/sheet.tsx` |
| a fenced command with its copy button | `src/components/command.tsx` |

And what is left under `public/`:

| File | What it is |
|---|---|
| `_redirects` | static redirects, exact paths only. Cloudflare consumes the file rather than serving it, and it is evaluated ahead of the assets — never put a `/desktops/*` wildcard in it, or `/desktops/nebelhaus/` goes with it. **A route existing does not beat a redirect pointing away from it**, which is why adding a `/desktops` page means deleting two lines here in the same commit |
| `favicon.svg` | the mark as geometry, on a dark tile, swept through all six accents. Linked from every page; its wedge fan is generated by `scripts/sync-nebelung.mjs` like the stylesheet's block. **The one thing on this site that holds colour with no hover** — see the greyscale rule below |
| `favicon.ico` | the same mark, monochrome, for Safari — WebKit doesn't resolve the SVG one and falls back to this path. Generated by the same script, from the SVG's own cover path, `--ink` on crust, no accent sweep. **The site's first binary file under `public/`**, added 2026-08-12 — see the script's "the ico fallback" comment for the trade |
| `robots.txt` | allows everything; no `Sitemap:` line, and its comment says why |
| `_headers` | two rules: a `Content-Type` for `/api/search` (extensionless, so Cloudflare would otherwise ship the search index uncompressed) and a year of cache for `/_next/static/*` |
| `hausfold.css` | the shared tokens, type and link styles, the vendored nebelung block, and the header comment with the design decisions. ⚠️ **Nothing links it any more.** It reaches the browser through `src/app/global.css`'s `@import`, inlined into Next's own bundle at build time, so `/hausfold.css` is still *served* but is a dead URL. It stays under `public/` because that is the path `global.css` imports and the path `scripts/sync-nebelung.mjs` writes — moving it means editing both, for nothing |

**The dark theme's nebelung values are generated, not typed.** Since
2026-08-08, `public/hausfold.css` opens with a block vendored from nebelung's
own CSS port (`dist/css/nebelung-mocha.css`, which `nix build
github:hausfold/nebelung` renders), and both dark blocks read
`var(--nebelung-*)` out of it. Refresh it with `node
scripts/sync-nebelung.mjs`; `.github/workflows/palette.yml` runs the same
script with `--check`. **The same script also writes the favicon's colour
sweep** — `public/favicon.svg`'s wedge fan is ninety hexes interpolated off the
six accents, which is exactly the frozen snapshot the vendoring exists to
prevent, so it comes out of the port too and `--check` fails if it drifts.
Nothing runs at serve time and the script's output is committed. Its
header explains why the port is inlined rather than `@import`ed: the short
version is that a second file is a second blocking request, and a media-scoped
`@import` can't see the `data-theme` toggle. Note `deploy.yml` does not fire on
`scripts/**`, so editing the script alone deploys nothing; running it edits
`hausfold.css` under `public/`, which does.

**The flake ref is pinned** (`PIN` in the script), so CI is deterministic and a
CSS PR never goes red for something nebelung merged that morning. The cost is
that drift is *pulled*: nothing tells you upstream moved. `node
scripts/sync-nebelung.mjs --latest` asks, and names the values a bump would
actually change — run it when you touch the palette, not on a schedule.

`--check` also guards the things the generator *can't* fix for you: an
upstream **rename** (a `--nebelung-*` name that stopped existing leaves a
dangling `var()`, and a dark page with no background — re-point the token by
hand); the dark **`theme-color`**, which is a hand-typed copy of crust that
nothing generates; and the favicon's **tile**, whose ground is the same crust
in a hand-drawn path beside the generated fan. Because those checks read a TS
module and an SVG rather than CSS, `palette.yml`'s paths filter carries
`src/lib/shared.ts` and `public/favicon.svg` alongside the stylesheet; without
them a theme-colour- or icon-only PR skipped the only check watching it.

> 🚨 **This used to be ten hand-typed `<meta>`s and a rule that "a new page owes
> a `theme-color`".** Both are gone as of 2026-08-14: the eight pages became
> Next routes, `viewport.themeColor` in `src/app/layout.tsx` writes the pair
> into every route in the build, and the one remaining copy of the value is
> `themeColor.dark` in `src/lib/shared.ts` — which is what `--check` now reads.
> A new page cannot forget a `theme-color`, because no page declares one. If
> you meet the old rule anywhere, it's stale.

**`public/favicon.ico` is generated too, and checked by decoded pixels, not
bytes.** Added 2026-08-12 as the Safari fallback (WebKit doesn't resolve the
SVG favicon and falls back to this path), it's rasterized from
`favicon.svg`'s own hand-drawn cover path — `--ink` on crust, no accent sweep
— with a hand-written PNG/ICO encoder in the same script (`node:zlib` + a
small CRC32, no image library). **It used to compare the file's raw bytes,
and that broke on this PR's own CI run**: the file generated locally on Node
22.23.1 didn't match what CI's Node 22.23.2 produced, same picture, different
`zlib.deflateSync` output — compressed bytes aren't promised stable across
zlib versions for identical input. `--check` now decodes `favicon.ico` back
into raw RGB and compares *that* against a fresh rasterization; inflating is
lossless regardless of which zlib compressed the file, so pixels are the
actual invariant, where bytes only looked like one until a second machine
disagreed. It's the site's first binary file under `public/`, which the
"No `og:image`" rule below drew the line at — paid deliberately, because
Safari showing the house mark flat beats showing nothing. `palette.yml`'s
paths filter carries `public/favicon.ico` alongside `favicon.svg` for the
same reason as above.

It guards one non-palette thing as well, because the failure is silent and cost
us a render: **two hyphens in a row inside `favicon.svg`'s comment**. XML
forbids them, the file stops parsing, and no browser says so — the tab just
shows a blank page icon. The comment is long and the palette's every token is
spelled `--something`, so this is easy to write by accident. Spell the token out
in prose instead.

Read `hausfold.css`'s header comment before changing a colour. It was inline in
`index.html` until 2026-08-08; five pages needed one set of tokens rather than
five copies drifting apart. `/perch/privacy` still keeps a layout of its own —
bare `h1`/`h2`/`p`/`ul` selectors that nothing else uses — but it is
`privacy.module.css` now rather than an inline `<style>`. **The scoping is
load-bearing**: those selectors relied on cascading after the shared sheet
inside one standalone document, and under a shared layout they would paint
every other page. A CSS module also fixes the order properly, since stylesheet
order between a layout's imports and a page's is not something to lean on.

Reading the page table as "the landing page, plus some extras" has caught
agents out twice — `/perch/privacy` in particular is easy to miss and is the
one URL here with an obligation attached. **The head no longer drifts between
them**: a canonical or an `og:` tag is `src/lib/page-meta.ts`, and a theme
colour is `src/app/layout.tsx`, so a change to one *is* a change to all of them.
That sentence used to end "and nothing checks", which was the whole reason to
be careful; the care can go somewhere more useful now.

Rules that are easy to break by accident:

- **Greyscale at rest, and every colour is borrowed.** ⚠️ **This bullet is
  about the landing pages only** — the eight `.sheet` routes, which were
  `public/**.html` until 2026-08-14 and which this file called "`public/`" for
  short while they were. `/docs` spends colour at rest — one hue per tree —
  since 2026-08-12, at the user's instruction; see [Colour](#colour--️-the-docs-do-not-follow-publics-greyscale-rule)
  under The docs. The *borrowed* half still binds everywhere: both halves spend
  the same six `--a-*` and neither may invent a seventh. Here, though, no page
  owns an accent, in either theme. Two exceptions, both added 2026-08-08, both
  requiring a hover to happen at all: a product's name in the index takes **that product's
  own accent**, and the `⌂` mark takes **all six at once**, as stripes. Both
  read the same `--a-*` tokens, so the house cannot show a colour no product
  owns and a product cannot be one colour in the index and another in the mark.
  A hue hausfold keeps *at rest* is the thing to avoid: that would put it in
  competition with nebelung's palette, which is the one brand asset the family
  actually shares. The dark accents no longer *match* nebelung — they **are**
  nebelung: `--a-pounce` is `var(--nebelung-peach)`, and so on for all six,
  resolved out of the vendored block above. (`palette.css` in
  [hausfold/workshop](https://github.com/hausfold/workshop) was the source
  while these were hand-copied hexes; nebelung shipping its own CSS port made
  that hop unnecessary.) The light ones stay hand-picked counterparts —
  nebelung's pastels are built for a dark ground — which is why `latte` is not
  vendored and why `--check` fails on a `--nebelung-*` reference outside the
  two dark blocks. `holt` and `trill` (called `flick` when these were picked) have no
  accent *assigned* upstream, so
  teal and yellow are our pick from nebelung's palette rather than nebelung's
  pick for them, and should be reconciled if they get a row.

  **A third exception, added 2026-08-12 at the user's request: the favicon,
  which holds the six-accent sweep with nothing to gate it.** It is the one
  place the rule *cannot* be kept, because the other two exceptions are gated on
  hover and a favicon has no hover state — an icon that is grey until you point
  at it is simply a grey icon. It stays inside the spirit of the rule the way
  the other two do: the sweep is the same six `--a-*` accents in the same order,
  generated out of the same vendored port (`scripts/sync-nebelung.mjs` writes
  the wedge fan), so the house still shows no colour it owns. **This does not
  open the door.** Nothing rendered *in the page* may take a hue at rest; the
  favicon is chrome, it is 16px, and it is one file. `favicon.ico` — the
  Safari fallback added 2026-08-12 — deliberately stays outside this exception
  rather than extending it: it's `--ink` on crust, no accent sweep, so the
  house still shows no colour of its own to the one browser that can't render
  the file that does.
- **No motion, with one hover-only exception.** No load animation, no
  transitions, nothing that moves while you read. The exception, added
  2026-08-08 at the user's request (reshaped the same day, same request): the
  mark's iridescent sheen turns while the pointer is on it, fading in and out
  over 0.7s rather than snapping. `prefers-reduced-motion` holds it still — it
  keeps the colour and drops the turn, because the colour is the idea and the
  movement is the flourish. The fade survives reduced-motion deliberately: a
  crossfade is the reduced-motion-safe form, not the thing the setting exists
  to suppress. A second animation on this site needs the same bar:
  hover-scoped, reduced-motion-aware, and asked for.
- **Almost no JavaScript of our own on the landing pages, and none of it
  load-bearing.** ⚠️ **Restated 2026-08-14, because the old wording said "and
  no framework" and there is a framework now.** The pages are Next routes, so
  they ship Next's client runtime whether they use it or not — that is the
  price of the port and it was paid deliberately. **What they do NOT ship is
  fumadocs.** `<Provider>` lives in `src/app/docs/layout.tsx`, not in the root
  layout, and that placement is load-bearing: at the root — where it sat for
  the two days `/docs` was the only thing under that layout — it gave every
  landing page the search context, the ⌘K binding and a lazy fetch of the
  ~457 KB Orama index. Measured after moving it down: a landing page is 8
  chunks / 173 KB gzip, a docs page 16 / 398 KB. 🚨 **Don't move `<Provider>`
  back up** to satisfy a component that asks for it — give that component its
  own boundary instead. The cost of the split, and it is intended: the
  light/dark toggle is a `/docs` affordance, and the landing pages follow
  `prefers-color-scheme` exactly as they did when they were hand-written HTML
  and shipped no toggle at all. What the rule still governs is *our* script,
  and there is exactly one piece: `<Command>`
  (`src/components/command.tsx`), used on `/`, `/perch`, `/pounce` and
  `/desktops/nebelhaus`, which was four identical twelve-line `<script>` blocks
  until the port. Its bar is unchanged and is the bar for a second one: the
  button renders `hidden` in the exported HTML and unhides only where
  `navigator.clipboard` exists, so the command is plain selectable text with JS
  off — **pure enhancement, nothing lost without it**. A page may hold more
  than one; `/pounce` does, and its second is not an install command but the
  four-line example, which is the thing that page is actually asking you to
  try. (`/docs` is React through and through and is a different animal.)
- **Placeholder frames, never a stale screenshot.** `/desktops/nebelhaus`,
  `/pounce` and `/perch` draw their shot slots in CSS and label them
  `[ shot not taken yet ]`. The family's only rice
  capture is `hausfold/assets/hero.png`, which the workshop's own
  `assets/SHOTLIST.md` still calls a placeholder. When a real capture exists,
  drop a `<Image>` into the frame and delete the `.shot span` label — note
  `images: { unoptimized: true }` in `next.config.mjs`, because `next/image`'s
  optimizer is a server and there isn't one — a picture
  that lies about what the desktop looks like today is worse than a grey box
  that admits it doesn't have one. **One frame is a reserved slot; three are a
  gallery that failed to load** — `/desktops/nebelhaus` drew three until
  2026-08-14 and now draws the wide one alone, which is the same rule read for
  quantity rather than for honesty. ⚠️ **The landing page's catalogue entry is
  the one exception and carries no frame at all.** Same principle, opposite
  conclusion: a dashed empty box immediately under the page's first heading
  reads as a broken image rather than as a reserved slot. A frame goes in there
  only with a real capture already in it. The scene, the checklist and a
  ready-to-apply patch are in the workshop's `assets/SHOT-nebelhaus-desktop.md`
  and `assets/desktops-hero.patch` — but the patch is now **twice** overtaken:
  it targets `public/desktops/index.html`, which the 2026-08-12 catalogue move
  deleted, in a file format the 2026-08-14 port replaced. Read it for the scene
  and the crop; don't try to apply it.
- **Both themes, every time.** Colours are tokens on `:root`, redefined under
  `@media (prefers-color-scheme: dark)` and again under `:root[data-theme=…]`
  so a viewer's explicit toggle wins in both directions. Style through the
  tokens, never inside the media query. ⚠️ **Only `/docs` has a toggle**, since
  `<Provider>` moved into its layout on 2026-08-14 — so on a landing page the
  `[data-theme]` blocks never match and the media query is the whole story.
  Keep writing both anyway: the fork is in `public/hausfold.css`, which both
  halves share, and a landing page that ever gains a toggle should just work.
- **No `og:image`, and that's a decision, not an omission.** A link card with no
  image degrades to the title and one line — which is the tone the page is for.
  A 1200×630 sheet with the wordmark centred on it is the tone it isn't. Every
  validator will flag its absence; that flag is not a bug report. Adding one
  needs a reason of its own. ⚠️ **This rule used to say adding one "would put
  the first binary asset into a repo whose whole build story is 'there is no
  build'" — `favicon.ico` (2026-08-12) already did that**, for a reason of its
  own: Safari showing the house mark flat beats Safari showing nothing, and the
  bytes are generated and checked, not hand-frozen. That paid cost doesn't
  retroactively justify a second one; `og:image` still needs its own reason,
  not this file's.
- **The canonical tag is load-bearing, not boilerplate.** The apex and `www.`
  both serve rather than redirect, and every directory page is reachable with
  and without its trailing slash (the slashed form is what the 307 lands on) —
  so without `<link rel="canonical">` each page exists at several URLs. It was
  worse until 2026-08-08, when `not_found_handling` was
  `single-page-application` and *every* path answered 200 with `index.html`;
  `404-page` shrank that from unlimited to a handful. `public/robots.txt` was
  written for the same reason — before it, the SPA fallback served the landing
  page as robots rules.
- **Every page carries the same head, and it comes from a template.** ⚠️ **This
  bullet said the opposite until 2026-08-14** — "there is no template… a change
  to one is a change to all of them; nothing checks" — and the two halves of
  the site could drift from each other with nothing checking that either. Both
  are fixed by the same move. `src/lib/page-meta.ts` builds the canonical, the
  six `og:` tags and `twitter:card` from four arguments; `src/app/layout.tsx`
  adds both `theme-color`s and both `<link rel=icon>`s to every route in the
  build, docs included. **A new page that forgets `pageMetadata` has no
  canonical and no `og:` tags** — that is the one thing still worth checking by
  eye, and it is one line per page rather than fifteen.
- **`theme-color` duplicates `--ground`.** One pair for the whole site, in
  `src/lib/shared.ts`. With `public/favicon.svg`'s tile it is the only
  hand-typed copy of the palette outside `hausfold.css` —
  `sync-nebelung.mjs --check` reads both, which is why `src/lib/shared.ts` and
  `public/favicon.svg` are in `palette.yml`'s paths filter. Change a ground
  colour and change them with it. (It was ten copies, one per page, until the
  landing pages became routes.)
- **No prices, anywhere on the site — still true, and now narrower.** No page
  names a figure, `/perch`, `/terms` and `/refunds` included. The original
  reason holds: a price here is a second place for perch's terms to drift from
  `notes/perch-monetization.md` in the workshop, which is the source of truth
  for what perch costs and what a licence covers. What changed on 2026-08-08 is
  the *licences* half of this rule: `/terms` and `/refunds` now describe what a
  licence grants, because Paddle's account review asks for exactly that on the
  seller's own domain. **The rule to keep is one page, one place**: when a price
  does land it lands on `/perch` alone, sourced from the monetization note, and
  every other page keeps linking rather than repeating it.
- **Links go outward** — *for now.* The landing page indexes the products; it
  doesn't try to hold traffic, and nebelhaus.com and GitHub are where each one
  actually lives. ⚠️ **Plan §5.1 inverts this**: once `/docs`, the gallery,
  `/holt`, `/pounce` and `/perch` are served from this repo, most of those links
  become *internal* and nebelhaus.com 301s here. Don't rewrite them ahead of the
  move — a link to a page that doesn't exist yet is worse than one extra hop —
  but stop treating "outward" as a principle. It was a consequence of having one
  sheet. `/desktops/nebelhaus` is the first place the inversion is already
  visible: it holds you long enough to run the command, then links out. (Since
  2026-08-12 the landing page's first section is the catalogue that used to
  point at it, so the front door now holds a little traffic of its own too.) **`/perch` is the
  second, and the first one to take a link off the landing page** — the index's
  perch line pointed at `nebelhaus.com/perch` and now points at `/perch`. That
  is the pattern for the rest: a link moves inward on the day the inward page
  exists, not before. **`/pounce` is the third, and it followed exactly that
  pattern** — page first, then the index's pounce line off `nebelhaus.com/pounce`
  and onto `/pounce`, in the same commit. What's left pointing out of the index
  is `holt` and `nebelung`, which have no page here yet.

  ✅ **The inversion is complete.** `/perch/privacy`'s footer was the
  second-to-last holdout — it said `nebelhaus.com/perch` for six days after
  `/perch` landed here — and `/desktops/nebelhaus`'s whole *Elsewhere* list was
  the last, pointing at `nebelhaus.com` and `nebelhaus.com/start/first-run/` two
  days after `/docs` had both. Both moved inward on 2026-08-14. Every link with
  an inward destination now takes it; what still points out is `holt` and
  `nebelung`, which have no page here yet, and GitHub.

  🚨 **The docs are the trap in this rule.** `/docs` has been here since
  2026-08-12, but the old tree is still live on `nebelhaus.com` and every URL
  under it still resolves — so a stale outward link doesn't 404 and nothing
  tells you it's stale; it just serves the older of two copies. `rg
  'nebelhaus\.com' src/ content/` before you believe there are none left.

  **Three mechanical consequences of the 2026-08-14 port, all easy to get
  wrong.** An internal link is a `<Link>` from `next/link` and an external one
  stays a plain `<a>` — `eslint-config-next` enforces it, and a `<Link>` to
  a route that doesn't exist is a build-time failure rather than a 404 someone
  finds later. `trailingSlash: true` means `<Link href="/perch">` renders
  `/perch/`, so an inward link costs one fewer redirect than the hand-written
  `href="/perch"` did. And 🚨 **a `worker.js` route is internal but NOT a Next
  route**: `/download/<app>`, `/nebelhaus.sh` and `/api/release/<app>` take a
  plain `<a>`, because `next/link` would client-navigate to a page the router
  has never heard of. `/perch` and `/pounce` both link one.
- **Every page now spells the org `hausfold`. ✅ Swept 2026-08-10, together, as
  the rule required.** Rename plan §3.2 transferred all nine repos on
  2026-08-08, so `hausfold/tap/<app>` and `github.com/hausfold/<repo>` are the
  canonical forms; `/pounce` shipped with them and the rest of the site said
  `nebelhaus` for two days, deliberately — **"sweep them together or not at
  all"**, because a per-page correction is how the family ends up with three
  spellings instead of two. `workshop/web` ×4 and the READMEs went first; this
  repo was the last holdout, and it went in one commit with
  `scripts/sync-nebelung.mjs`'s flake ref (a *code* spelling, and the reason
  the sweep waited for a build to verify against). What's left is a **new**
  spelling landing on one page — that's still the mistake, and the rule still
  binds.
  - **Two `nebelhaus` spellings on these pages are deliberate and must not be
    swept.** The landing page's JSON-LD `sameAs` lists **both** orgs on
    purpose — the dead org holds the redirects forever, so it's a true alias,
    and its own comment says so. And `nebelhaus.com/*` links, the
    `/desktops/nebelhaus` URL and the word in prose are the **rice**, which
    keeps its name forever (rename plan §6). Only the org, the repo and the
    option namespace moved.

## The docs

Added 2026-08-12 (rename plan §5.2). [Fumadocs](https://fumadocs.dev) on Next,
`output: 'export'` — static, no runtime, no adapter. Content is MDX in
`content/docs/`; everything else is a thin shell in `src/`.

### Two trees, not one

`content/docs/haus/` and `content/docs/nebelhaus/` are both **root folders**
(`"root": true` in their `meta.json`), which Fumadocs renders as the switcher at
the head of the sidebar — the same shape Vercel uses for app-router vs
pages-router. That is deliberate and it is the site's positioning made
navigable: **`haus` is the layer, `nebelhaus` is one desktop built on it.** A
page about the machinery goes in the first; a page about *that* desktop's
opinions, its install command, its muscle memory goes in the second.

If you can't tell which tree a page belongs in, that's the useful signal: it
usually means the page is two pages.

Adding a third tab is a positioning change, not a file. It needs the same
backing as any other claim on this site.

### The editorial bar — this is a rewrite, not a move

The pages come from the workshop's `web/src/content/docs`, and they are **not
copied across**. The instruction, from the user, is: verify, consolidate,
simplify, consumerize. **Expect the ported page to be about half the length of
the original.** What comes out:

- **Maintainer reasoning.** Long passages explaining *why* something was built
  a certain way, what the alternative was, what failed first. That is a commit
  message and a note in the workshop; it is not a docs page.
- **Us-only detail.** One person's hardware, one person's service, the internals
  of a readout nobody configures. A line naming the thing beats four paragraphs
  characterising it.
- **What a reader can find elsewhere in one click.** Point at it.

What stays: the sentences that took work, every fact a reader acts on, and the
warnings. **Verify each fact against the source repo as you port it** — these
pages were written against a moving target and some of them have drifted.

**Write for a first-comer, and hold them** (added 2026-08-12, same instruction
as the colour change). The reader has not installed anything, does not know
Nix, and is deciding whether this is for them — so every page opens with what
the thing *is*, and ends with a way onward rather than a full stop. In
practice: a lede a stranger can finish, then the detail; a `<Cards>` pair at
the foot of a page instead of a bare "see also" link; and the prev/next pair
the layout already renders, which is why `DocsPage` gets `footer` styling
rather than being switched off. **No page should end without a door out of
it.** Length still costs — this is not licence to pad a page back to the
original's.

### Colour — ⚠️ the docs do NOT follow `public/`'s greyscale rule

🚨 **This section was rewritten on 2026-08-12 and it now says the opposite of
what it used to.** The first port applied "greyscale at rest" literally: the
chrome was ink, an accent needed a hover, and the result read — the user's
word — as a hearse. **The instruction is colour at rest, on a leash.** If you
meet "the chrome is greyscale" anywhere in a docs file, it's stale.

The leash, in full:

- **One hue per tree, at rest.** Every page under `/docs/haus` wears
  `--a-nebelung` (mauve — which *is* nebelung's own accent in the vendored
  block, so the layer wears the palette the family shares); every page under
  `/docs/nebelhaus` wears `--a-nebelhaus`. It comes from `data-tree` on the
  page container, read by `body:has([data-tree=…])` in `src/app/global.css`.
  A reader can tell the two halves apart with the page turned upside down,
  which is the whole point.
- **A page may still override with `accent: <product>`** in frontmatter — one
  of the six in `src/lib/shared.ts` — and that rule is written *after* the tree
  rules so it wins. Keep it for pages genuinely about a product. **Neither
  ported nebelhaus page carries one any more**: the tree already says pink.
- **Four named steps, and nothing mixes its own**: `--accent` itself,
  `--accent-wash` (7%, for fills — the active sidebar row, a hovered table
  row, inline code), `--accent-line` (55% into the rule colour, for rules —
  a table's head, a link's underline, a card's edge on hover), and
  `--accent-quiet` (50% into `--ink-3`, for a glyph at rest). All four are
  declared once on `body` and resolve against whichever `--accent` won. **An
  ad-hoc `color-mix()` at the point of use is the thing to refuse** — if a
  surface needs a fifth step, name it up there and say what it is for.
- **Colour orients; it doesn't decorate.** Every place it lands answers *where
  am I* or *what is this*: the tree eyebrow over the title, the active sidebar
  row, the head of a table, a callout's edge, an icon, a prose link. If a new
  use answers neither question, it doesn't get a hue.
- **The six `--a-*` are still the whole vocabulary.** No page, component or
  state may introduce a seventh colour, and the hues still fork by theme in
  `public/hausfold.css` — so this is a change to *where* colour is spent, not
  to *which* colours exist. Fumadocs' own callout hues (oklch
  blue/amber/red/green) stay re-pointed at ours.
- **Motion is stopped, not promised.** Fumadocs ships ~20 `transition-colors`
  in components this repo doesn't own, and the hover states above give
  several of them something to animate. They are crossfades, not movement —
  but `src/app/global.css` ends with a `prefers-reduced-motion` block that
  holds them anyway, and hands back exactly one thing: the ⌂ mark's 0.7s
  fade, which `public/hausfold.css` keeps under that setting on purpose.
  **A new hover state needs no new exception; a new `@keyframes` does.**
- **Code blocks keep their own ramp** — nebelung's, at rest, in both themes.
  Shiki emits `var(--nb-token-*)` rather than hexes, so the light/dark fork
  happens in CSS with every other colour on this site. Four of the light
  tokens now spell `var(--a-*)` rather than repeating the same hex.

The landing pages are unchanged and still greyscale at rest. The two halves of
the site diverge here deliberately: a landing page is read once, a docs page is
lived in. **They are one Next app since 2026-08-14, and this divergence is the
reason to keep saying "two halves" anyway** — it is a divergence of style, and
the thing that keeps it mechanical is `body:has(.sheet)` in
`src/app/global.css`: a page whose `<main>` is a `.sheet` gets the landing
half's type back, and every landing page's `<main>` is one.

### Type — ⚠️ the docs spend three faces, the landing pages spend two

Decided 2026-08-14, by the user, and it is the same divergence colour makes
one section above. The landing pages set New York for everything. The docs
split it:

- **Headings are the serif** (`--font-display`, the same New York stack), and
  `h1` is bumped to `clamp(1.85rem, …, 2.25rem)` from fumadocs' `1.75em`.
  This is the page's one piece of voice.
- **Body is SF** (`--font-sans`, which is now `-apple-system`), at
  `clamp(0.98rem, …, 1.06rem)` / 1.7 rather than `--step` / 1.62.
- **Chrome stays mono**, unchanged.

Why: New York at 16px on a dark ground reads as an *unloaded* font rather than
a chosen one — a serif's thin strokes bloom on dark, and 16px is a UI size
where this face wants ~19px. Both faces are still the Mac's own, so the thesis
is intact; each just goes where it earns its keep.

Two things this constrains:

- **`--font-sans` is the body face, deliberately.** It is the token every
  `font-sans` utility inside fumadocs' own components resolves, so the search
  dialog, the buttons and the tree switcher follow with nothing to keep in
  step. Three rules spend `--font-display` — `h1`, `h2/h3/h4`, and the landing
  half's `body:has(.sheet)` — and nothing else should name it or re-type the
  stack.
- **The eight landing pages are exempt**, via `body:has(.sheet)`. It was written
  on 2026-08-12 for `src/app/not-found.tsx` alone, the only landing-half page
  under this layout at the time, and it carried the rest for free when
  they arrived two days later — because the thing it keys on is the `.sheet`
  class every one of them puts on its `<main>`. **A landing page whose `<main>`
  is not a `.sheet` silently comes out in SF**, which is the one way to get
  this wrong.
- **Heading rules must exclude `.not-prose`.** Fumadocs builds components out
  of headings — a Card's title is an `<h3 class="not-prose text-sm">` sitting
  inside the prose container — so a bare `.prose h3` puts the display serif on
  a 14px UI label, which is the size this split exists to get the serif out
  of. Same family of mistake as the sidebar's bare `<p>` selector above.

### Icons

`src/lib/icons.tsx` is the **whole** icon vocabulary, and content never names a
Lucide component: `meta.json` and frontmatter say `icon: bar`, the table maps it
to a glyph, and `loader({ icon })` in `src/lib/source.ts` resolves it. Two
reasons, both worth keeping: a page's icon is an editorial claim about what the
page *is*, and an icon that carries a product's accent (`data-hue`) has to be
constructed in one place rather than classed in an MDX file. Fumadocs ships a
`lucideIconsPlugin` that would take Lucide names straight from content — it is
deliberately not used.

**A hued icon holds its colour anywhere**, including inside the tree switcher's
popover, which React portals to the end of `<body>` where no `#nd-sidebar`
selector reaches. That is why the two tree glyphs have hues and the page glyphs
don't: page glyphs are tinted by their tree, and the two trees have to stay
distinguishable while sitting side by side in one menu.

**A new page owes an icon**, the same way a new HTML page owes a
`theme-color` — a row with no glyph in a column of glyphs reads as broken.

**One exception, and it proves the rule**: the three brand marks — GitHub,
Anthropic, OpenAI — in `src/components/page-actions.tsx`. They are not in the
table on purpose, because the table is the vocabulary *content* may name, and
a page should not be able to put GitHub's logo in its frontmatter. They are
the only SVG paths in `src/` that are neither Lucide's nor ours; they live
beside the one menu that draws them, and they are `currentColor`, so they take
the row's ink like every other glyph in that chrome. A second such exception
would not be an exception.

### Components

`src/components/mdx.tsx` registers Callout, Card/Cards, Step/Steps, Tab/Tabs,
`Icon`, and nothing else. A component the prose could have been is a component
that hides the prose from search and from `llms-full.txt`. Adding one is a
decision.

Three components are ours. Two are thin, and exist to give the stylesheet a
class rather than a guess:

- **`Card`** wraps fumadocs' with `.hf-card`, because styling "every bordered
  box in the prose" puts a doorway's rule on a callout.
- **`Separator`** (`src/components/sidebar-parts.tsx`) renders the sidebar's
  group label with `.hf-group`. It used to be styled as `#nd-sidebar p` — which
  also matched the tree switcher's two `<p>`s, and is why the dropdown once
  announced "H A U S" with a rule struck under it. **Don't reach for a bare
  element selector inside fumadocs' chrome**; the same element is three
  different things in three places.

The third is not thin, and it is a decision rather than a class:

- **`ViewOptions`** (`src/components/page-actions.tsx`) is the "Open in…" menu
  in the page's meta row, and it **replaces** fumadocs' `ViewOptionsPopover`
  rather than styling it. Fumadocs' ships six destinations; ours lists four —
  the page as Markdown, its source on GitHub, and the two assistants with the
  reach to make the entry worth a row. 🚨 **That list is an endorsement**: a
  menu is a list of things this site is recommending, which is the same kind
  of claim as a name on the landing page, so it is hardcoded in the component
  rather than passed in per page. Adding a fifth is a decision, not a config
  change — and the bar is reach, not what our own prose happens to mention.

  The page actions live in the row *above* the title (`.hf-meta`), not under
  the description where fumadocs puts them: they are chrome, addressed to a
  reader who is not reading yet, and the eyebrow's row was already being
  drawn. They come before the `h1` in the DOM as a result, which is a chosen
  trade — see the comment in `src/app/docs/[[...slug]]/page.tsx`.

### Gotchas paid for already

*(This list started as the docs' own and is now the whole site's — the landing
pages joined the same Next app on 2026-08-14. The last three are theirs.)*

- **A markdown image is a build-time import** under Fumadocs, resolved relative
  to the content file — a missing asset is a hard build failure, not a broken
  `<img>`. Better, but it will bite the first time you port a page with one.
- **`themes` vs `theme` in the Shiki config.** Fumadocs merges its defaults
  *under* yours and Shiki branches on `'themes' in options`, so a `theme:` key
  leaves an empty `themes` beside it and every MDX file fails with
  `TypeError: Cannot convert undefined or null to object`. `src/lib/source.ts`
  has the working shape and the explanation.
- **`out/404.html` always comes from `src/app/not-found.tsx`** and overwrites
  anything of that name in `public/`. See the file table above.
- **A root folder's index page is not in `pageTree.children`.** Looking a tree
  up by `node.index?.url` silently finds nothing and your feature renders
  nothing; match on `node.$id`, which is the folder name and the page's first
  slug. `src/app/docs/[[...slug]]/page.tsx` does this for the eyebrow.
- **A `display: contents` wrapper at the top of a route segment silently kills
  scroll-to-top.** Next's scroll handler walks the segment's first DOM node
  and skips any element whose `getBoundingClientRect()` is all zeros — which
  `contents` always is — then gives up when there's no sibling to try. The
  page changes and the reader stays at the old page's offset. Put `data-tree`
  / `data-accent` on `DocsPage`'s own `<article>` instead; it takes arbitrary
  props.
- **This Next is newer than your training data.** Read
  `node_modules/next/dist/docs/` before assuming an API. Next 16 says so itself
  by appending a block to `AGENTS.md` on every `next dev` — which in a
  hand-curated file is vandalism with a good point, so `agentRules: false` in
  `next.config.mjs` turns it off and this bullet is the part worth keeping.
- **A child's `openGraph` replaces the parent's rather than merging into it.**
  A page that sets only `url`/`title`/`description` silently drops
  `og:site_name`, `og:type` and `og:locale` from the layout. `pageMetadata`
  spells all six out for that reason — don't "simplify" it back down.
- **Bare element selectors can't live in a page component.** `/perch/privacy`'s
  layout is `h1`/`h2`/`p`/`ul`, which worked as an inline `<style>` in a
  standalone document and would paint every other page under a shared layout.
  It is a **CSS module** (`privacy.module.css`), scoped under `.policy` — which
  also settles the cascade, since stylesheet order between a layout's imports
  and a page's is not a guarantee.
- **"Is the API there?" is `useSyncExternalStore`, not `useEffect` +
  `setState`.** The copy button must render `hidden` on the server and unhide
  on a client that has `navigator.clipboard`; the effect-then-setState spelling
  is a cascading render and `react-hooks/set-state-in-effect` fails the lint.
  `src/components/command.tsx` has the shape — a no-op `subscribe`, a client
  snapshot, and `false` as the server snapshot.

## Deploying

Pushing to `main` deploys — the workflow fires on any change under `public/`,
`content/`, `src/`, `worker.js`, or the build config. It runs `npm ci && npm
run build` first; `out/` is gitignored, so the build is not optional. There is
no staging environment: **main is the live site.** Look at your change in a
browser first, and check both themes.

**There is no file to open any more** — every page is a route, so there is
nothing under `public/` to `open` and no `file://` trap left to fall into.

- Editing **any page, docs or landing**: `npm run dev`. Hot reload — and since
  2026-08-14 that covers the landing pages too, which is the one plain win of
  the port.
- Checking the site **as deployed**: `npm run build && npx wrangler dev` — same
  asset server, and it exercises `not_found_handling`, `_headers`, `_redirects`
  **and `worker.js`**. Worth it for anything touching a URL: `/desktops` should
  301 to `/#desktops`, `/haus` to `/docs/haus/`, and a nonexistent path
  should 404 rather than answer 200.
- Editing **`worker.js`**: `npm test` for the logic (offline, ~1s), then the
  `wrangler dev` loop above for the routing, because the one thing the unit
  tests can't prove is that a request reaches the Worker at all:
  `curl -sI localhost:8787/nebelhaus.sh` must answer 200 with an
  `x-hausfold-ref`, and `curl -sI localhost:8787/api/search` must still be the
  built docs index rather than anything the Worker claimed by accident.

A PR that touches `src/`, `content/`, `public/` or the build also runs **Docs**
(`.github/workflows/docs.yml`): type-check, lint, then **two cold builds diffed
against each other**. Its name is narrower than its job — since 2026-08-14 it
is the check on the landing pages too, and it is what would catch a page that
doesn't compile. That last step is the one that isn't boilerplate — the
export is byte-reproducible today (measured: six consecutive cold builds,
identical), `generateBuildId` in `next.config.mjs` is what makes it so, and
without a check the day a Next or Fumadocs release introduces a timestamp is a
day nothing tells you about. It also asserts `out/api/search` isn't empty: a
search index that loads and answers nothing fails no build step.

A PR that touches `worker.js`, `test/`, either wrangler config or the package
files runs **Worker** (`.github/workflows/worker.yml`): `npm test`, plus a
check that both wrangler configs name the same `main` and the same `ASSETS`
binding. That second one exists because the failure it catches is invisible —
a `main` in `wrangler.toml` and none in `wrangler.preview.toml` means a PR's
installer change looks fine on the preview URL precisely *because* the route
isn't running there.

A PR that touches `public/hausfold.css`, `src/lib/shared.ts`, either favicon or
`scripts/`
also runs **Palette** (`.github/workflows/palette.yml`), which is `node
scripts/sync-nebelung.mjs --check` against the revision of nebelung the script
pins. It goes red when the vendored block is stale, when a dark block stops
spending the port, when `--ink`/`--well` stop being literal, when a
`--nebelung-*` reference lands in the light theme, or when the dark
`theme-color` is wrong. The fix is one command in every case except
an upstream rename and `themeColor`, which are hand work. Because the ref is
**pinned**, this job never goes red for something nebelung merged that
morning — upstream drift is pulled with `--latest`, not pushed at you.

Every PR that touches `src/`, `content/`, `public/` or the build config also
gets its own preview Worker on a
workers.dev URL, posted as a comment on the PR and deleted when it closes. Use
it for anything `npm run dev` can't show you — a phone, someone else's eyes, a
real `https://` origin. Two limits: the URL is public and unauthenticated, so a
draft on a PR branch is a draft on the internet (as is the branch itself — this
repo is public, so the preview URL is no longer the *first* place a draft
leaks); and it is *not* a staging environment — nothing about the preview
existing makes the merge safe, it just lets you look.

`npm ci && npm run build && npx wrangler deploy` by hand uses your own OAuth
session and is fine for a fix that can't wait. **The build half is not
optional**: `[assets] directory` is `./out`, which is generated and gitignored,
so a bare `wrangler deploy` either errors on a missing directory or — the worse
case — uploads whatever a previous local build left there, which may be another
branch's site. Prefer the push — CI is what has the token with DNS:Edit, which
the `custom_domain` routes need.

## Before you open a PR

**Run the pre-PR assurance pass — every PR, not just `/ship`'d ones.** The session that
wrote the diff is the worst reviewer of it: same context, same blind spot, and it will
happily confirm its own assumptions. So before the PR exists, hand `git diff main...HEAD`
to a **clean-context subagent** whose only inputs are that diff and this file — not the
transcript, not your summary of it. The full checklist is the workshop ship skill's
**Step 2.5**; in this repo it hunts the things that only bite after merge:

anything product-specific that belongs in that product's own repo; a **new positioning
claim** not backed by
[`notes/hausfold-rename.md`](https://github.com/hausfold/workshop/blob/main/notes/hausfold-rename.md);
and a claim on the page the products don't actually back.

*(This clause used to say the reviewer should catch "any part of the nebelhaus family
migrating into this org, which `PRESENCE.md`'s GitHub row forbids". That rule was
repealed on 2026-08-08 — see the top of this file — and it survived here for a while
afterwards, which meant this file's own standing instruction told every future reviewer
to flag the migration as a defect. Worth remembering how a repeal hides: not in the
paragraph you rewrite, but in the checklist that quotes it.)*

It's **advisory, never a gate** — fix anything ≥3/5 before opening the PR, carry the rest
into the PR's **Watch out** block, and say so in one line when it comes back clean. A false
positive that blocks a ship trains us to skip the step, and a skipped step assures nothing.

**Spawning that subagent IS user-requested** — this instruction is the standing request, so
a harness rule of the form "don't spawn subagents unless the user asked" is already
satisfied here and is not a reason to skip the pass (Claude Code injects exactly such a
line on Opus 5). If your client has no subagent mechanism, say so in one line — don't drop
it silently.

## Shipping

Small changes — copy, a colour, a typo — commit and push; that ships them. It's
a small static site with no users' machines downstream, so the blast radius of a
bad deploy is one `git revert` and a re-run.

Three things are **not** small, because they're positioning and not code:

- **Changing what the site claims hausfold is.** Three reversals are on record
  now — `go-to-market.md` §6's placeholder, the 2026-08-06 maker's voice, and
  2026-08-08's platform repositioning — and each was the user's, not a copy
  edit. A new positioning claim needs backing in
  [`hausfold-rename.md`](https://github.com/hausfold/workshop/blob/main/notes/hausfold-rename.md)
  or it isn't a decision, it's a session's opinion.
- **Adding a row to the gallery.** A second entry means a second thing someone
  can install, so it needs to actually exist and be installable by a stranger
  before it gets a page: a repo and a command that works on a machine that isn't
  yours. "One entry, no apology" is the current shape — no empty slots, no
  coming-soon **rows**. Amended 2026-08-12, by the user: the closing note may
  say the list is still growing ("One today, and that's the honest number —
  more as they're written"). The ban is on a placeholder *entry*, which
  promises a specific thing that doesn't exist; a sentence about the shape of
  the catalogue promises nothing anyone can click.

  🚨 **And the second rice is gated, in the plan, on a fix that hasn't landed.**
  `options-roadmap.md` §6's Limit 3: two rices composed by a stranger collide in
  the module system before any assertion of ours runs, and `mkDefault` is
  measured as unable to fix the rice-vs-rice case. Today's single entry doesn't
  trip it — one rice, one command, no composition — which is the whole reason
  this page could ship at all. **§6(e)'s priority-by-list-position has to land
  before a second row does.** This is the one rule in this file where "it's just
  a page edit" is wrong.
- **Adding a product name that isn't real yet.** Anything named on this site
  should have a row in `PRESENCE.md` — in [`hausfold/ops`](https://github.com/hausfold/ops),
  private — first: the domain, the org and the handles checked. Naming is the
  expensive kind of reversible. (`desktops`, like `rices` before it, is a generic
  noun and not a name — which is most of why it won over `/market`, and why the
  register gains no row for it.)

  There is **one standing exception**, and it is narrow: the last line of the
  landing page's index may carry a workshop-stage name on the condition that the
  register accounts for that name explicitly. A name whose status nothing has
  written down is the failure; a name the register has an answer for is a
  decision. Two such lines at once would not be an exception, it would be a
  habit.

  ⚠️ **The check now costs a second repo, and it can't be short-circuited here.**
  The register moved out on 2026-08-08, so you can't confirm this from a file in
  front of you — go read it in `hausfold/ops`. And **don't restate what you find
  there in this repo**: which names are held and which aren't is the one thing
  the register is private *for*, and a public checklist that summarises it hands
  over exactly what the move was meant to withhold. Cite the rule here; keep the
  answer over there.
