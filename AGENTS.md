# AGENTS.md

**hausfold.co** — Next 16 + Fumadocs, `output: 'export'`, static, served from a
Cloudflare Worker. [`README.md`](./README.md) and [`docs/`](./docs) cover what
the thing is and how it is built, run and deployed; this file covers what you
may change.

**This file is the one set of instructions, for every agent**, directly or
through a one-line pointer. Per-client wiring lives in that client's own file;
the content stays here or in [`.agents/`](./.agents/README.md).

> **This repo is public. Nothing private may ever be committed here** — no name
> register, no account facts, no "temporarily" pasted ids. `git log` before
> 2026-08-08 is in the old private repo, not this one.

## Positioning

**hausfold is the org, the house and the publisher; `haus` is one of the things
it makes** — the nix-darwin layer a user installs and writes `haus.*` options
for. `hacker` is one desktop built on it. **hausfold sells nothing, ever**:
there is no price, no checkout, no `/terms`, no `/refunds`.

Say **desktop**, not "rice", in user-facing copy. Preserve "rice" only in
quotations, URLs, filenames and code identifiers.

🚨 **Never call haus "opinionated" in platform-level copy.** The distinction is
the whole product argument, and the word IS correct one tier down:

| Tier | Opinionated? |
|---|---|
| a **desktop** (`hacker`, `everyday`, `minimal`) | **yes** — `desktops/hacker`'s description says so, and that is the one place the word belongs |
| **haus**, the layer | **no** — every `haus.*` option and the whole rooms model exist so you can disagree with the desktop you chose |
| **hausfold**, the org | not a thing that holds opinions; it publishes |

*omarchy is opinionated, haus is a platform.* Calling the layer opinionated
concedes the ground that separates it from a take-it-or-leave-it rice. **Name
the macOS pain instead of a stance** — the site's recurring phrase is *the
settings you always change by hand*, which is why `/`'s hero closes **"Nothing
by hand, and open all the way down."**

## Where does it go?

