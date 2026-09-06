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

## the Worker's own secret

One secret lives on the Worker rather than in the repo: `WEB_BOT_AUTH_KEY`, the
Ed25519 key [`worker-sign.js`](../worker-sign.js) signs the Worker's outbound
GitHub requests with (Web Bot Auth), and whose public half is served at
`/.well-known/http-message-signatures-directory`. Mint and set it once, from a
checkout, and it survives every deploy after:

```sh
node scripts/web-bot-auth-key.mjs | npx wrangler secret put WEB_BOT_AUTH_KEY
```

The same command rotates it; the key is stamped with a one-year `exp`, and the
script prints the date. Without the secret the site still works, the directory
is empty, and the deploy's smoke test warns. `npx wrangler dev` has no secrets
either; `node scripts/web-bot-auth-key.mjs --dev-vars` writes a local key into
the gitignored `.dev.vars` for that loop.

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

## the DNS-AID records

Two SVCB records under `_agents.hausfold.co` let an agent find the MCP server
through DNS alone (DNS-AID, `draft-mozleywilliams-dnsop-dnsaid-02`):
`_index._agents` points at the ARD catalog, `_mcp._agents` at the MCP server.
They are the one part of the machine-facing surface that a deploy does not
carry, so they have a workflow of their own.

The table is [`scripts/dns-aid.mjs`](../scripts/dns-aid.mjs), derived from
`MCP_TRANSPORTS` in `worker-config.js`. [`dns.yml`](../.github/workflows/dns.yml)
converges the zone on it when either file changes on `main`: create, update
and delete, **under `_agents.hausfold.co` and nowhere else**. A record added
there by hand is removed on the next push; that is the contract, so the zone
cannot disagree with the repo. A Monday cron runs the read-only comparison and
goes red on drift.

```sh
node scripts/dns-aid.mjs --print     # the records, zone-file form, offline
node scripts/dns-aid.mjs --verify    # what 1.1.1.1 answers, and whether AD is set
node scripts/dns-aid.mjs --check     # the zone against the table (needs the token)
```

The push path uses the same `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ZONE_ID`
as the deploy; DNS:Edit covers the records. **DNSSEC is a zone setting**, so
the script only touches it when asked (`--dnssec`, which `dns.yml` passes:
that flag is the decision to sign the zone, and it comes out of the workflow
before a registrar transfer). The API call needs Zone → Zone Settings → Edit,
which the deploy token was not minted with; the script warns and skips that
half rather than failing the records. Enable it once in the dashboard (DNS →
Settings → Enable DNSSEC) or add the permission and re-run the workflow.
hausfold.co is registered with Cloudflare Registrar, which adds the DS record
at the registry itself, so there is no second step. `--verify` reports the DS
and the AD flag, which is what isitagentready.com's `dnsAid` check reads.

Right after a first publish a resolver may still answer NXDOMAIN for up to 30
minutes: the zone's negative TTL. The push path's verify step warns rather than
fails for that reason; re-run the workflow or wait for the Monday check.

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
