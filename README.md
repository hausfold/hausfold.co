# hausfold.co

The site for **hausfold** — ~~the commercial umbrella behind the
nebelhaus family~~ **the nix-darwin ricing platform, the org everything ships
from, and the seller** (decided 2026-08-08; nebelhaus is now one rice built on
it — see the
[rename plan](https://github.com/nebelhaus/workshop/blob/main/notes/hausfold-rename.md)).
A handful of hand-written HTML files
served on [hausfold.co](https://hausfold.co) (and `www.`) by a
static-assets-only Cloudflare Worker. No build step, no framework, one
twelve-line script: `wrangler deploy` uploads `public/` and Cloudflare serves it.

```
public/
  index.html                      the landing page
  desktops/index.html             the gallery — rices you can run as they come
  desktops/nebelhaus/index.html   install, contents, requirements, empty shot frames
  perch/index.html                perch's product page — what it is, how to install it
  perch/privacy/index.html        perch's privacy policy — linked from the App Store
  terms/index.html                the terms — what a licence grants, what we don't promise
  refunds/index.html              the refund policy — fourteen days, no questions
  404.html
  hausfold.css                    shared tokens and type, and the design notes
```

> **That description is about to be wrong.** Under §5.1 of the
> [rename plan](https://github.com/nebelhaus/workshop/blob/main/notes/hausfold-rename.md)
> this repo takes over the whole site — `/`, `/docs`, the gallery, `/holt`,
> `/pounce`, `/perch` — which means the Astro build from `workshop/web` and a
> real `main`. §5.1's other prerequisite, *this repo going public*, is already
> done: it was met by [creating this repo](#why-this-repo-starts-at-one-commit)
> rather than by flipping the old one. `/desktops` is the first page of that
> consolidation, arriving ahead of the build — so treat its markup as temporary
> and its copy as not.

`not_found_handling = "404-page"` serves `404.html` with a real 404 for anything
else. It was `single-page-application` — every path answering 200 with the
landing page — which was right while the site was one sheet and wrong the moment
`/desktops/pounce` became a plausible typo. One consequence to know: paths the
SPA fallback used to absorb now 404 honestly. ~~including bare `/perch`~~ —
`/perch` is a real page as of 2026-08-08 and no longer among them. Directory
pages resolve with and without the trailing slash (the slashed form is what the
307 lands on), which is why the canonical tags matter.

**The name register is not here.** `PRESENCE.md` — every account, handle and
namespace claimed under the hausfold name, what we hold, what's still a gap, and
which channel to reach for when there's something to announce — lives in
[`hausfold/ops`](https://github.com/hausfold/ops), which is private and stays
that way. It listed the gaps as plainly as the holdings, which is exactly why it
can't live in a public repo.

## Deploy

**CI does it.** [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)
runs on every push to `main` that touches `public/`, `wrangler.toml` or the
workflow itself, and on demand via *Actions → Deploy hausfold.co → Run workflow*.
It needs three repo secrets — the workflow header lists them and the exact
Cloudflare permissions each one wants.

By hand, when you need it (an unpushed change, a broken token):

```sh
npx wrangler deploy      # nixpkgs' wrangler fails to build — use npx
```

That path uses your own `wrangler login` OAuth session, not the CI token.

## Preview a PR

[`.github/workflows/preview.yml`](./.github/workflows/preview.yml) gives every
PR that touches `public/` (or either wrangler config) its own Worker at
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

The gallery is where this rule is under most pressure, and it's why
`/desktops`'s screenshot slots being empty is a feature rather than a delay: a
real capture of the nebelhaus desktop is wall-to-wall nebelung, and the day one
lands is the day the site stops being greyscale at rest. Worth doing on purpose
rather than by accident.

Both themes are token-level: `prefers-color-scheme` carries the OS preference
and `:root[data-theme]` overrides it in both directions. Check both before
shipping a colour change.

`robots.txt` is a real file rather than a default because the SPA fallback
would otherwise have answered `/robots.txt` with the landing page. There is
deliberately no `og:image`; [AGENTS.md](./AGENTS.md#the-site) says why, so that
nobody "fixes" it.

**Look at it over HTTP, not `file://`.** The stylesheet and every link are
absolute paths, so `open public/index.html` gets you unstyled text and dead
links. `npx wrangler dev` is the truest check — it's the same asset server and
it exercises `not_found_handling`. `python3 -m http.server` from inside
`public/` is enough for a look at the type.

## `/desktops`

Added 2026-08-08. The gallery — rices you can install, one page per rice, today
only [nebelhaus](https://github.com/nebelhaus/nebelhaus).

It holds traffic rather than sending it on, which the landing page deliberately
doesn't: the whole point is that the install command is *right there*. It's
still one screen deep and everything longer links out. `AGENTS.md` has the rest
of the rules.

> **The path was `/market` in the rename plan for a few hours.** Two sessions
> named the gallery on 2026-08-08, blind to each other; the user resolved it in
> favour of `/desktops` and the plan was amended to match
> ([workshop#258](https://github.com/nebelhaus/workshop/pull/258)). If you meet
> `hausfold.co/market` anywhere, it's stale.

Two things about it that look like bugs and aren't:

- **The screenshot frames are empty**, drawn in CSS and labelled `[ shot not
  taken yet ]`. There is no real nebelhaus desktop capture to use — the one in
  `nebelhaus/assets/hero.png` is called a placeholder by the workshop's own
  `SHOTLIST.md`. Drop an `<img>` in when there is.
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

**Every asset is un-hashed.** `index.html`, the two `/desktops` pages and
`hausfold.css` all keep the same URL when their contents change, so an edge
cache can keep serving the old copy after a deploy. `hausfold.css` is the one
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
placeholder page and its first real week — and §5.1 replaces that markup with an
Astro build regardless.

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
[nebelhaus/workshop](https://github.com/nebelhaus/workshop) until 2026-08-06,
when it was split out into `hausfold/website`. ~~It lives in the `hausfold` org,
not `nebelhaus`, because it isn't part of the product family.~~

**That reasoning was repealed on 2026-08-08.** hausfold became the platform
rather than an umbrella, so the `hausfold` org is where the *whole* family
lives — all ten repos migrate in, and this one stops being the exception that
proves a rule. Only the justification changed, from *this isn't family* to
*this is where family lives*.