| Want to change… | Where |
|---|---|
| the landing page — the house's index of what it makes | `src/app/page.tsx` |
| what the site says about **haus**, the layer — what it is, the rooms, desktops, the one file | the docs, `content/docs/haus/index.mdx`. There is no `/haus` sheet; the URL 301s to `/docs/haus/` |
| a **desktop's own page** | the docs, `content/docs/haus/desktops/<name>.mdx`. There is no desktops catalogue on this site — `index.mdx`'s `## Desktops` is three sentences and one link to [`desktops/choosing`](content/docs/haus/desktops/choosing.mdx), which is where the `/desktops` 301 lands |
| **the docs** (`/docs/*`) | `content/docs/` — Fumadocs MDX. ⚠️ There is no `/docs` page, only the trees under it; `/docs` 301s to `/docs/haus/` |
| the install one-liner — the URLs, the desktop table, the ref pinning | `worker.js`. `curl -fsSL https://hausfold.co/haus.sh \| bash` asks which desktop; `/hacker.sh`, `/everyday.sh` and `/minimal.sh` answer it by URL. **A desktop is a row in `DESKTOPS`, not a new route** |
| the install *script* itself (`bootstrap.sh`) | `hausfold/haus` — the Worker only proxies it, and pins the ref |
| the **layer** — any `haus.*` option, the rooms, the `haus` CLI | `hausfold/haus` (checkout `./haus` in the workshop — **not** `./hausfold.co`, which is this repo) |
| a product's **code** (pounce, perch, nebelung, scruff, trill) | that product's own repo under `github.com/hausfold` |
| a product's **documentation** | **here** — pounce, perch, trill and scruff each have a docs tree beside `haus`. The source of truth for a *fact* is the product's repo; what lives here is the manual written against it |
| a handle, an account, a claimed namespace | **not here** — `PRESENCE.md` in the private [`hausfold/ops`](https://github.com/hausfold/ops) |
| a family-wide standard (the agent surface, the issue forms, the drift catalogue) | `docs/` in the workshop |
| the launch plan, or anything still to be decided | `todo/` in the private [`hausfold/ops`](https://github.com/hausfold/ops) |

🚨 **A published `curl \| bash` URL is the last thing on this site that may ever
404** — it is in shell histories, in the docs, and in print. A desktop that
ships a route ships a promise. `worker.js` serves `bootstrap.sh` from haus's
latest *release tag*, not from main, so a **yanked release** would drag
`releases/latest` back behind a desktop rename and break every install. Don't
yank; supersede. (`?ref=` is an unpublished escape hatch and may name a tag that
predates a desktop.)

## The landing pages

Every page is a Next route; `public/` is assets only.

| Route | Source | What it is, and the rule that isn't obvious |
|---|---|---|
| `/` | `src/app/page.tsx` | **the house's door and nothing else**: the masthead (no nav at all — the colophon carries the GitHub link), a three-line paragraph about **hausfold the org**, and `#made` (`What we make`: one list, haus first, then pounce, perch, trill, scruff, nebelung). Its intro paragraph is **the site's only statement that everything is free and open source** — don't cut it as marketing — and the four `/terms` and `/refunds` 301s land on `#made`. Also the **JSON-LD organization record**. Everything about *haus* belongs in `/docs/haus`, so a paragraph here explaining the layer is in the wrong page |
| `/perch/privacy` | `src/app/perch/privacy/page.tsx` | perch's privacy policy. **Linked from the App Store — don't move or rename this URL.** The one page with a layout of its own, `privacy.module.css`, and a page with no parent: `/perch` is a 301 to `/docs/perch/`, and this URL is deliberately not swept up in it |
| `404` | `src/app/not-found.tsx` | Next's export always writes `out/404.html` and overwrites a same-named file copied from `public/`, so it cannot live there |
| `/docs/*` | `content/docs/` | a different animal; see [The docs](#the-docs) |

**One load-bearing id is left**: `#made` on `/`, where the four `/terms` and
`/refunds` 301s land. Rename it and a published URL starts scrolling to the
masthead instead of to its answer. (`#desktops` does not exist: its two callers
point at `desktops/choosing`, a page rather than a fragment.)

**A page that a docs tree also covers does not stay in step with it.** That is
why `/pounce`, the three `/desktops/<name>` sheets, `/perch` and `/haus` are all
301s onto docs trees, and why rebuilding any of them is wrong.

### Short domains

`perch.hausfold.co` is the only one. **A short domain is a 301 and never a
page.** It exists so there is something short to hand a
non-technical person — you text them `perch.hausfold.co` and they land on
`/docs/perch/install/`, which is written to be followed in order.

🚨 **Do not "upgrade" one into a page.** The proposal that produced this one was
a standalone setup sheet served at the subdomain, and it was exactly the mistake
the rule above describes, wearing a nicer URL: every fact it stated was already
in `/docs/perch/install`. What went in instead was a redirect plus a rewrite of
that page — the ordered path (the macOS setting first, then the download, Launch
at Login, the phone and pairing) now lives THERE, in the one account of it.
Making the setup path better for a beginner is a docs edit; it is never a new
page.

The table is `SHORT_DOMAINS` in `worker.js`, the route is one line in
`wrangler.toml`, and every path other than `/` 301s to the same path on
hausfold.co so the subdomain can never become a second copy of the site.

⚠️ **`run_worker_first = true` in `wrangler.toml` is what makes it work at
all.** The assets binding matches on PATH and knows nothing about hostname, so
without it `perch.hausfold.co/` short-circuits to `out/index.html` — the landing
page under the wrong domain — and `worker.js` never runs.

🚨 **It must be `true`, never an array.** An array is an *allowlist*: every path
outside it is answered by the asset server, including its 404 page, so the
Worker's own routes stop being reached at all. `["/"]` takes out `/haus.sh`,
`/hacker.sh`, `/minimal.sh`, `/everyday.sh`, `/download/*` and `/api/release/*`
at once — the four installers being the URLs this file calls the last thing here
that may ever 404. **`npm test` passes under either value**, because the
Worker's unit tests call `worker.fetch` directly and never reach the asset
server.

The guard is a grep for `run_worker_first = true` in `worker.yml`, over BOTH
wrangler configs. It looks crude beside a real test and it is what there is:
deploy.yml's post-deploy smoke check hits the live URLs, but Cloudflare answers
a GitHub runner with a managed challenge whatever User-Agent it sends, so that
step warns and skips rather than proving anything. ⚠️ **Don't delete the grep as
a duplicate of the smoke check** — it is the only thing standing between this
repo and every installer URL 404ing at once.

🚨 **`/haus` is the one to learn from.** A sheet built deliberately *not* to be a
manual becomes a second account anyway: that one grew a Rooms section, a
Desktops section and a One file example, all of which `/docs/haus` already
carried, and most readers arrive at the tree without passing the sheet. Its copy
is `content/docs/haus/index.mdx`.

The strongest case for an exemption is `/perch`'s — a one-read pitch for a
stranger deciding in ninety seconds is a shape a manual can't take — and it does
not hold either: every fact on it was already in `/docs/perch`, which is the
duplicate the rule is about. The pitch itself is not thrown away. It opens
`/docs/perch`, where the manual starts with the dance and the install command.

🚨 **Nothing on this site argues for a product, or for the layer, outside the
docs.** A sheet beside a tree is a second account of one subject, whoever wrote
it and however carefully it was scoped. Adding one back is a decision, not a
tidy-up.

**Don't write down how many landing routes there are.** A count in a comment
rots faster than the thing it counts — say "every `.sheet` route".

The three things every page shares, and where they live:

| Thing | Where |
|---|---|
| canonical, the six `og:` tags, `twitter:card` | `src/lib/page-meta.ts`, called once per page |
| both `theme-color`s, both `<link rel=icon>`, `og:site_name`/`type`/`locale` | `src/app/layout.tsx` — every route in the build, docs included |
| the colophon and the GitHub mark inside it | `src/components/sheet.tsx` |
| a fenced command with its copy button | `src/components/command.tsx` |

**A new page that forgets `pageMetadata` has no canonical and no `og:` tags** —
that is the one thing still worth checking by eye.

## `public/`

| File | What it is |
|---|---|
| `_redirects` | static redirects, **exact paths only**. Cloudflare consumes the file rather than serving it, and evaluates it **ahead of the assets** — so a route existing does not beat a redirect pointing away from it, and adding a page back under a redirected path means deleting its lines here in the same commit. Never a `/desktops/*` wildcard: those URLs need different targets |
| `favicon.svg` | the mark as geometry on a dark tile, swept through all six accents. Its wedge fan is generated by `scripts/sync-nebelung.mjs`. **The one thing on this site that holds colour with no hover** |
| `favicon.ico` | the same mark, monochrome, for Safari — WebKit doesn't resolve the SVG one. Generated by the same script from the SVG's cover path, `--ink` on crust, no accent sweep |
| `robots.txt` | allows everything; no `Sitemap:` line, and its comment says why |
| `_headers` | a `Content-Type` for `/api/search` (extensionless, so Cloudflare would ship the search index uncompressed) and a year of cache for `/_next/static/*` |
| `hausfold.css` | shared tokens, type and link styles, the vendored nebelung block, and a header comment with the design decisions. ⚠️ **Nothing links it** — it reaches the browser through `src/app/global.css`'s `@import`, inlined into Next's bundle at build time, so `/hausfold.css` is served but is a dead URL. It stays here because that is the path `global.css` imports and `sync-nebelung.mjs` writes |

**The dark theme's nebelung values are generated, not typed.**
`public/hausfold.css` opens with a block vendored from nebelung's own CSS port
(`dist/css/nebelung-mocha.css`), and both dark blocks read `var(--nebelung-*)`
out of it. Refresh with `node scripts/sync-nebelung.mjs`;
`.github/workflows/palette.yml` runs the same script with `--check`. The script
also writes the favicon's colour sweep — ninety hexes interpolated off the six
accents, which is exactly the frozen snapshot the vendoring exists to prevent.
Nothing runs at serve time; the output is committed. `deploy.yml` does not fire
on `scripts/**`, so editing the script alone deploys nothing.

**The flake ref is pinned** (`PIN` in the script), so CI is deterministic and a
CSS PR never goes red for something nebelung merged that morning. The cost is
that drift is *pulled*: `node scripts/sync-nebelung.mjs --latest` asks, and
names the values a bump would change. Run it when you touch the palette.

`--check` also guards what the generator can't fix: an upstream **rename** (a
`--nebelung-*` name that stopped existing leaves a dangling `var()` and a dark
page with no background); the dark **`theme-color`**, a hand-typed copy of crust
in `src/lib/shared.ts`; and the favicon's **tile**, a hand-drawn path beside the
generated fan. Because those read a TS module and an SVG rather than CSS,
`palette.yml`'s paths filter carries `src/lib/shared.ts`, `public/favicon.svg`
and `public/favicon.ico` alongside the stylesheet. `favicon.ico` is checked by
**decoded pixels, not bytes** — compressed bytes aren't stable across zlib
versions, and comparing them broke CI once.

It guards one non-palette thing too, because the failure is silent: **two
hyphens in a row inside `favicon.svg`'s comment**. XML forbids them, the file
stops parsing, and no browser says so — the tab just shows a blank icon. Spell
the token out in prose instead of writing `--something`.

## Rules that are easy to break by accident

- **No em dashes in reader-facing copy, anywhere.** Landing pages, docs prose,
  frontmatter descriptions, `<title>`s and `og:` titles (the separator there is
  `·`). Rewrite with a period, colon, semicolon, comma or parentheses; never a
  bare hyphen. Two carve-outs: code comments and this file are not copy, and
  `reference/options.mdx` is generated from haus's own option descriptions, so
  its em dashes are fixed upstream or not at all.
- 🚨 **The contact address is `julien@hausfold.co`, and that is deliberate — do
  not "upgrade" it to `support@`.** It reads informal for a page that talks
  about privacy, and a later session will want to fix it. It is the address
  that actually routes; `support@hausfold.co` has never existed and isn't going
  to, and if one is ever added it will be an alias onto `julien@`, which
  changes nothing here. `hi@` is the other tempting rewrite and is worse still:
  it names nobody, while the mail is read by one person, which is what `julien@`
  says out loud. This bullet is the rule that binds, and it lives here rather
  than in a code comment because AGENTS.md is what a pre-PR reviewer actually
  reads. Three places carry the address and they move together or not at all:
  the colophon (`src/components/sheet.tsx`), `/perch/privacy`, and the
  `Organization` JSON-LD in `src/app/page.tsx`.
- **Greyscale at rest on the landing pages, and every colour is borrowed.**
  (`/docs` deliberately spends colour at rest — see [Colour](#colour).) The
  *borrowed* half binds everywhere: both halves spend the same six `--a-*` and
  neither may invent a seventh. The dark accents **are** nebelung —
  `--a-pounce` is `var(--nebelung-peach)` and so on, resolved out of the
  vendored block; the light ones are hand-picked counterparts, because
  nebelung's pastels are built for a dark ground. `--check` fails on a
  `--nebelung-*` reference outside the two dark blocks. Four exceptions:
  - a **product's name in the index** takes that product's accent, **on hover**;
  - the **`⌂` mark** takes all six as stripes, on hover;
  - the **favicon**, which has no hover state to gate it — same six accents,
    same order, generated from the same port. `favicon.ico` deliberately stays
    outside it: `--ink` on crust, no sweep;
  - **code, wherever it is code** — Shiki-highlighted at build time with the
    `--nb-token-*` ramp, including inline `<code>`. The dark fork for the
    landing half belongs in `src/app/global.css` under `prefers-color-scheme` +
    `body:has(.sheet)`, because those pages carry neither `data-theme` nor the
    docs' `.dark` class. ⚠️ **It is not in the tree**: no landing page carries a
    highlighted block, so nothing needs it, and only a tombstone in
    `src/app/global.css` says how to write it. Putting it back is what a
    landing page with a fenced block owes. Prose and chrome don't take a hue.

  🚨 **A desktop is not a product and does not get an accent** — no desktop is
  named on a landing page, and none of the `desktops/<name>` docs pages carries
  an `accent:`. A hue hausfold keeps *at rest* would compete with nebelung's
  palette, which is the one brand asset the family shares. `scruff` and `trill`
  have no accent assigned upstream, so maroon and yellow are our pick rather than
  nebelung's and should be reconciled if they get a row. 🚨 scruff's is the rose
  `maroon` and NOT nebelung's `pink`, which `hacker` already holds and which
  `--color-fd-error` spends in the docs; "scruff should be pink" is satisfied by
  the value, and swapping it onto the `pink` token repaints every error callout.
- **No motion, with one hover-only exception**: the mark's iridescent sheen
  turns while the pointer is on it, fading over 0.7s. `prefers-reduced-motion`
  holds it still — it keeps the colour and drops the turn, because the colour is
  the idea. A second animation needs the same bar: hover-scoped,
  reduced-motion-aware, and asked for. A **scroll-snap point is not an
  animation** and needs no exception; a new `@keyframes` does.
- **Almost no JavaScript of our own on the landing pages, and none of it
  load-bearing.** The pages are Next routes, so they ship Next's client runtime;
  what they do **not** ship is fumadocs. `<Provider>` lives in
  `src/app/docs/layout.tsx`, not the root layout, and that placement is
  load-bearing: at the root it gave every landing page the search context, the
  ⌘K binding and a lazy fetch of the ~457 KB Orama index. Measured after moving
  it down: a landing page is 8 chunks / 173 KB gzip, a docs page 16 / 398 KB.
  🚨 **Don't move `<Provider>` back up** to satisfy a component that asks for
  it — give that component its own boundary. The intended cost: the light/dark
  toggle is a `/docs` affordance, and the landing pages follow
  `prefers-color-scheme`. **The landing half ships none of our own script at
  all**, and no component or `.cmd` styles wait in the tree for a caller. The
  bar for bringing one back is the bar the last one met: a copy button that
  rendered `hidden` in the exported HTML and unhid only where
  `navigator.clipboard` exists — **pure enhancement, nothing lost without
  it**.
- **No screenshots at all, and never a stale one.** There is no `.shot` family
  in the CSS and no placeholder frame anywhere: a picture that lies about what
  the app looks like today is worse than a grey box that admits it doesn't have
  one, and with no sheet to reserve a slot on, no box at all beats both.
  **The landing half stays
  imageless**: no images on the front page until the site's velocity slows, and
  a real capture, when one exists, belongs in the docs tree it documents rather
  than back here. If a landing page ever does hold one, note `images: {
  unoptimized: true }` in `next.config.mjs`, because `next/image`'s optimizer is a server and
  there isn't one. The scene to reshoot is the workshop's `assets/SHOTLIST.md`
  slot-2 cell.
- **The column leans LEFT, and the measure is 41rem.** `.sheet` is the same
  reading column it always was; what moved is where it sits —
  `margin-inline: var(--sheet-inset) auto`, hanging off the left of an implied
  `--page-max` (78rem) page. Text inside stays left-aligned: **the column leans,
  the paragraph does not**, and nothing here is ever set ragged-left. Leaning
  left puts every line of type on one axis — the masthead, each paragraph's
  first character, the ⌂ — at the page's own left edge.
  - `--sheet-inset` is `max(0px, (100cqw - var(--page-max)) / 2)`: **up to
    ~1250px** it is 0 and the column is flush left less its `--gutter`, so a
    phone and a laptop lose nothing; **above that** it grows at half the
    surplus, holding the column where a centred 78rem page would have put its
    left edge. That ceiling is why "left-leaning" doesn't become "against the
    glass" on a 27-inch display — don't remove it.
  - 🚨 **`100cqw`, not `100vw`, and this will get "simplified" back.** `html`
    sets `scrollbar-gutter: stable`, so `100vw` is wider than the page by the
    scrollbar's reserved strip wherever a classic scrollbar is drawn — an inset
    sized off it sits ~7.5px proud, which is precisely the misalignment the
    clamp exists to remove, and it is **invisible on macOS overlay scrollbars**.
    The container is declared on `body:has(.sheet)` in `src/app/global.css`,
    scoped to the landing half because `container-type` implies `contain: layout
    style inline-size`, and layout containment would make `<body>` a containing
    block for fixed-position descendants — which `/docs` cannot have, because it
    portals fumadocs' chrome there.
  - 🚨 **`.sheet` carries `width: 100%`, and it is not redundant beside the
    `max-width`.** `body` is `flex flex-col`, so `.sheet` is a flex item, and a
    flex item with an `auto` margin in the cross axis is **not stretched** — the
    lean's auto inline margin turned the column shrink-to-fit, so on a 390px
    phone the document came out 624px wide and scrolled sideways. The
    thing that broke it was a framed command in inline `<code>`, and nothing in
    the tree draws one today — but **the rule stays**: the next long inline
    `<code>` or URL reproduces it exactly. (`min-width: 0` is not the fix:
    `overflow-x: auto` already zeroes a flex item's automatic minimum size.)
  - `--measure` is a *reading* measure; every text block inside `.sheet` is
    separately capped at 58/62ch, so widening it just unmoors the column from
    the masthead. `--gutter` exists so `.sheet`'s padding and anything measuring
    itself against the page margin can't drift apart — change side padding
    there, not in `.sheet`.
  - **It applies to every `.sheet` route.** ⚠️ `/perch/privacy` is the one that
    can slip: `privacy.module.css` restates several of `.sheet`'s properties on
    the same `<main>` and wins on source order, so anything it restates it keeps
    forever. It deliberately does **not** restate `margin` or `width`.
- **Nothing on this site scrolls sideways.** If a horizontal scroller ever comes
  back it owes `tabIndex={0}`, a label and a focus ring — a scroll container is
  only keyboard-operable if it can take focus, and Safari, unlike Chrome, does
  not make one focusable on its own. Without it everything past the edge is
  mouse-only: a WCAG 2.1.1 failure, not a rough edge. The distinction to ask
  first: a **gallery** is one subject from several angles, where reaching the
  end is optional; a **catalogue** is a set of commitments a reader compares,
  where everything has to be visible at once. If a row would hide behind an
  edge, ask whether the reader is comparing or looking.
- **Both themes, every time.** Colours are tokens on `:root`, redefined under
  `@media (prefers-color-scheme: dark)` and again under `:root[data-theme=…]` so
  an explicit toggle wins in both directions. Style through the tokens, never
  inside the media query. ⚠️ Only `/docs` has a toggle, so on a landing page the
  `[data-theme]` blocks never match — write both anyway; the fork is in
  `public/hausfold.css`, which both halves share.
- **No `og:image`, and that's a decision, not an omission.** A link card with no
  image degrades to the title and one line, which is the tone the page is for. A
  1200×630 sheet with the wordmark centred on it is the tone it isn't. Every
  validator will flag its absence; that flag is not a bug report. Adding one
  needs a reason of its own.
- **The canonical tag is load-bearing, not boilerplate.** The apex and `www.`
  both serve rather than redirect, and every directory page is reachable with and
  without its trailing slash, so without `<link rel="canonical">` each page
  exists at several URLs.
- **`theme-color` duplicates `--ground`.** One pair for the whole site, in
  `src/lib/shared.ts`. With `favicon.svg`'s tile it is the only hand-typed copy
  of the palette outside `hausfold.css`. Change a ground colour and change them
  with it.
- **No prices, anywhere, and nothing to price.** perch is MIT with no paid tier;
  hausfold sells nothing. The landing page says the free-and-open-source half
  out loud, once, in `What we make`; everything else is silence rather than a
  promise.
- **Links go inward.** A link moves inward on the day the inward page exists,
  not before. What still points out of `#made` is `nebelung`, which has no page
  here yet, plus GitHub. Three mechanical consequences: an internal
  link is a `<Link>` from `next/link` and an external one stays a plain `<a>`
  (`eslint-config-next` enforces it; ⚠️ **a `<Link>` to a route that
  doesn't exist is NOT caught** — `typedRoutes` is off, so `build`,
  `types:check` and `lint` all pass on one, and a retired page's inbound links
  are yours to find: a page footer pointing at a deleted route ships through four
  green checks); `trailingSlash: true` means `<Link
  href="/haus">` renders `/haus/`; and 🚨 **a `worker.js` route is internal
  but NOT a Next route** — `/download/<app>`, `/hacker.sh` and
  `/api/release/<app>` take a plain `<a>`, because `next/link` would
  client-navigate to a page the router has never heard of. ⚠️ **In MDX the trap
  is worse**: `a: createRelativeLink(source, page)` turns every internal-looking
  href into fumadocs' Link, so a docs page pointing at a Worker route writes the
  **absolute** URL.
- **Sweep a spelling everywhere at once, or not at all** — a per-page correction
  is how the site ends up claiming two things simultaneously. 🚨 **A redirect
  SOURCE in `public/_redirects` is never swept**: those are real URLs people
  hold, and rewriting one deletes the redirect you meant to keep. The
  destination is the half that follows a rename.

## The docs

[Fumadocs](https://fumadocs.dev) on Next, `output: 'export'` — static, no
runtime, no adapter. Content is MDX in `content/docs/`; everything else is a
thin shell in `src/`.

### The trees, five of them

`content/docs/haus/`, `pounce/`, `perch/`, `trill/` and `scruff/` are all **root folders**
(`"root": true` in their `meta.json`), which Fumadocs renders as the switcher at
the head of the sidebar. That is the site's positioning made navigable: **`haus`
is the layer, and the rest are apps that run on it — and without it.** A page
about the machinery goes in the first; a page about an app goes in that app's
own. If you can't tell which tree a page belongs in, that usually means the page
is two pages.

**Adding a tab is a positioning change, not a file.** The test is: **can a
stranger install this without haus?** pounce is MIT and one `brew install`;
perch is `brew install --cask hausfold/tap/perch` on macOS 14, no Nix; scruff is
one `nix run` or one `go install`. nebelung (a palette) and a desktop do not
clear it at all.

> 🚨 **`trill` is a tab that was admitted WITHOUT clearing that bar** — it is
> there on the user's explicit instruction. Record it as the exception it is,
> don't cite it as precedent. Its tree is **one page**, whose first paragraph is
> a `warn` callout stating what a stranger can and can't do: notarized releases
> exist, there is no cask and no one-line install, and
> `haus.notifications.compositor` — the Notifications room — is the only front
> door. That callout is the condition on the exception.
>
> `haus.notifications.compositor` is the option's current spelling;
> `haus.trill.enable` is an older name for it, and neither this repo nor haus
> aliases it, so a config still carrying that line does not evaluate.
>
> ⚠️ **Whether the tab clears the bar is the user's call and nobody has made
> it.** Until they do: **don't grow the tree past that page**, and don't read
> any of this as lowering the bar for the next tab. (scruff's tree, the fifth,
> is not that precedent: it cleared the install test on its own.) Keeping the
> callout accurate is a correction; deciding the tab is not.

**A new tree owes four things**, each easy to forget separately: an entry in
`content/docs/meta.json`'s `pages`; a `meta.json` of its own with `"root":
true`; a **hued** icon in `src/lib/icons.tsx`; and a
`body:has([data-tree='<name>'])` rule in `src/app/global.css` pointing at one of
the six `--a-*`. Miss the last and the whole tree renders in `--ink`, silently.

### The editorial bar

**Verify, consolidate, simplify, consumerize.** What comes out of a page:
maintainer reasoning (why something was built a certain way, what failed first —
that is a commit message, not a docs page); us-only detail (one person's
hardware, the internals of a readout nobody configures); and anything a reader
can find elsewhere in one click — point at it. What stays: the sentences that
took work, every fact a reader acts on, and the warnings. **Verify each fact
against the source repo**, not against another page.

**Write for a first-comer, and hold them.** The reader has not installed
anything, does not know Nix, and is deciding whether this is for them — so every
page opens with what the thing *is* and ends with a way onward: a lede a
stranger can finish, then the detail; a `<Cards>` pair at the foot instead of a
bare "see also"; and the prev/next pair the layout renders. **No page should end
without a door out of it.** Length still costs.

⚠️ **Don't put a *count* of the rooms on a page.** `content/docs/haus/index.mdx`
says thirteen and lists thirteen; `meta.json`'s `---Rooms---` group holds
fourteen entries and always will hold more, because the last is `rooms/creating`
— how to write a room, which is not one. Count the rows in `index.mdx`'s table,
never the sidebar group.

**A room page documents the room** — the haus wiring, the options, what turns
on. Everything about the app itself lives in the app's own tree.

### The one generated page

`reference/options.mdx` is not written, it is **rendered** —
`scripts/gen-options.mjs`, from haus's committed `docs/site-data/`. It is the
only page here whose shape is a list of records, and the only one carrying a
layout of its own. Four things it does that no other page may, each with its
rule:

| It does | Because | Don't |
|---|---|---|
| Sets **`tableOfContents.maxHeadingLevel`** in frontmatter (read in `src/app/docs/[[...slug]]/page.tsx`) | one h4 per option meant a rail one row deep per option, wrapping `haus.apps.videoPlayer.enable` over three lines | reach for the key on a hand-written page — too many headings there is a page problem, not a rail problem |
| Emits an empty **`<div className="hf-options" />`**, which every rule under "the options reference" in `src/app/global.css` that restyles an ORDINARY element (`h4`, `h4 + p`, `small`) scopes to via `:has()` | on this page an h4 means "the next record", and nowhere else does | style `.prose h4` globally to fix this page. (`.hf-optindex` and `.hf-more` are bare class selectors, like `.hf-card` and `.hf-next` — they name things only this page emits) |
| **Prints a shared description once.** haus declares each bar pill twice (`haus.bar.items.<pill>` and `haus.bar.bottom.items.<pill>`) from one description; the longer copy cross-references the shorter name | it was ~12,000 characters of exact duplication, and the same 400-word essay met twice under two names | special-case the bar. The rule is *identical description text over 240 characters*, and knows nothing about pills |
| **Folds a long description** after its first paragraph, behind `More detail` | over half the descriptions run past 500 characters and a couple of dozen past 2,000 | read it as permission to cut. Nothing is removed: the text is in the HTML, the search index, `llms-full.txt` and the page's Markdown |

🚨 **The prose on that page is haus's, and this repo may not edit a word of
it** — `--check` re-renders and fails on a hand edit. A description that is too
long is fixed in its `.nix` declaration in `hausfold/haus`, and the page gets
quietly shorter when it is: under the fold threshold, an option renders whole
again with nothing to change here.

### Colour

⚠️ **The docs do NOT follow the landing pages' greyscale rule.** The
instruction is **colour at rest, on a leash**:

- **One hue per tree, at rest.** Every page under `/docs/haus` wears
  `--a-nebelung` (mauve — which *is* nebelung's own accent, so the layer wears
  the palette the family shares); `/docs/pounce` wears `--a-pounce` (peach). It
  comes from `data-tree` on the page container, read by
  `body:has([data-tree=…])` in `src/app/global.css`. A reader can tell the
  halves apart with the page upside down, which is the point.
- **A page may override with `accent: <product>`** in frontmatter — one of the
  six in `src/lib/shared.ts` — and that rule is written *after* the tree rules
  so it wins. 🚨 **No page anywhere carries one today**, and the key stays in
  the schema without a worked example: a room page is about the *room*, not the
  app it installs. Reaching for it is a signal that the page may be two pages.
- **Four named steps, and nothing mixes its own**: `--accent`, `--accent-wash`
  (7%, for fills), `--accent-line` (55% into the rule colour, for rules), and
  `--accent-quiet` (50% into `--ink-3`, for a glyph at rest). All four are
  declared once on `body` and resolve against whichever `--accent` won. **An
  ad-hoc `color-mix()` at the point of use is the thing to refuse** — if a
  surface needs a fifth step, name it up there and say what it is for.
- **Colour orients; it doesn't decorate.** Every place it lands answers *where
  am I* or *what is this*. If a new use answers neither, it doesn't get a hue.
- **The six `--a-*` are the whole vocabulary.** No page, component or state may
  introduce a seventh. Fumadocs' own callout hues stay re-pointed at ours.
- **Motion is stopped, not promised.** Fumadocs ships ~20 `transition-colors` in
  components this repo doesn't own; `src/app/global.css` ends with a
  `prefers-reduced-motion` block that holds them, handing back exactly one
  thing: the ⌂ mark's 0.7s fade.
- **Code blocks keep nebelung's ramp** at rest in both themes. Shiki emits
  `var(--nb-token-*)` rather than hexes, so the light/dark fork happens in CSS.

### Type

The landing pages set New York for everything; the docs split it. **Headings are
the serif** (`--font-display`), with `h1` bumped to
`clamp(1.85rem, …, 2.25rem)`. **Body is SF** (`--font-sans`, `-apple-system`) at
`clamp(0.98rem, …, 1.06rem)` / 1.7. **Chrome stays mono.** Why: New York at 16px
on a dark ground reads as an *unloaded* font rather than a chosen one. Both
faces are still the Mac's own.

- **`--font-sans` is the body face, deliberately** — it is the token every
  `font-sans` utility inside fumadocs' components resolves, so the search
  dialog, buttons and tree switcher follow with nothing to keep in step. Three
  rules spend `--font-display`: `h1`, `h2/h3/h4`, and `body:has(.sheet)`.
- **Every `.sheet` route is exempt**, via `body:has(.sheet)`. **A landing page
  whose `<main>` is not a `.sheet` silently comes out in SF.**
- **Heading rules must exclude `.not-prose`.** Fumadocs builds components out of
  headings — a Card's title is an `<h3 class="not-prose text-sm">` inside the
  prose container — so a bare `.prose h3` puts the display serif on a 14px UI
  label.

### Icons

`src/lib/icons.tsx` is the **whole** icon vocabulary, and content never names a
Lucide component: `meta.json` and frontmatter say `icon: bar`, the table maps it
to a glyph, and `loader({ icon })` in `src/lib/source.ts` resolves it. A page's
icon is an editorial claim about what the page *is*, and an icon carrying a
product's accent (`data-hue`) has to be constructed in one place. Fumadocs'
`lucideIconsPlugin` would take Lucide names straight from content; it is
deliberately not used.

**A hued icon holds its colour anywhere**, including inside the tree switcher's
popover, which React portals to the end of `<body>`. That is why the five tree
glyphs have hues and page glyphs don't: page glyphs are tinted by their tree,
and the trees have to stay distinguishable side by side in one menu. **Ask which
side of the docs an icon points at before giving it a colour** — a hued page row
in a mauve tree reads as an error.

**A new page owes an icon** — a row with no glyph in a column of glyphs reads as
broken. **One exception**: the three brand marks (GitHub, Anthropic, OpenAI) in
`src/components/page-actions.tsx`, deliberately outside the table because a page
should not be able to put GitHub's logo in its frontmatter. A second such
exception would not be an exception.

### The sidebar has no way-out list

`baseOptions()` in `src/lib/layout.shared.tsx` has **no `links` list**, and
putting one back is a positioning decision rather than a tidy-up. A link out of
the docs that lands back in the docs is the tree switcher at the top of the same
sidebar; and a list of one row reads as a leftover, not a section. The way back
to the site is the `⌂` in the nav. (The `desktops` glyph stays in `icons.tsx`
because content names it — `rooms/creating`'s way-onward card points at
`desktops/creating` with it, and removing the entry prints `[icons] unknown
icon` at build time rather than failing.)

### Components

`src/components/mdx.tsx` registers Callout, Card/Cards, Step/Steps, Tab/Tabs,
`Icon`, and nothing else. **A component the prose could have been is a component
that hides the prose from search and from `llms-full.txt`.** Adding one is a
decision.

Three are ours. Two are thin, and exist to give the stylesheet a class rather
than a guess:

- **`Card`** wraps fumadocs' with `.hf-card`, because styling "every bordered
  box in the prose" puts a doorway's rule on a callout.
- **`Separator`** (`src/components/sidebar-parts.tsx`) renders the sidebar's
  group label with `.hf-group`, rather than `#nd-sidebar p`, which also matches
  the tree switcher's `<p>`s. **Don't reach for a bare element selector inside
  fumadocs' chrome** — the same element is three different things in three
  places.

The third is a decision rather than a class:

- **`ViewOptions`** (`src/components/page-actions.tsx`) is the "Open in…" menu,
  and it **replaces** fumadocs' `ViewOptionsPopover` rather than styling it.
  Fumadocs ships six destinations; ours lists four — the page as Markdown, its
  source on GitHub, and the two assistants with the reach to be worth a row. 🚨
  **That list is an endorsement**, so it is hardcoded rather than passed in per
  page. Adding a fifth is a decision, and the bar is reach. The actions live in
  the row *above* the title (`.hf-meta`), not under the description: they are
  chrome, addressed to a reader who is not reading yet. They come before the
  `h1` in the DOM as a result — a chosen trade, see the comment in
  `src/app/docs/[[...slug]]/page.tsx`.

### Gotchas paid for already

- **A markdown image is a build-time import** under Fumadocs, resolved relative
  to the content file — a missing asset is a hard build failure.
- **`themes` vs `theme` in the Shiki config.** Fumadocs merges its defaults
  *under* yours and Shiki branches on `'themes' in options`, so a `theme:` key
  leaves an empty `themes` beside it and every MDX file fails with `TypeError:
  Cannot convert undefined or null to object`. `src/lib/source.ts` has the
  working shape.
- **`out/404.html` always comes from `src/app/not-found.tsx`** and overwrites
  anything of that name in `public/`.
- **A root folder's index page is not in `pageTree.children`.** Looking a tree
  up by `node.index?.url` silently finds nothing; match on `node.$id`, which is
  the folder name and the page's first slug.
- **A `display: contents` wrapper at the top of a route segment silently kills
  scroll-to-top.** Next's scroll handler walks the segment's first DOM node and
  skips any element whose `getBoundingClientRect()` is all zeros. Put `data-tree`
  / `data-accent` on `DocsPage`'s own `<article>` instead.
- **This Next is newer than your training data.** Read
  `node_modules/next/dist/docs/` before assuming an API. (Next 16 appends a
  block to `AGENTS.md` on every `next dev`; `agentRules: false` in
  `next.config.mjs` turns that off.)
- **A child's `openGraph` replaces the parent's rather than merging.** A page
  setting only `url`/`title`/`description` silently drops `og:site_name`,
  `og:type` and `og:locale`. `pageMetadata` spells all six out — don't
  "simplify" it back down.
- **Bare element selectors can't live in a page component.** `/perch/privacy`'s
  layout is `h1`/`h2`/`p`/`ul`, which would paint every other page under a
  shared layout. It is a CSS module scoped under `.policy`, which also settles
  the cascade — stylesheet order between a layout's imports and a page's is not
  a guarantee.
- **"Is the API there?" is `useSyncExternalStore`, not `useEffect` +
  `setState`.** The copy button must render `hidden` on the server and unhide on
  a client that has `navigator.clipboard`; the effect-then-setState spelling is
  a cascading render and `react-hooks/set-state-in-effect` fails the lint.
  `src/components/command.tsx` has the shape.
- **Containment on `<body>` stops its background reaching the canvas**, and
  `body:has(.sheet)` has containment. `html { background: var(--ground) }` in
  `src/app/global.css` is the fix — the root paints the canvas directly. ⚠️
  **Don't remove it as a duplicate of `body`'s**: it is the same value on
  purpose and the one that is actually seen. Look for the failure in **light**
  mode, where paper meets white; in dark Chrome it is invisible outright.

## Deploying

Pushing to `main` deploys — the workflow fires on any change under `public/`,
`content/`, `src/`, `worker.js`, or the build config. It runs `npm ci && npm run
build` first; `out/` is gitignored, so the build is not optional. There is no
staging environment: **main is the live site.** Look at your change in a browser
first, and check both themes.

- Editing **any page, docs or landing**: `npm run dev`. Hot reload.
  > **Every `next` invocation in `package.json` is prefixed
  > `NEXT_TELEMETRY_DISABLED=1`, and that prefix is load-bearing.** On exit,
  > `next dev` spawns a *detached* `telemetry/detached-flush.js`; when that POST
  > hangs the node process outlives the session with its cwd still inside the
  > checkout. `scruff` reaps on an `lsof -d cwd` sweep, so one stuck flusher pins
  > a merged lane as occupied. Don't drop the prefix.
- Checking the site **as deployed**: `npm run build && npx wrangler dev` — same
  asset server, and it exercises `not_found_handling`, `_headers`, `_redirects`
  **and `worker.js`**. Worth it for anything touching a URL: `/desktops` should
  301 to `/docs/haus/desktops/choosing/`, and `/docs` and `/haus` both to
  `/docs/haus/`, and a nonexistent path should 404 rather than 200.
- Editing **`worker.js`**: `npm test` for the logic (offline, ~1s), then the
  `wrangler dev` loop, because the one thing the unit tests can't prove is that
  a request reaches the Worker at all: `curl -sI localhost:8787/hacker.sh` must
  answer 200 with an `x-hausfold-ref`, and `curl -sI localhost:8787/api/search`
  must still be the built docs index.

CI, by what a PR touches:

- **Docs** (`docs.yml`, on `src/` `content/` `public/` or the build): type-check,
  lint, then **two cold builds diffed against each other**. The export is
  byte-reproducible today (`generateBuildId` in `next.config.mjs` is what makes
  it so), and without the check the day a Next or Fumadocs release introduces a
  timestamp is a day nothing tells you about. It also asserts `out/api/search`
  isn't empty. **Don't "fix" a red diff by loosening the comparison** — the step
  prints per-file sizes and 320 bytes around the first differing byte, and that
  is what named the one cause it has ever caught. It was **not** a clock, a
  random id or a path, which is what the step's own error message guesses:
  Shiki caps tokenising at **500ms per line** by default, and a line that blows
  the budget is returned half-scanned, rendering coarser rather than failing.
  `src/lib/source.ts` sets `tokenizeTimeLimit: 0`; the comment there has the
  whole account. 🚨 **The check is not a safety net for that class of bug** —
  it only fires when the two builds disagree, so two builds that both run slow
  degrade identically, pass, and deploy. An earlier red on the ~2 MB
  `reference/options` page was never diagnosed and may or may not be the same
  thing.
- **Worker** (`worker.yml`, on `worker.js` `test/` or either wrangler config):
  `npm test`, plus a check that both wrangler configs name the same `main`, the
  same `ASSETS` binding and `run_worker_first = true`. Those three catch one
  invisible failure between them: any of them missing from
  `wrangler.preview.toml` means a PR's installer change looks fine on the
  preview URL precisely *because* the route isn't running there. ⚠️
  `run_worker_first = true` is in `wrangler.preview.toml` for exactly that
  reason; drop it and nothing goes red, because the failure is invisible on the
  preview URL by construction.
- **Deploy** (`deploy.yml`, on main): builds, runs `npm test`, deploys, purges
  the cache, then smoke-tests nine live Worker routes plus the site root. It is
  **last on purpose** — a red smoke check must not skip the purge, which is what
  keeps un-hashed pages from sitting stale in front of visitors. Which also
  means it is an alarm, not a brake: it runs after the deploy, so a failure
  reddens the job with the bad code already live. ⚠️ **It cannot currently prove
  anything**: Cloudflare serves a GitHub runner the managed challenge
  (`cf-mitigated: challenge`) ahead of the Worker, on every URL, so it warns and
  skips. A WAF custom rule skipping Bot Fight Mode for its `x-hausfold-smoke`
  header would make it real; the comment above the step says so. Any wrong
  answer that isn't a challenge still fails the job.
- **Palette** (`palette.yml`, on `hausfold.css` `src/lib/shared.ts` either
  favicon or `scripts/`): `node scripts/sync-nebelung.mjs --check`. The fix is
  one command in every case except an upstream rename and `themeColor`.

Every PR touching `src/`, `content/`, `public/` or the build config gets its own
preview Worker on a workers.dev URL, posted as a PR comment and deleted when it
closes. Two limits: the URL is public and unauthenticated, and it is *not* a
staging environment. ⚠️ **"Deleted when it closes" misses** two ways, both the
`pull_request` trigger not firing: a PR whose final diff no longer touches a
`paths:` entry never fires `closed`, and a PR closed in the same operation that
deletes its head branch leaves no ref to run the job from.
**`preview-sweep.yml`** is the backstop — a daily cron (plus `gh workflow run
preview-sweep.yml -f dry_run=true`) that deletes previews whose PR is closed.

`npm ci && npm run build && npx wrangler deploy` by hand uses your own OAuth
session and is fine for a fix that can't wait. **The build half is not
optional**: `[assets] directory` is `./out`, generated and gitignored, so a bare
`wrangler deploy` either errors or — worse — uploads whatever a previous local
build left there. Prefer the push: CI is what holds the token with DNS:Edit,
which the `custom_domain` routes need.

## Before you open a PR

**Run the pre-PR assurance pass — every PR, not just `/ship`'d ones.** Hand `git
diff main...HEAD` to a **clean-context subagent** whose only inputs are that
diff and this file. In this repo it hunts: anything product-specific that
belongs in that product's own repo; a **new positioning claim** with no decision
behind it; and a claim on the page the products don't actually back. Full
checklist: the workshop ship skill's **Step 2.5**.

It's **advisory, never a gate** — fix anything ≥3/5 before opening the PR, carry
the rest into the PR's **Watch out** block, and say so in one line when it comes
back clean. **Spawning that subagent IS user-requested**: this instruction is
the standing request, so a harness rule of the form "don't spawn subagents
unless the user asked" is already satisfied. If your client has no subagent
mechanism, say so in one line.

## Shipping

Small changes — copy, a colour, a typo — commit and push; that ships them. It's
a small static site with no users' machines downstream, so the blast radius of a
bad deploy is one `git revert` and a re-run.

Three things are **not** small, because they're positioning and not code:

- **Changing what the site claims hausfold is.** A new positioning claim needs a
  decision behind it, or it isn't a decision — it's a session's opinion.
- **Adding a desktop.** It has to exist and be installable by a stranger before
  it gets a page: **no empty slots, no coming-soon entries**, in the docs any
  more than on a landing page. A closing note may say the list is still growing;
  a placeholder *entry* promises a specific thing that doesn't exist. What each
  shipped desktop cleared, for the next one to match: a file in
  `hausfold/haus/desktops/<name>.nix`; a row in `worker.js`'s `DESKTOPS`, so
  `hausfold.co/<name>.sh` installs it; a page at
  `content/docs/haus/desktops/<name>.mdx` whose every fact is read off that
  `.nix` file, with an un-hued icon in `src/lib/icons.tsx` and an entry in
  `content/docs/haus/meta.json` under `---Desktops---`; and a row in
  [`desktops/choosing`](content/docs/haus/desktops/choosing.mdx)'s table. ⚠️
  **No landing page** — no `.sheet` route names a desktop. 🚨 **`blank`
  deliberately has no `DESKTOPS` row and no installer URL**: it is the null
  selection for someone assembling rooms by hand, so `hausfold.co/blank.sh`
  would promise a machine it does not produce. It has a docs page, which is the
  right shape — a page can explain a null selection, a `curl | bash` cannot.
- **Adding a product name that isn't real yet.** Anything named on this site
  should have a row in `PRESENCE.md` (private,
  [`hausfold/ops`](https://github.com/hausfold/ops)) first: the domain, the org
  and the handles checked. Naming is the expensive kind of reversible. There is
  **one standing exception**, and it is narrow: the last line of `#made` may
  carry a workshop-stage name on the condition that the register accounts for
  that name explicitly — today that is `trill`, with its one-page tree and its
  `warn` callout. Two such lines at once would be a habit, not an exception. ⚠️
  **The check costs a second repo and can't be short-circuited here** — go read
  the register, and **don't restate what you find**: which names are held and
  which aren't is the one thing it is private for. Cite the rule here; keep the
  answer over there.
