# hausfold.co

The site for **hausfold** — ~~the commercial umbrella behind the
nebelhaus family~~ **the nix-darwin ricing platform, the org everything ships
from, and the seller** (decided 2026-08-08; nebelhaus is now one rice built on
it — see the
[rename plan](https://github.com/hausfold/workshop/blob/main/notes/hausfold-rename.md)).
Served on [hausfold.co](https://hausfold.co) (and `www.`) by a
static-assets-only Cloudflare Worker — no Worker JS ever runs.

It is **two things in one tree**, and knowing which one you're editing is the
first thing to get right:

- **The pages** — `/`, `/haus`, `/desktops`, `/pounce`, `/perch`, `/terms`,
  `/refunds` — are hand-written HTML in `public/`, with no framework and one
  twelve-line copy-button script repeated on four of them.
- **The docs** — everything under `/docs` — are [Fumadocs](https://fumadocs.dev)
  on Next, built to a **static export**. Added 2026-08-12 (rename plan §5.2).

Since the docs landed there **is** a build step: `npm run build` writes `out/`,
Next copies `public/` into it verbatim, and `out/` is what `wrangler deploy`
uploads. So the hand-written pages are still served as exactly the files you
edit — but `out/` is generated, gitignored, and a deploy that skips the build
uploads nothing.

```
public/
  index.html                      the landing page — and, since 2026-08-12, the desktop catalogue itself
  haus/index.html                 the platform page — the one file, the commands, what it covers
  desktops/nebelhaus/index.html   install, contents, requirements, empty shot frames
  _redirects                      static redirects; consumed by Cloudflare, never served
  pounce/index.html               pounce's product page — install, the command format
  perch/index.html                perch's product page — what it is, how to install it
  perch/privacy/index.html        perch's privacy policy — linked from the App Store
  terms/index.html                the terms — what a licence grants, what we don't promise
  refunds/index.html              the refund policy — fourteen days, no questions
  hausfold.css                    shared tokens and type, and the design notes
  favicon.svg                     the haus mark as geometry, swept; linked from every page
  favicon.ico                     the same mark, monochrome — Safari's fallback, since 2026-08-12
  robots.txt                      allows everything; its comment says why it exists at all
  _headers                        content-type for the search index, cache for /_next/static
content/docs/                     the docs, as MDX
  haus/                             the layer  — a sidebar tab
  nebelhaus/                        the desktop — the other tab
src/                              the Next app: layout, theme, MDX components
  app/global.css                  Fumadocs re-pointed at hausfold.css's tokens
  app/not-found.tsx               the 404 — a Next page since 2026-08-12, see below
scripts/
  sync-nebelung.mjs               vendors nebelung's CSS port into hausfold.css
```

**The 404 moved out of `public/`.** Next's export always writes its own
`out/404.html` and overwrites anything of that name copied from `public/`, so
the page had to become `src/app/not-found.tsx` or silently become Next's grey
default. Same markup, same classes, same words — but it is no longer one of the
files `sync-nebelung.mjs --check` walks, so its dark `theme-color` is now
carried by `src/lib/shared.ts` instead and nothing compares the two.

`scripts/` is not part of the site and is not deployed. `sync-nebelung.mjs`
writes a marked block into `public/hausfold.css` — nebelung's own
`dist/css/nebelung-mocha.css`, fetched with `nix build
github:hausfold/nebelung` — so the dark theme reads `var(--nebelung-*)`
instead of the twenty hand-copied hexes it used to carry (ten values, each
written twice). Run it after an upstream palette change:

```
node scripts/sync-nebelung.mjs --latest   # has nebelung moved, and would it change anything here?
node scripts/sync-nebelung.mjs            # re-render the block from the pin
```

(No node on the machine? `nix run nixpkgs#nodejs -- scripts/sync-nebelung.mjs`.)

The flake ref is **pinned** to a revision recorded in the script and stamped
into the generated block. That keeps CI deterministic — the palette check fails
for what the PR did, never for what nebelung merged this morning — at the price
of drift being something you *ask* about rather than something that arrives.
`--latest` is the asking: it reports the new revision and names the values a
bump would actually change, then you set `PIN`, re-run, and commit the block.

> **The consolidation is half-landed.** §5.2 of the
> [rename plan](https://github.com/hausfold/workshop/blob/main/notes/hausfold-rename.md)
> moves the whole site into this repo. What has arrived is `/docs` — rebuilt on
> Fumadocs rather than ported from the workshop's Astro/Starlight tree, which
> was the user's call on 2026-08-09 — and, arriving ahead of it on 2026-08-08
> and 2026-08-12, the desktops and the seller's pages (`/desktops`, `/perch`,
> `/pounce`, `/terms`, `/refunds`), still the hand-written HTML they always
> were. What has not:
>
> - **most of the docs pages.** Five are here; the workshop's `web/` still
>   holds the rest, and **nebelhaus.com is still live and still serving them**.
>   A fact fixed in one tree and not the other will disagree — fix it in both
>   or in neither until the port finishes.
> - **the landing pages becoming Next routes.** Decided, not done: they are
>   still the hand-written HTML above, served beside the export.
> - **`worker.js`** — `/init.sh`, `/download/<app>`, `/api/release/<app>` — and
>   with it the `hausfold.co/<rice>.sh` installer route and the
>   `nebelhaus.com/*` 301s. Until those land, the docs print
>   `nebelhaus.com/init.sh`, which is the URL that actually works.

`not_found_handling = "404-page"` serves `404.html` — now generated from
`src/app/not-found.tsx` — with a real 404 for anything else. It was `single-page-application` — every path answering 200 with the
landing page — which was right while the site was one sheet and wrong the moment
`/desktops/pounce` became a plausible typo. One consequence to know: paths the
SPA fallback used to absorb now 404 honestly — a list that was written here as
"including bare `/perch`" and no longer includes it, since `/perch` became a
real page on 2026-08-08. Directory pages resolve with and without the trailing
slash (the slashed form is what the 307 lands on), which is why the canonical
tags matter.

**The name register is not here.** `PRESENCE.md` — every account, handle and
namespace claimed under the hausfold name, what we hold, what's still a gap, and
which channel to reach for when there's something to announce — lives in
[`hausfold/ops`](https://github.com/hausfold/ops), which is private and stays
that way. It listed the gaps as plainly as the holdings, which is exactly why it
can't live in a public repo.

## Deploy

**CI does it.** [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)
runs on every push to `main` that touches `public/`, `content/`, `src/`, the
build config, `wrangler.toml` or the workflow itself, and on demand via
*Actions → Deploy hausfold.co → Run workflow*. It runs `npm ci && npm run
build` first — `out/` is gitignored, so the build is not optional. It needs
three repo secrets — the workflow header lists them and the exact Cloudflare
permissions each one wants.

By hand, when you need it (an unpushed change, a broken token):

```sh
npm ci && npm run build
npx wrangler deploy      # nixpkgs' wrangler fails to build — use npx
```

That path uses your own `wrangler login` OAuth session, not the CI token.

## Preview a PR

[`.github/workflows/preview.yml`](./.github/workflows/preview.yml) gives every
PR that touches the site or the docs (or either wrangler config) its own Worker at
`https://hausfold-pr-<number>.<subdomain>.workers.dev`, and comments the link on
the PR — edited in place, so a push updates the link rather than adding another.
Closing the PR deletes the Worker.

It reuses `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
[`wrangler.preview.toml`](./wrangler.preview.toml) is `wrangler.toml`'s asset
settings with `routes` dropped and `workers_dev = true` added, so a preview
lives only on workers.dev and can't take the hausfold.co hostname — no DNS
permission is exercised. Since that config is read from the PR's own head
commit, a guard step fails the job if a route reappears in it (in any TOML
form). Treat the guard as accident-prevention, not a security boundary — a
same-repo PR edits the workflow too. The boundary is the fork check: GitHub
withholds the secrets from forks, and both jobs test the head repo explicitly.

Two things to know: the preview URL is **public and unauthenticated** — fine for
this page, but don't push anything to a PR branch you wouldn't put on
hausfold.co itself. And a preview is not a staging environment; it green-lights
nothing, it just lets you look at the page on a real origin.

## The pages

`public/hausfold.css` carries the palette, type and layout decisions in its
header comment. The short version — nebelung's neutral ramp pushed one rung
outward for contrast, and New York over SF Mono. It's greyscale on purpose:
hausfold is the quiet house the products sit in, not a sixth product competing
with them for attention. **That restraint survives the 2026-08-08 repositioning
and is worth defending** — the house being the platform is an argument for it
holding no colour, not against: the accents belong to the rices and the apps,
and nebelung's palette is the one brand asset the family genuinely shares. So
the site owns no colour of its own and nothing moves on it. Both of those give
way only under the pointer: hovering a name tints it with that product's accent,
and hovering the `⌂` mark stripes it with all six and lets them drift. Leave,
and it's grey and still again.

One thing does not give way, and it is deliberate: **the favicon holds the
six-accent sweep at rest**, because the two hover exceptions are gated on a
hover a favicon hasn't got — an icon that stays grey until you point at it is
just a grey icon. It borrows rather than owns like everything else here (same
six accents, generated out of the same vendored nebelung port), it is chrome
rather than page, and AGENTS.md records it as the third and only exception.

The catalogue is where this rule is under most pressure, and it's why
`/desktops/nebelhaus`'s screenshot slots being empty is a feature rather than a delay: a
real capture of the nebelhaus desktop is wall-to-wall nebelung, and the day one
lands is the day the site stops being greyscale at rest. Worth doing on purpose
rather than by accident.

Both themes are token-level: `prefers-color-scheme` carries the OS preference
and `:root[data-theme]` overrides it in both directions. Check both before
shipping a colour change.

The dark theme's nebelung values are **vendored, not typed**: `hausfold.css`
opens with a generated copy of nebelung's own CSS port, and both dark blocks
read `var(--nebelung-*)` from it. Two dark values are deliberately outside
that — `--ink`, extrapolated a rung above nebelung's text, and `--well`, which
is hand-picked and is *not* mantle — and the whole light theme is hand-picked
too, a paper-warm mirror rather than latte, because nebelung's pastels wash out
on a light ground.

`.github/workflows/palette.yml` runs `sync-nebelung.mjs --check` on every PR
that touches the stylesheet, any page under `public/`, or `scripts/`. It
enforces that the vendored block
matches the pinned upstream, that both dark blocks read the right `--nebelung-*` names and
that those names still exist, that `--ink` and `--well` are literals which agree
between the two blocks, that no `--nebelung-*` reaches the light theme, and that
every page has a dark `theme-color` and it still equals crust. That last one
reads markup, not CSS, which is why `public/**.html` is in the paths filter:
without it an HTML-only PR could add a page with the wrong crust — or no dark
`<meta>` at all — and go green. It does **not** know which
hex `--well` ought to be — that one is a judgement, and the header comment is
where it's recorded.

`robots.txt` is a real file rather than a default because the SPA fallback
would otherwise have answered `/robots.txt` with the landing page. There is
deliberately no `og:image`; [AGENTS.md](./AGENTS.md#the-site) says why, so that
nobody "fixes" it.

**Look at it over HTTP, not `file://`.** The stylesheet and every link are
absolute paths, so `open public/index.html` gets you unstyled text and dead
links.

For the **docs**, `npm run dev` is the loop — hot reload, and the only way to
iterate on MDX at any speed. For the **whole site as deployed**, `npm run build
&& npx wrangler dev` is the truest check: same asset server, and it exercises
`not_found_handling` and `_headers`. `python3 -m http.server` inside `out/`
after a build is enough for a look at the type.

## The desktops

The catalogue — desktops you can install, one page per desktop, today only
[nebelhaus](https://github.com/hausfold/haus).

> **It was its own page at `/desktops` from 2026-08-08 to 2026-08-12.** The
> catalogue is now the landing page's first section, `/#desktops`, and
> `/desktops` + `/desktops/` 301 there via `public/_redirects`. Two reasons:
> the desktops are what the site is for, so they shouldn't be a click away
> from the front door; and a gallery of one entry read as smaller behind a
> link than it does as the page's own opening section, honestly labelled.
> **The deep page did not move** — `/desktops/nebelhaus/` is unchanged, and
> the `/desktops/` segment stays because it's the namespace desktops two and
> three land in. Rebuild `desktops/index.html` when there are enough entries
> to need a list of their own; until then the front page *is* the list.

> **The path was `/market` in the rename plan for a few hours.** Two sessions
> named the gallery on 2026-08-08, blind to each other; the user resolved it in
> favour of `/desktops` and the plan was amended to match
> ([workshop#258](https://github.com/hausfold/workshop/pull/258)). If you meet
> `hausfold.co/market` anywhere, it's stale.

The deep page holds traffic rather than sending it on, which the landing page
deliberately doesn't: the whole point is that the install command is *right
there*. It's still one screen deep and everything longer links out. `AGENTS.md`
has the rest of the rules.

Two things about it that look like bugs and aren't:

- **The screenshot frames are empty**, drawn in CSS and labelled `[ shot not
  taken yet ]`. There is no real nebelhaus desktop capture to use — the one in
  `hausfold/assets/hero.png` is called a placeholder by the workshop's own
  `SHOTLIST.md`. Drop an `<img>` in when there is. The landing page's own
  catalogue entry carries **no** frame at all for the same reason stated the
  other way round: a dashed empty box immediately under the page's first
  heading reads as a broken image rather than as a reserved slot. Add one there
  only with a real capture in it.
- **The copy button beside the install command disappears over `file://`.** It
  ships `hidden` and the page's one script only reveals it where
  `navigator.clipboard` exists, which needs a secure context. The command is
  selectable text regardless.

## Why `custom_domain` and not a route

The `hausfold.co` zone had no DNS records at all. A plain Workers route
(`hausfold.co/*`) needs a proxied record to already exist for the hostname;
`custom_domain = true` makes wrangler create and proxy that record itself. This
is why the deploy token needs **Zone → DNS:Edit** and not just Workers scopes.

## Watch out

**Always Use HTTPS is on** for this zone, so `http://hausfold.co/` 301s to
`https://` (same for `www.`). That's a Cloudflare dashboard setting
(SSL/TLS → Edge Certificates), not something this config carries — if the
redirect ever disappears, look there first, not here.

**Every hand-written asset is un-hashed.** `index.html`, `/desktops/nebelhaus`
and `hausfold.css` all keep the same URL when their contents change, so an
edge cache can keep serving the old copy after a deploy. (Next's own
`/_next/static/*` bundles are content-hashed and `public/_headers` caches them
for a year — they are the exception, not the rule.) `hausfold.css` is the one
that bites hardest now: a stale stylesheet against fresh markup looks like a
broken page rather than an old one. That's what the workflow's purge step is
for; without `CLOUDFLARE_ZONE_ID` set it warns and skips, and your change lands
whenever the edge feels like it.

## Why this repo starts at one commit

The site's first two months are not in `git log` here. They're in
**`hausfold/website`**, which is private, stays private, and is not going to be
opened.

Plan §5.1 needs the site repo public — a docs site wants edit links and
contributions — and the obvious move was to scrub `hausfold/website` and flip
it. **That does not work, and the reason is the useful part.**

Two things in that history had to go: the register, and a cached Cloudflare
account id that predates the split. `git filter-repo` removes both from the
branch — and removes neither from GitHub. `hausfold/website` had pull requests,
**GitHub keeps `refs/pull/N/head` forever, and a history rewrite does not
garbage-collect them.** Measured on 2026-08-08: every PR ref then in existence
still reached both artifacts after the rewrite. They stay fetchable — on a repo
that has just been made public.

*(The specifics stay in the old repo's own README, where the repo is private.
Publishing the exact paths and commits would be handing over the fetch recipe.)*

So: **rewriting history on a repo that has ever had a pull request is hygiene,
not removal.** A new repo has no PR refs, no blob and no old revisions, and
needs no support ticket to make that true. What it cost was 33 commits of a
placeholder page and its first real week — and §5.2 replaces that markup
regardless.

What carried over, on 2026-08-08, as one commit: everything the old repo
tracked — `public/`, both wrangler configs, both workflows, `.gitignore`,
`CLAUDE.md`, this file and `AGENTS.md`. What didn't: `PRESENCE.md`,
which went to the private [`hausfold/ops`](https://github.com/hausfold/ops) with
its eleven revisions intact.

**Two rules fall out of this, and neither has a second chance:**

- **Nothing private is ever committed here.** Not a register, not an account id,
  not a token "just to test CI". This repo is public from its first commit, it
  has no pre-public history to hide a mistake in, and — see above — deleting a
  commit does not delete it.
- **`hausfold/website` is never made public.** Archive it, don't delete it —
  it is the only copy of the site's first two months. (Deleting it wouldn't
  break the domain: the `custom_domain` binding lives in Cloudflare, tied to the
  Worker name, and both wrangler configs came over here. It would just lose the
  history.)

### Before that

The site was `hausfold/` inside
[hausfold/workshop](https://github.com/hausfold/workshop) until 2026-08-06,
when it was split out into `hausfold/website`. ~~It lives in the `hausfold` org,
not `nebelhaus`, because it isn't part of the product family.~~

**That reasoning was repealed on 2026-08-08.** hausfold became the platform
rather than an umbrella, so the `hausfold` org is where the *whole* family
lives — all ten repos migrate in, and this one stops being the exception that
proves a rule. Only the justification changed, from *this isn't family* to
*this is where family lives*.
