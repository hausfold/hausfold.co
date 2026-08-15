# deploying

**Push to `main`.** [`deploy.yml`](../.github/workflows/deploy.yml) fires on any
change under `public/`, `content/`, `src/`, `worker.js`, the build config or
`wrangler.toml` — and on demand from *Actions → Deploy hausfold.co → Run
workflow*. It runs `npm ci && npm run build` first, because `out/` is
gitignored and a deploy that skips the build has nothing to upload.

There is no staging environment: **main is the live site.** Look at your change
in a browser first, in both themes.

By hand, when you need it — an unpushed change, a broken token:

```sh
npm ci && npm run build
npx wrangler deploy      # nixpkgs' wrangler fails to build; use npx
```

That uses your own `wrangler login` session. **The build half is not optional**
— a bare `wrangler deploy` either errors on a missing `out/` or, worse, uploads
whatever a previous local build left there, which may be another branch's site.

The three secrets and the exact Cloudflare permissions each one wants are listed
in the workflow's own header. Prefer the push: CI holds the token with DNS:Edit.

## a preview Worker per PR

[`preview.yml`](../.github/workflows/preview.yml) gives every PR that touches
the site, the docs or either wrangler config its own Worker at
`https://hausfold-pr-<number>.<subdomain>.workers.dev`, and comments the link —
edited in place, so a push updates the link rather than adding another. Closing
the PR deletes the Worker.

[`wrangler.preview.toml`](../wrangler.preview.toml) is the real config with
`routes` dropped and `workers_dev = true` added, so a preview can never take the
hausfold.co hostname and no DNS permission is exercised. A guard step fails the
job if a route reappears there — treat it as accident-prevention, not a security
boundary, since a same-repo PR edits the workflow too. The boundary is the fork
check: GitHub withholds secrets from forks, and both jobs test the head repo
explicitly.

Two things to know. The preview URL is **public and unauthenticated**, so a
draft on a PR branch is a draft on the internet (as is the branch — this repo is
public). And a preview green-lights nothing; it just lets you look at the page on
a real origin, from a phone or someone else's eyes.

## why `custom_domain` and not a route

The `hausfold.co` zone had no DNS records at all. A plain Workers route
(`hausfold.co/*`) needs a proxied record to already exist for the hostname;
`custom_domain = true` makes wrangler create and proxy it. That is the whole
reason the deploy token needs **Zone → DNS:Edit** and not just Workers scopes.

## watch out

**Always Use HTTPS is on** for this zone, so `http://hausfold.co/` 301s to
`https://` (same for `www.`). That's a dashboard setting (SSL/TLS → Edge
Certificates), not something this repo carries — if the redirect ever
disappears, look there, not here.

**Every page URL and every asset under `public/` is un-hashed.** `/`,
`/docs/haus/desktops/hacker` and `/favicon.svg` keep their URL when their
contents change, so an edge cache can keep serving the old copy after a deploy. Next's
own `/_next/static/*` bundles are content-hashed and cached for a year by
`_headers` — they're the exception. The worst case is a page held in cache while
the hashed bundle it asks for has already been renamed: that reads as broken
rather than merely old. The workflow's purge step is the answer; without
`CLOUDFLARE_ZONE_ID` set it warns, skips, and your change lands whenever the
edge feels like it.

**`not_found_handling = "404-page"`** serves a real 404 for anything unknown. It
was `single-page-application` — *every* path answering 200 with the landing page
— which was right while the site was one sheet and wrong the moment
`/desktops/pounce` became a plausible typo. Directory pages still resolve with
and without the trailing slash (the slashed form is where the 307 lands), which
is why every page carries a canonical tag.
