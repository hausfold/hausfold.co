# AGENTS.md

**hausfold.co** — Next 16 + Fumadocs, `output: 'export'`, static, behind a
Cloudflare Worker. [`README.md`](./README.md) and [`docs/`](./docs) say how it is
built, run and deployed; this file says what you may change, for every agent.
Per-client wiring is [`.agents/README.md`](./.agents/README.md).

**This repo is public. Nothing private is ever committed here** — no name
register, no account facts, no "temporarily" pasted ids. Branches and preview
URLs are public too.

## Positioning

- **hausfold is the org and the publisher; `haus` is one thing it makes** — the
  nix-darwin layer a user writes `haus.*` options for. `hacker` is one desktop
  built on it.
- **hausfold sells nothing, ever**: no price, no checkout, no `/refunds`.
  `/terms` is no-warranty terms of use for a free API, never sales terms.
- Say **desktop**, not "rice", in user-facing copy; keep "rice" only in
  quotations, URLs, filenames and code identifiers.
- **Never call haus "opinionated" in platform-level copy.** A desktop (`hacker`,
  `everyday`, `minimal`) is, and `desktops/hacker`'s description says so; the
  layer is not. Name the macOS pain instead: *the settings you always change by
  hand*. `/`'s hero closes **"Nothing by hand, and open all the way down."**

## Where does it go?

| Want to change… | Where |
|---|---|
| the landing page | `src/app/page.tsx` |
| what the site says about **haus** | `content/docs/haus/index.mdx`. No `/haus` sheet; it 301s to `/docs/haus/` |
| the **room catalogue** — which rooms there are, and which `haus.*` name belongs to which | `content/docs/haus/rooms/index.mdx`, the one room list. Cards, namespace table and the `---Rooms---` group are all held to haus's registry by `scripts/check-rooms.mjs`; `index.mdx`'s `## What's in the box` is prose and a link to it, never a second list |
| a **desktop's own page** | `content/docs/haus/desktops/<name>.mdx`. No catalogue: `index.mdx`'s `## Desktops` is three sentences and a link to [`desktops/choosing`](content/docs/haus/desktops/choosing.mdx), where `/desktops` 301s |
| **the docs** (`/docs/*`) | `content/docs/`, Fumadocs MDX. No `/docs` page; it 301s to `/docs/haus/` |
| the install one-liner — URLs, the desktop table, the ref pinning | `worker.js`. `curl -fsSL https://hausfold.co/haus.sh \| bash` asks which desktop; `/hacker.sh`, `/everyday.sh`, `/minimal.sh` answer by URL. **A desktop is a row in `DESKTOPS`, not a new route** |
| the install *script* (`bootstrap.sh`) | `hausfold/haus` — the Worker proxies it and pins the ref |
| the **skill agents install** (`npx skills add hausfold/hausfold.co`) | `skills/haus-install/SKILL.md`, with `skills.sh.json` and `plugin.json` at the root; all three describe the same three capabilities and move together |
| the **layer** — any `haus.*` option, the rooms, the `haus` CLI | `hausfold/haus` (`./haus` in the workshop; `./hausfold.co` is this repo) |
| a product's **code** (pounce, perch, nebelung, scruff, trill) | its repo under `github.com/hausfold` |
| a product's **documentation** | **here** — pounce, perch, trill and scruff each have a tree beside `haus`. The product's repo owns the *fact*; this is the manual written against it |
| the **DNS-AID records** (`_index._agents`, `_mcp._agents`) | `scripts/dns-aid.mjs`, the table `dns.yml` publishes to the Cloudflare zone. Never the dashboard: a hand-added record under `_agents` is deleted on the next push |
| the **OpenAI app listing** — the starter prompts, the test cases, one tool-annotation justification per flag, the release notes, the demo video | `scripts/submit-openai-app.sh`, a wizard that paces the whole submission through the clipboard one field at a time. Its arrays are written against `MCP_TOOLS`, and `test/submission.test.js` holds them there: a fourth tool means three more justifications, a positive case that reaches it and a probe in `check`, **and each justification must state the hint the server actually reports**. `submit-openai-app.sh check` probes the live server, which no test can do |
| a **logo, a banner, the colours** | the workshop: `assets/README.md` is the media kit, `docs/design.md` the standard. The site hands them out as `/brand` (a `public/_redirects` 301, the file's one off-site target) and `/design.md` (a Worker proxy). Neither is a page here |
| a handle, an account, a claimed namespace | `PRESENCE.md` in the private [`hausfold/ops`](https://github.com/hausfold/ops), never here |
| a family-wide standard (agent surface, issue forms, drift catalogue, visual system) | `docs/` in the workshop |
| the launch plan, anything undecided | `todo/` in [`hausfold/ops`](https://github.com/hausfold/ops) |

**A published `curl \| bash` URL is the last thing on this site that may ever
404.** `worker.js` serves `bootstrap.sh` from haus's latest *release tag*: don't
yank a release, supersede it. `?ref=` is an unpublished escape hatch.

## The landing pages

Every page is a Next route; `public/` is assets only.

| Route | Source | The rule that isn't obvious |
|---|---|---|
| `/` | `src/app/page.tsx` | **the house's door and nothing else**: masthead (no nav; the colophon carries the GitHub link), three lines about **hausfold the org**, and `#made` (`What we make`: haus, pounce, perch, trill, scruff, nebelung, in that order). Its intro is **the site's only statement that everything is free and open source** — keep it. Carries the JSON-LD graph (Organization + FAQPage, shared with `/index.jsonld` and `/schema.jsonl` through `src/lib/jsonld.ts`). Anything about *haus* belongs in `/docs/haus` |
| `/developers` | `src/app/developers/page.tsx` | the machine surface in prose, every fact read off `worker.js` and `openapi.json`. `developersGraph` is a `TechArticle` over four `WebAPI` nodes ("hausfold REST API", "hausfold MCP server", "hausfold A2A agent", "hausfold OpenAPI spec"), embedded as the whole **graph** — the `@id` stubs resolve to nothing alone. Its `<title>` names the resources, not the `x · hausfold` shape; `developersPageMeta` feeds head and JSON-LD both, so `src/app/schema.jsonl/route.ts` has no `/developers/` row |
| `/about`, `/contact`, `/privacy`, `/terms` | `src/app/{about,contact,privacy,terms}/page.tsx` | trust pages: who, where mail goes (`julien@`), what the site collects (nothing), the API's terms (as-is, no warranty, 600 requests a minute). Each points outward; none carries a product claim |
| `/perch/privacy` | `src/app/perch/privacy/page.tsx` | **Linked from the App Store — never move or rename this URL**, and never merge it with `/privacy`. The one page with its own layout, `privacy.module.css`; `/perch` 301s to `/docs/perch/` and this URL is deliberately not swept up |
| `404` | `src/app/not-found.tsx` | the export always writes `out/404.html` from this, over any same-named file in `public/` |
| `sitemap.xml` | `src/app/sitemap.ts` | from the page table, trailing slashes, no `lastmod` — the export must stay byte-reproducible |
| `/docs/*` | `content/docs/` | see [The docs](#the-docs) |

- **`#made` on `/` is load-bearing**: the two `/refunds` 301s land there.
  `#desktops` does not exist; its callers point at `desktops/choosing`.
- **A page a docs tree also covers never stays in step with it.** `/pounce`, the
  three `/desktops/<name>` sheets, `/perch` and `/haus` are 301s onto docs trees.
  **Nothing on this site argues for a product, or the layer, outside the docs.**
- Never write down how many landing routes there are: "every `.sheet` route".
- **A page that forgets `pageMetadata` has no canonical and no `og:` tags.**

| Shared thing | Where |
|---|---|
| canonical, the six `og:` tags, `twitter:card` | `src/lib/page-meta.ts`, once per page |
| both `theme-color`s, both `<link rel=icon>`, `og:site_name`/`type`/`locale` | `src/app/layout.tsx`, every route |
| the colophon and its GitHub mark | `src/components/sheet.tsx` |
| a fenced command with its copy button | `src/components/command.tsx` |

### Short domains

`perch.hausfold.co` is the only one: a 301 to `/docs/perch/install/`. **A short
domain is a 301 and never a page.** The table is `SHORT_DOMAINS` in `worker.js`,
the route one line in `wrangler.toml`; every path but `/` 301s to the same path
on hausfold.co.

**`run_worker_first = true` in `wrangler.toml` must be `true`, never an array.**
Without it the assets binding answers `perch.hausfold.co/` with `out/index.html`
and `worker.js` never runs; an array is an allowlist, and `["/"]` 404s
`/haus.sh`, `/hacker.sh`, `/minimal.sh`, `/everyday.sh`, `/download/*` and
`/api/release/*` at once. `npm test` passes under either value (it calls
`worker.fetch` directly); the guard is a grep in `worker.yml` over both wrangler
configs. Don't delete it as a duplicate of the deploy smoke check, which
Cloudflare's managed challenge makes unreliable.

## `public/`

| File | What it is |
|---|---|
| `_redirects` | static redirects, **exact paths only**, evaluated **ahead of the assets** — adding a page back under a redirected path means deleting its lines in the same commit. Never a `/desktops/*` wildcard. `/brand` is the one off-site target, so a link to it is a plain `<a>` |
| `favicon.svg` | the mark on a dark tile, swept through all six accents; the fan is generated by `scripts/sync-nebelung.mjs`. **The one thing here that holds colour with no hover** |
| `favicon.ico` | the same mark, monochrome, for Safari — `--ink` on crust, same script |
| `robots.txt` | open by default, named AI-crawler tiers on top; CCBot and Bytespider get `Disallow: /`; the `Sitemap:`, NLWeb `schemamap:` and ARD `Agentmap:` lines; a `Content-Signal:` line in every Allow group, all three `yes`. **One line per Allow group, not one for the file** |
| `.well-known/ard.json` | the ARD catalog: the two MCP servers, the A2A card, the OpenAPI spec, the Agent Plugin manifest (`plugin.json` on GitHub — not `/mcp.json` or `/.well-known/mcp.json`, which it does not list) and the `haus-install` skill. **One catalog, advertised three of the ways [ARD](https://agenticresourcediscovery.org/spec/) defines**: this path, `Agentmap:` in `robots.txt`, and `icons.other` in `src/app/layout.tsx` (Next's only route to an arbitrary `<link rel>` in the head). The `_index._agents` record in `scripts/dns-aid.mjs` names it as well (DNS-AID's spelling, not ARD's `_entries`), so **a rename of this file is an edit in all four places**. Every entry needs `identifier`, `displayName`, `type` and a `url` (ARD §4.2) — **a consumer drops an entry missing one rather than the field, so the count quietly falls** — and the `identifier` is the domain-anchored `urn:air:hausfold.co:<namespace>:<name>`; and `test/agent-surface.test.js` holds the robots line, the head link and the `/developers` copy to this one path |
| `.well-known/agent-skills/` | three `SKILL.md` skills plus `index.json`, **generated** at build by `scripts/gen-agent-skills.mjs`; a hand edit desynchronises the digests |
| `openapi.json` | the OpenAPI 3.1 description, pinned to the Worker's routes by `test/openapi.test.js` |
| `_headers` | a `Content-Type` for `/api/search`, `/auth.md` and `/schema.jsonl`; a year of cache for `/_next/static/*` |
| `schemamap.xml` | the NLWeb Schema Map; a second structured-data feed gets a `<url>` row in the same commit |
| `hausfold.css` | tokens, type, link styles, the vendored nebelung block, and **the design record in its header comment** — the palette, type and layout decisions in full. Nothing links the file: it arrives through `src/app/global.css`'s `@import`, so `/hausfold.css` is a dead URL |

**The dark theme's nebelung values are generated, not typed** — vendored from
`dist/css/nebelung-mocha.css`, read as `var(--nebelung-*)`.
`node scripts/sync-nebelung.mjs` refreshes, `--check` runs in `palette.yml`, and
the ref is `PIN`, so drift is pulled with `--latest`. Output is committed;
`deploy.yml` does not fire on `scripts/**`. What `--check` guards beyond colour
— decoded-pixel `favicon.ico` comparison, and the two-hyphen rule in
`favicon.svg`'s comment that silently blanks the icon — is
[`docs/development.md`](docs/development.md#what-ci-checks).

## The skills.sh listing

`skills/haus-install/SKILL.md` is the one skill this repo publishes;
`npx skills add hausfold/hausfold.co` works off `main`. `skills/` and
`skills.sh.json` are not site content; a change deploys nothing.

- **Merging does not publish the listing.** skills.sh indexes a repo only after
  one install reports it, so install it once if it never shows up. The URL is
  `owner/repo/skill`: [`skills.sh/hausfold/hausfold.co/haus-install`](https://skills.sh/hausfold/hausfold.co/haus-install).
  A 404 on `skills.sh/hausfold/hausfold.co` means "never installed".
- **The skill is `haus-install`, not `hausfold`** — haus owns `hausfold`
  (`~/.claude/skills/hausfold`, edited in `hausfold/haus`) and `haus`.
  `plugin.json` keeps `"name": "hausfold"`, a different namespace.
- `skills.sh.json` is display only, and an edit lands late.

## Rules that are easy to break by accident

The reasoning behind the visual ones is [`docs/design.md`](docs/design.md); these
are the lines you can cross without noticing.

- **No em dashes in reader-facing copy, anywhere**: landing pages, docs prose,
  frontmatter descriptions, `<title>`s and `og:` titles (the separator is `·`).
  Use a period, colon, semicolon, comma or parentheses; never a bare hyphen.
  Carve-outs: code comments, this file, and `reference/options.mdx`.
- **The contact address is `julien@hausfold.co`** — never `support@` (does not
  exist) or `hi@`. Eight places carry it and move together: the colophon
  (`src/components/sheet.tsx`), `/perch/privacy`, the `Organization` JSON-LD
  (`src/lib/jsonld.ts`), `info.contact` in `public/openapi.json`, `worker.js`'s
  agent view, `/about`, `/contact`, `/privacy`. Grep before editing one.
- **Greyscale at rest on the landing pages, and every colour is borrowed.** The
  six `--a-*` are the whole vocabulary; nothing invents a seventh. Dark accents
  **are** nebelung (`--a-pounce` is `var(--nebelung-peach)`), light ones are
  hand-picked, and `--check` fails on a `--nebelung-*` reference outside the two
  dark blocks. Four exceptions: a product's name and the `⌂` mark's six stripes,
  both on hover; the favicon (`favicon.ico` stays out); and code, Shiki-highlighted
  with `--nb-token-*`, inline `<code>` included. The landing half's dark code fork
  is not in the tree — a tombstone in `src/app/global.css` says how to write it,
  and a landing page with a fenced block owes it.
- **A desktop is not a product and gets no accent**: none is named on a landing
  page, and no `desktops/<name>` page carries `accent:`. Product hues are the
  workshop's `docs/design.md`. scruff's is the rose `maroon`, not nebelung's
  `pink`, which `hacker` holds and `--color-fd-error` spends.
- **No motion, one exception**: the mark's sheen turns on hover over 0.7s;
  `prefers-reduced-motion` keeps the colour and drops the turn. A new
  `@keyframes` needs the same bar; a scroll-snap point is not an animation.
- **Almost no JavaScript of our own, none load-bearing.** `<Provider>` lives in
  `src/app/docs/layout.tsx`, not the root layout, and that placement is
  load-bearing: at the root every landing page got the search context, ⌘K and a
  lazy ~457 KB Orama fetch. **Don't move it back up**; give a component that asks
  its own boundary. The landing half ships one, `WebMcpTools` (root layout;
  renders null unless `document.modelContext` exists), **and no more**. The bar
  for another is pure enhancement — the copy button rendered `hidden` and unhid
  only where `navigator.clipboard` exists. **Nothing waits in the tree for a
  caller**: no unused component, no orphaned `.cmd` styles.
- **No screenshots, and never a stale one**, and **no `og:image`** — both
  decisions, not gaps; a validator's flag is not a bug. A landing page that ever
  holds an image needs `images: { unoptimized: true }` in `next.config.mjs`. The
  scene and its disqualifiers are the workshop's `assets/SHOTLIST.md` slot-2
  cell.
- **The column leans LEFT and the measure is 41rem**, off an implied `--page-max`
  of 78rem; `--measure` caps text blocks at 58/62ch and side padding changes in
  `--gutter`, never `.sheet`. Two that break silently: **`100cqw`, not `100vw`**
  in `--sheet-inset` (`max(0px, (100cqw - var(--page-max)) / 2)`), because
  `scrollbar-gutter: stable` leaves `100vw` ~7.5px proud — the container is on
  `body:has(.sheet)`, which `/docs` cannot have, since `container-type` implies
  layout containment and `/docs` portals fumadocs' chrome to `<body>`; and
  **`.sheet` carries `width: 100%`** beside `max-width`, because a flex item with
  an `auto` cross-axis margin is not stretched (`min-width: 0` is not the fix).
  `/perch/privacy`'s `privacy.module.css` wins on source order and must not
  restate `margin` or `width`. Text inside stays left-aligned: **the column
  leans, the paragraph does not**, and nothing here is ever set ragged-left.
- **Nothing scrolls sideways.** A horizontal scroller owes `tabIndex={0}`, a
  label and a focus ring (WCAG 2.1.1; Safari won't focus one on its own). A
  gallery may hide its end; a catalogue a reader compares may not.
- **Both themes, every time.** Tokens on `:root`, redefined under
  `@media (prefers-color-scheme: dark)` and `:root[data-theme=…]`; style through
  the tokens, never inside the media query. Only `/docs` has a toggle; the fork
  is in `public/hausfold.css`, shared by both halves.
- **The canonical tag is load-bearing**: apex and `www.` both serve, and every
  directory page answers with and without its trailing slash, so without
  `<link rel="canonical">` each page exists at several URLs.
- **`theme-color` duplicates `--ground`** in `src/lib/shared.ts` — with
  `favicon.svg`'s tile, the only hand-typed palette outside `hausfold.css`.
- **No prices, anywhere.** The free-and-open-source line is said once, in
  `What we make`.
- **Links go inward** the day the inward page exists (`nebelung` still points
  out). Internal is `<Link>` from `next/link`, external a plain `<a>`
  (`eslint-config-next`); `typedRoutes` is off, so **a `<Link>` to a dead route
  passes `build`, `types:check` and `lint`**. `trailingSlash: true` renders
  `/haus/`. **A `worker.js` route is internal but not a Next route**:
  `/download/<app>`, `/hacker.sh`, `/api/release/<app>` take a plain `<a>`; in
  MDX, `a: createRelativeLink(source, page)` turns every internal-looking href
  into fumadocs' Link, so write the **absolute** URL there.
- **Sweep a spelling everywhere or not at all.** A redirect SOURCE in
  `public/_redirects` is never swept; only the destination follows a rename.

## The machine-facing routes

Pinned in `public/openapi.json`, described at `/developers`. The drift rules:

| Route | What serves it | Kept true by |
|---|---|---|
| `?mode=agent` on `/`, `/index.md`, `/agent.txt`, `Accept: text/markdown`, AI-bot User-Agents | `worker.js`'s agent view: one markdown page of endpoints, auth (none), when-to-use | built from `DESKTOPS`/`DOWNLOADABLE`; a new row needs no second edit |
| `/docs/<path>.md` | the markdown twin, proxied from the built `/llms.mdx` files | byte-for-byte; advertising it (`page-meta.ts`, docs `generateMetadata`, a `Link:` header) means the twin answers |
| `/llms.md` | the `/llms.txt` body as `text/markdown` | no second copy |
| `/.well-known/mcp`, `/mcp/server-card`, `/.well-known/mcp/server-card.json` | the MCP endpoint and its SEP-2127 Server Card | one card, `serveMcpCard()`, at both spellings: `tools` is `MCP_TOOLS` verbatim, `name`/`version` are `serverInfo`'s |
| `/mcp.json`, `/.well-known/mcp.json` | the two MCP manifests, in two shapes | **Not aliases, and `/.well-known/mcp.json` is not `/.well-known/mcp`.** The root one is the agent-plugins.org `mcpServers` map; the well-known one is flat (`url` + `transport`, `servers`, `MCP_TOOLS`) and cites no schema, because none is registered. Both read `MCP_TRANSPORTS`, as do the card and `initialize`'s instructions. `/.well-known/mcp` is the **transport**: GET there is the 405 Streamable HTTP requires, held by `test/agent-surface.test.js` |
| `/agent.txt` | the agent view at the spelling probes look under | byte-for-byte `AGENT_VIEW`, `text/plain`. **One document, every spelling** — new prose goes in `AGENT_VIEW`; never write down how many spellings there are |
| `/.well-known/http-message-signatures-directory` | `worker-sign.js`, derived per request from the `WEB_BOT_AUTH_KEY` Worker secret | **The key is a secret, never a file here.** The same module signs **every outbound fetch** (`Signature-Agent: "https://hausfold.co"`, `Signature-Input` over `@authority` and `signature-agent`, `tag="web-bot-auth"`), so a bare `fetch(` in `worker.js` is a bug; `signedFetch` degrades to plain `fetch` with no key, which is what a preview Worker and `wrangler dev` get (`--dev-vars` on the mint script gives the local loop one). `test/bot-auth.test.js` verifies real Ed25519 both ways and greps for `fetch(`. Mint or rotate: `node scripts/web-bot-auth-key.mjs \| npx wrangler secret put WEB_BOT_AUTH_KEY`, one-year `exp`. Registering with Cloudflare is a dashboard step |
| `/.well-known/oauth-authorization-server`, `/oauth/authorize`, `/oauth/token`, `/.well-known/jwks.json` | `AUTHORIZATION_SERVER` and `JWKS` in `worker-config.js`; `serveOAuthEndpoint()` | RFC 8414 metadata for an issuer that grants nothing: `grant_types_supported` and `response_types_supported` are empty, and the endpoints answer the protocol's refusal (400 problem+json, `unsupported_grant_type`, an empty key set) rather than 404ing. `test/agent-surface.test.js` pins that every URL the document names answers; `test/openapi.test.js` that each has a spec path. **Two tidy-ups that are wrong**: putting the issuer in the protected-resource document's `authorization_servers` (RFC 9728 means servers a client CAN use, and this one issues nothing), and adding `/.well-known/openid-configuration` (this host signs no identity) |
| `/.well-known/openai-apps-challenge` | `OPENAI_APPS_CHALLENGE` in `worker-config.js`, served bare by `worker.js` | Proof of control for OpenAI's app portal, which fetches it before it will list `/mcp` and re-checks it after, so **the token stays once the verification passes** — removing it unverifies the listing. Public by design and not a credential: it grants nothing, which is why it sits in the table beside the other discovery documents instead of in a Worker secret. Served with **no trailing newline** — the checker compares the body to the string it minted. `test/agent-surface.test.js` pins both halves, and `deploy.yml` re-fetches it at the edge — the one failure `npm test` cannot see is the listing quietly unverifying. **Deliberately absent from `public/openapi.json` and `/developers`**, unlike every other row here: this is one vendor's handshake, not a document an agent uses. The submission the token unlocks is `scripts/submit-openai-app.sh`, whose `check` step compares this URL against `OPENAI_APPS_CHALLENGE` byte for byte, trailing newline included, before you record anything |
| `/.well-known/agent-card.json`, `/a2a` | the A2A card and the JSON-RPC interface it names, `worker.js` (`serveAgentCard()`, `serveA2a()`) | one table, `A2A_SKILLS` in `worker-config.js`: the card's `skills` are its rows less `tool`, and `/a2a` dispatches `SendMessage` on the same rows. `test/agent-surface.test.js` holds the skill set to `MCP_TOOLS` one-to-one — **a fourth tool means a fourth row there, in the same commit** — and pins the wire shape: A2A 1.0, `supportedInterfaces` naming `/a2a` as `JSONRPC`, every reply a `Message` and never a `Task`. Never a static file in `public/`: the Worker route shadows it and the two drift |
| `/.well-known/ai-catalog.json` | `serveAiCatalog()`, re-serving the `public/.well-known/ard.json` asset | **The ARD catalog at the name ARD renamed away from.** The spec moved the path to `/.well-known/ard.json` and the relation from `ai-catalog` to `ard` before 1.0, and says a publisher serving the new path alone is discoverable by every conformant consumer, so this is compatibility and not a second document: it reads the asset through `env.ASSETS` rather than copying it, answers `Link: </.well-known/ard.json>; rel="canonical"`, and 502s `upstream_unavailable` rather than falling through to the 404 page. The head carries both relations for the same reason. **Delete the route, the `ai-catalog` line in `src/app/layout.tsx` and this row together** the day nothing probes the old name; today `isitagentready.com` probes only it |
| `/.well-known/agent-skills/index.json`, `/.well-known/api-catalog` | static JSON + one Worker route | `test/worker.test.js` covers the routes; the skills index is build-generated. **`test/openapi.test.js` does not pin these two** the way it pins the installers, `/v1` and the A2A pair |
| `/sitemap.xml`, `/schema.jsonl`, `/index.jsonld` | build-time routes (`src/app/sitemap.ts`, `schema.jsonl`, `index.jsonld`) | generated from the page table / `src/lib/jsonld.ts`, never hand-typed |
| `_index._agents.hausfold.co`, `_mcp._agents.hausfold.co` (DNS, not HTTP) | two SVCB records per DNS-AID (`draft-mozleywilliams-dnsop-dnsaid-02`): the index points at `/.well-known/ard.json`, the MCP one at the transport in `MCP_TRANSPORTS`, its server card the capability document | `scripts/dns-aid.mjs` is the table and `dns.yml` converges the zone on it, so **the zone is a mirror**. `test/dns-aid.test.js` holds every path a record names to a document the site answers, and pins that the plan never reaches a name outside `_agents.hausfold.co`. The draft's `cap` and `well-known` keys ride as `key65400` / `key65409` (RFC 9460 private-use); `KEY` in the script is the one place to change when IANA assigns code points. A `well-known` value is a suffix under `/.well-known/` on the record's own target, never a full path. DNSSEC needs Zone Settings:Edit, which the deploy token lacks |

### Markdown content negotiation

`Accept: text/markdown` is answered on `/` (the agent view) and on every docs
page (its twin, at the page's own URL); bots keep their User-Agent route and
`.md` stays the explicit spelling. **Every** HTML response carries
`Vary: Accept, User-Agent, Accept-Encoding`; markdown served at an HTML URL is
`no-store`, because Cloudflare ignores most `Vary`.

- **q-values are parsed as numbers**, so `text/markdown;q=0.9, text/html;q=0.8`
  gets markdown. The cases are a table in `test/worker.test.js`; add a row.
- **A HEAD answers with the GET's headers** (`curl -sI` is what a readiness
  scanner runs): `finishAssetResponse()` builds one answer for both methods, and
  every route the Worker *writes* (`/index.md`, `/agent.txt`, `/llms.md`,
  `/design.md`, the twins, `/ask`, `/v1/*`) already does.
  `test/agent-surface.test.js` pins HEAD on three of the discovery documents;
  nothing pins the rest.
- **A wildcard never selects markdown and never out-votes a named type.** `*/*`
  keeps getting the page; `text/html` or `text/*` set the bar; a tie goes to
  markdown.
- **406 is for a client that can read none of a URL's representations.** Every
  `.sheet` route except `/` is HTML only, so `Accept: text/markdown` there is
  `406 problem+json` naming where markdown lives. The honest fix is a markdown
  representation, not the 406.

## The docs

[Fumadocs](https://fumadocs.dev) on Next, `output: 'export'`. Content is MDX in
`content/docs/`; `src/` is a thin shell.

### The trees, five of them

`content/docs/{haus,pounce,perch,trill,scruff}/` are **root folders**
(`"root": true` in their `meta.json`): the switcher at the head of the sidebar.
**`haus` is the layer; the rest are apps that run on it, and without it.** A page
you can't place is usually two pages.

**Adding a tab is a positioning change.** The test: **can a stranger install this
without haus?** pounce is one `brew install`; perch is
`brew install --cask hausfold/tap/perch`; scruff is one `nix run` or
`go install`. nebelung and a desktop do not clear it.

**`trill` is a tab admitted WITHOUT clearing that bar**, on the user's explicit
instruction — an exception, not a precedent. Its tree is **one page**, opening
with a `warn` callout: notarized releases exist, no cask, no one-line install,
and `haus.notifications.compositor` is the only front door (`haus.trill.enable`
is an older name nothing aliases; a config carrying it does not evaluate).
**Don't grow the tree past that page** — whether the tab clears the bar is the
user's call, unmade. Keeping the callout accurate is a correction.

**A new tree owes four things**: an entry in `content/docs/meta.json`'s `pages`;
its own `meta.json` with `"root": true`; a **hued** icon in `src/lib/icons.tsx`;
and a `body:has([data-tree='<name>'])` rule in `src/app/global.css` naming one of
the six `--a-*`. Miss the last and the tree renders in `--ink`, silently.

### Docs voice

- **Verify, consolidate, simplify, consumerize.** Out: maintainer reasoning, our
  own detail, anything one click away. In: the sentences that took work, every
  fact a reader acts on, the warnings. **Verify each fact against the source
  repo**, not another page.
- **Write for a first-comer, and hold them**: a lede a stranger can finish, then
  the detail, then a way onward — the frontmatter's `related:` block, never a bare
  "see also" in the prose. **No page ends without a door out of it.**
- **Behavior a reader would already expect gets zero words.** An edit leaves its
  page shorter unless it adds a fact a reader acts on, or a warning.
- No em dashes in prose. Sentence case in headings. "desktop", never "rice".
  Never "opinionated" of haus.
- **Never put a count of the rooms on a page**, and never hand-maintain a second
  room list. `content/docs/haus/rooms/index.mdx` is the catalogue: its cards, its
  namespace table and the `---Rooms---` group in `meta.json` are all held to
  haus's registry by `scripts/check-rooms.mjs`, which also fails when a room haus
  publishes has no page here. The group is one row per room plus the catalogue
  at its head; a page *about* rooms goes in `---Build on it---`, and a shared
  surface (`rooms/keys`) goes in `---Reference---`. A count is still
  forbidden because nothing checks prose.
- **A room page documents the room** — the haus wiring, the options, what turns
  on. The app itself lives in its own tree.
- **A room page's spine**: the enable block up top where there is a switch, and
  `## Options` last. Works with / Permissions / Remove it fold into the prose; a
  standing section survives only where its caveat has no natural home — a
  permission the reader must grant, a removal that does not uninstall. The
  frontmatter's `related:` does the cross-linking.

### Cutting a page

The haus tree has been through a pass that cut it toward a third of its words,
page by page. These are the rules that pass paid for, and they bind the next edit
as much as they bound that one.

- **The keep rules beat any word count.** Every command, path, option name,
  number, keybind and real caveat stays, and a target you cannot reach without
  evicting one of them was the wrong target. What goes instead: how a standard
  thing works, history, a sentence that would sit just as well in another tree's
  docs, the same fact twice, a section that exists because the template had one.
- **Measure the skeleton before you trust a target.** `wc -w` counts frontmatter,
  fenced code and every table pipe, so a page whose skeleton is most of its words
  has a floor well above a third. Reset the number to the floor; never evict a
  fact to reach the number.
- **`reference/options.mdx` is the biggest lever, and it reaches only a page with
  an `## Options` foot.** A fact the reference carries verbatim is not evicted
  when such a page drops it, because the link is right there at the bottom. A
  page earns that foot when the reader's next move is to go and set a `haus.*`
  option: every page in the Rooms group but `rooms/index`, plus `rooms/keys`,
  `rooms/bar-widgets`, `desktops/creating` and `desktops/customizing`, and
  nothing else in the tree. `rooms/index`, `rooms/creating` and `rooms/sharing`
  send a reader to a room or to somebody's flakeref, never to an option;
  `rooms/creating` links the reference inline instead (`creating.mdx:24`).
  `agent-rebuilds`, `night-shift` and `leaving` name options a reader does not
  leave to set, so they get no foot and the lever misses them; their floors are
  identifier density alone. Where such a page does send a reader to the
  reference, it links inline at the option name (`night-shift.mdx:44`).
- **The lever cannot reach a caveat the reference has no entry for**, and those
  are the ones worth their words. Of the four keys haus does not leave as soft
  defaults (`desktops/customizing.mdx:194`), two — `SLSMenuBarUseBlurredAppearance`
  and `power.sleep.computer` — appear nowhere in `reference/options.mdx`, while
  `_HIHideMenuBar` and `AppleInterfaceStyle` do. Grep the reference for the fact
  itself before you drop it on the lever's word.
- **A seam that closes for free beats a split, and gets measured first.** A fact
  another page already carries in full, where the link is already inside the
  sentence, leaves the tree smaller at no cost. A split only moves words and
  usually adds: a new page owes an entry in `meta.json`, an icon, a lede and a
  `related:` block.
- **A duplicated fact belongs to the page whose subject it is**, not the page it
  was written on first. The tell is prose that disqualifies its own host —
  `agent-rebuilds.mdx:101` calls its own paragraph "not an agent rule". Flipping
  the ownership means editing every "X has the detail" pointer in the same
  commit, and an identifier diff will not catch what the move drops, because what
  drops is prose.
- **A sentence that stops carrying its own context is not compression.** Name the
  noun — "drag a file", not "a drag" — and a keybind keeps the why that makes it
  readable, past the budget if that is the cost.
- **A table of identifiers is not automatically a keep.** A key table survives
  where the page's prose leans on it. A one-column table with a prose gloss is a
  list wearing a table's chrome, and it reads better folded into the prose — that
  is a prose judgement, not the component rule below, since `getLLMText` in
  `src/lib/source.ts` already carries a markdown table into `llms-full.txt`
  whole. A catalogue a reader compares across columns (`desktops/choosing`) stays
  a table, and splitting one of its rows is the honest fix when a single tick
  stopped meaning two things (`desktops/choosing.mdx:66`).
- **Diff the claims, not the identifiers.** Compression makes a page wrong more
  easily than it makes it terse: half of a two-sided caveat over-claims on its
  own. An identifier diff that comes back empty proves nothing about truth, and a
  pass that comes back with facts to restore is the pass working, even though it
  moves the count up.

### The generated page, and the one that is only pinned

`rooms/bar-widgets` is **written**; its two colour tables are *pinned* by
`scripts/check-bar-tables.mjs` to `modules/bar/{tones,marks}.nix`. The prose is
yours. Not yours: the rung **names** and **order** (quietest first); the first
column's header word, `tone` and `mark`; each being a plain markdown table.

`rooms/index` is **written** on the same terms, pinned by
`scripts/check-rooms.mjs` to `modules/options-groups.nix`. Yours: every card's
one-line gloss and the prose around it, because haus writes its blurbs for the
options reference and they point at that page's layout ("a shared surface
below"). Not yours: which rooms there are, their **titles**, their **order**,
each card's `href`, the namespaces in the `| Room |` table, or what sits in the
`---Rooms---` group. A room haus publishes with no page here is a failure, not a
gap to write up later.

`reference/options.mdx` is **rendered** by `scripts/gen-options.mjs` from haus's
committed `docs/site-data/`. Four things it alone may do:

| It does | Don't |
|---|---|
| sets `tableOfContents.maxHeadingLevel` in frontmatter (read in `src/app/docs/[[...slug]]/page.tsx`), one h4 per option | reach for the key on a hand-written page; too many headings is a page problem |
| emits an empty `<div className="hf-options" />`, which every rule under "the options reference" in `src/app/global.css` that restyles an ordinary element (`h4`, `h4 + p`, `small`) scopes to via `:has()` | style `.prose h4` globally. `.hf-optindex` and `.hf-more` are bare classes only this page emits, like `.hf-card` and `.hf-next` |
| prints a shared description once — `haus.bar.items.<pill>` and `haus.bar.bottom.items.<pill>` declare one text twice | special-case the bar; the rule is identical text over 240 characters |
| folds a long description after its first paragraph, behind `More detail` | read it as permission to cut; the text stays in the HTML, the search index, `llms-full.txt` and the Markdown |

**The prose on that page is haus's; this repo may not edit a word** — `--check`
re-renders and fails on a hand edit. Fix a description in its `.nix` declaration
in `hausfold/haus`.

### Colour and type

**The docs do not follow the landing pages' greyscale rule**: one hue per tree,
at rest — `/docs/haus` wears `--a-nebelung` (mauve), `/docs/pounce` `--a-pounce`
(peach), from `data-tree` on the page container, read by
`body:has([data-tree=…])` in `src/app/global.css`.

- **A page may override with `accent: <product>`** in frontmatter (one of the six
  in `src/lib/shared.ts`); that rule is written after the tree rules so it wins.
  **No page carries one today** — wanting it usually means two pages.
- **Four named steps**, declared once on `body`: `--accent`, `--accent-wash`
  (7%, fills), `--accent-line` (55% into the rule colour), `--accent-quiet` (50%
  into `--ink-3`, a glyph at rest). **Refuse an ad-hoc `color-mix()`** at the
  point of use; name a fifth step up there.
- **Colour orients; it doesn't decorate.** A use answering neither *where am I*
  nor *what is this* gets no hue. fumadocs' callout hues stay re-pointed at ours.
- **Motion is stopped**: `src/app/global.css` ends with a `prefers-reduced-motion`
  block holding fumadocs' ~20 `transition-colors`, handing back only the ⌂ mark's
  0.7s fade. **Code keeps nebelung's ramp** — Shiki emits `var(--nb-token-*)`.
- **Headings are the serif** (`--font-display`), **body is SF** (`--font-sans`),
  **chrome stays mono**; landing pages set New York throughout. Four rules spend
  `--font-display`: `h1`, `h2/h3/h4`, `body:has(.sheet)`, and a step's numeral
  (`.hf-step > :first-child::before`), which is the title's figure rather than
  chrome and is set explicitly because a step may open with a paragraph. **A
  landing page whose `<main>` is not a `.sheet` silently comes out in SF**, and
  **heading rules must exclude `.not-prose`** — a Card's title is an
  `<h3 class="not-prose text-sm">`, and a bare `.prose h3` puts the serif on a
  14px label.

### Icons, components, and the sidebar's missing list

`src/lib/icons.tsx` is the **whole** icon vocabulary; content says `icon: bar`,
never a Lucide name, and `loader({ icon })` in `src/lib/source.ts` resolves it.
`lucideIconsPlugin` is deliberately not used.

- Tree glyphs carry hues (`data-hue`, held even in the portalled switcher
  popover); page glyphs are tinted by their tree. **A new page owes an icon.**
  One exception: the three brand marks (GitHub, Anthropic, OpenAI) in
  `src/components/page-actions.tsx`, outside the table so frontmatter can't put
  GitHub's logo on a page. Removing an entry content names prints
  `[icons] unknown icon` at build rather than failing.
- `baseOptions()` in `src/lib/layout.shared.tsx` has **no `links` list**; putting
  one back is a positioning decision. The way back is the `⌂` in the nav.
- `src/components/mdx.tsx` registers Callout, Card/Cards, Step/Steps, Tab/Tabs,
  `Icon`, and nothing else. **A component the prose could have been hides the
  prose from search and from `llms-full.txt`.** Four are ours: **`Card`** wraps
  fumadocs' with `.hf-card`; **`Steps`/`Step`** (`src/components/steps.tsx`)
  are two bare divs, `.hf-steps`/`.hf-step`, so nothing in fumadocs' preset
  reaches a numeral; **`Separator`** (`src/components/sidebar-parts.tsx`)
  labels a sidebar group with `.hf-group` rather than `#nd-sidebar p`, because
  **a bare element selector inside fumadocs' chrome** hits three things; and
  **`ViewOptions`** (`src/components/page-actions.tsx`) **replaces** fumadocs'
  `ViewOptionsPopover` with four hardcoded destinations (Markdown, GitHub source,
  two assistants), because **the list is an endorsement**. It sits in `.hf-meta`
  above the title, before the `h1` in the DOM.
- **`<Steps>` numbers by CSS counter**, so a step reordered in the MDX renumbers
  itself and the numerals are not in the Markdown twin. It earns its tag where
  the ORDER is the point and the page would otherwise type numerals into its own
  headings; a set of things a reader picks from is a list. Three callers:
  [`haus/install`](content/docs/haus/install.mdx), whose steps open with a
  bold-led paragraph and no heading;
  [`perch/install`](content/docs/perch/install.mdx), whose anchors are plain
  heading slugs (`#the-phone-half`) — **a fragment never reaches the Worker, so
  `_redirects` cannot rescue an old one** — and
  [`haus/agent-rebuilds`](content/docs/haus/agent-rebuilds.mdx)'s rebuild loop,
  which nests under an `##` and so titles its steps `###`; those land in the ToC,
  and that is the cost of the tag on a page that is not itself the procedure.
  Three pieces, and each is load-bearing: the look is "an ordered procedure"
  in `src/app/global.css` — the numeral is the step's **first child's
  `::before`**, in `em` of that child and hung into a column on its baseline,
  so **a step opens with its title or a paragraph**, never a fence or a
  callout; it is punched out of the rail in `--ground`, so **`<Steps>` belongs
  at page level, not inside a callout or a card**; and
  `postprocess.includeProcessedMarkdown` in `src/lib/source.ts` unwraps both
  tags for the twin, **without which a step's body is a four-space-indented
  code block** to every Markdown reader. The figure, its column and the gutter
  are `cqi` clamps off `.hf-steps`, so a phone and a laptop get one design at
  two scales and there is no breakpoint of ours to keep in step with fumadocs'.

### Gotchas paid for already

- **This Next is newer than your training data.** Read
  `node_modules/next/dist/docs/` before assuming an API. `agentRules: false` in
  `next.config.mjs` stops `next dev` appending a block to `AGENTS.md`.
- **A markdown image is a build-time import** under Fumadocs, resolved relative
  to the content file; a missing asset is a hard build failure.
- **`themes`, not `theme`, in the Shiki config** — a `theme:` key leaves an empty
  `themes` beside it and every MDX file fails with `TypeError: Cannot convert
  undefined or null to object`. `src/lib/source.ts` has the working shape.
- A root folder's index page is not in `pageTree.children`; match on `node.$id`,
  not `node.index?.url`.
- A `display: contents` wrapper at the top of a route segment kills
  scroll-to-top. Put `data-tree` / `data-accent` on `DocsPage`'s own `<article>`.
- A child's `openGraph` **replaces** the parent's, dropping `og:site_name`,
  `og:type` and `og:locale`; `pageMetadata` spells all six out.
- Bare element selectors can't live in a page component; `/perch/privacy`'s are a
  CSS module scoped under `.policy`.
- "Is the API there?" is `useSyncExternalStore`, not `useEffect` + `setState`
  (`react-hooks/set-state-in-effect` fails the lint); `src/components/command.tsx`
  has the shape.
- `html { background: var(--ground) }` in `src/app/global.css` paints the canvas
  — `body:has(.sheet)`'s containment stops `body`'s reaching it, and the failure
  shows in **light** mode.

## Deploying

Pushing to `main` deploys — `deploy.yml` fires on `public/`, `content/`, `src/`,
`worker.js` or the build config and runs `npm ci && npm run build` first. **No
staging: main is the live site.** Look in a browser first, both themes. The
by-hand path, the preview Worker per PR and why the token needs DNS:Edit are
[`docs/deploying.md`](docs/deploying.md); what each workflow checks is
[`docs/development.md`](docs/development.md#what-ci-checks).

- Any page: `npm run dev`. **Every `next` invocation in `package.json` is
  prefixed `NEXT_TELEMETRY_DISABLED=1`, and that is load-bearing** — on exit
  `next dev` spawns a detached `telemetry/detached-flush.js` with its cwd in the
  checkout, and `scruff` reaps on an `lsof -d cwd` sweep, so one stuck flusher
  pins a merged lane.
- As deployed: `npm run build && npx wrangler dev` — exercises
  `not_found_handling`, `_headers`, `_redirects` and `worker.js`. `/desktops`
  301s to `/docs/haus/desktops/choosing/`, `/docs` and `/haus` to `/docs/haus/`,
  a made-up path 404s.
- `worker.js`: `npm test` (offline, ~1s), then `wrangler dev`, the only proof a
  request reaches the Worker: `curl -sI localhost:8787/hacker.sh` answers 200
  with an `x-hausfold-ref`, and `curl -sI localhost:8787/api/search` is still the
  built docs index.

Four things about CI that its own docs don't carry:

- **Don't loosen the two-cold-builds diff in `docs.yml`.** The step prints sizes
  and 320 bytes around the first difference. Its one catch: Shiki's
  500ms-per-line tokenising cap returning a line half-scanned, fixed by
  `tokenizeTimeLimit: 0` in `src/lib/source.ts`. **It is not a safety net for
  that class of bug** — it fires only when the two builds disagree, so two
  builds that both run slow degrade identically, pass, and deploy.
- **`worker.yml` also greps both wrangler configs** for the same `main`, the same
  `ASSETS` binding and `run_worker_first = true` — any of them missing from
  `wrangler.preview.toml` makes a broken installer look fine on the preview URL.
- **`deploy.yml`'s smoke test is last on purpose**, so a red smoke never skips
  the purge; it is an alarm, not a brake. A URL Cloudflare's managed challenge
  catches (`cf-mitigated: challenge`) warns and skips — a WAF rule skipping Bot
  Fight Mode for `x-hausfold-smoke` would fix it. `/download/<app>` and
  `/api/release/<app>` ask `api.github.com` cold, so a releases-page redirect or
  a 502 problem+json with `"code":"upstream_unavailable"` (never a bare `{}`) is
  the Worker writing the answer and warns after one retry; the signatures
  directory warns the same way with no key, a secret this workflow never sets.
  **Don't tighten that.** A persistent warn: the release ships no `-macos.*`
  artifact (that repo's problem), or `latestAppRelease`'s real fetch broke —
  `npm test` replaces `globalThis.fetch` wholesale, so this step is the only
  check that touches it. GitHub 403s a request sent without a `user-agent`, and
  `worker.js` sets that header by hand.
- **`dns.yml` never runs on a PR** (no secrets there): it fires on main when
  `scripts/dns-aid.mjs` or `worker-config.js` change, plus a Monday cron and a
  main-only dispatch, converges the records under `_agents.hausfold.co`, turns
  DNSSEC on (`--dnssec`), then asks 1.1.1.1 over DoH what it sees.
  `test/dns-aid.test.js` is the PR-time half, through `worker.yml`. A verify that
  fails right after a publish is the resolver's cache (negative TTL 1800s, record
  TTL 3600s) and warns; the Monday `--check` goes red.

Four **drift tripwires** read haus's committed `docs/site-data/`, each also on a
Monday cron: `options-drift.yml` re-renders `reference/options.mdx` (the cron
opens one long-lived PR, and closes it on any run that finds no drift — that PR's own
`check` re-renders against haus's tip, so once `main` has caught up by hand it
can never go green), `keybindings-drift.yml` snapshots the binding surface
the keybinding pages describe, `bar-tables-drift.yml` holds `rooms/bar-widgets`'s
two tables to haus's tone ladder and mark set, and `rooms-drift.yml` holds the
catalogue on `rooms/index` and the `---Rooms---` group to haus's room registry.
None needs Nix.
`preview-sweep.yml` (daily, or
`gh workflow run preview-sweep.yml -f dry_run=true`) is the backstop for a
preview Worker whose PR closed without the delete firing.

## Before you open a PR

**Run the pre-PR assurance pass, every PR.** Hand `git diff main...HEAD` to a
clean-context subagent whose only inputs are that diff and this file; here it
hunts product-specific content that belongs in a product's repo, a **new
positioning claim** with no decision behind it, and a claim the products don't
back. Checklist: the workshop ship skill's **Step 2.5**. Advisory, never a gate:
fix anything ≥3/5 first, carry the rest into **Watch out**. Spawning that
subagent is user-requested; a client with none says so in one line.

## Shipping

Small changes — copy, a colour, a typo — commit and push; that ships them. A bad
deploy costs one `git revert` and a re-run. Three things are **not** small,
because they are positioning:

- **Changing what the site claims hausfold is.** A new claim needs a decision
  behind it.
- **Adding a desktop.** It must exist and install for a stranger first — **no
  empty slots, no coming-soon entries**. What each shipped one cleared: a file in
  `hausfold/haus/desktops/<name>.nix`; a row in `worker.js`'s `DESKTOPS`, so
  `hausfold.co/<name>.sh` installs it; a page at
  `content/docs/haus/desktops/<name>.mdx` whose every fact is read off that
  `.nix`, with an un-hued icon in `src/lib/icons.tsx` and an entry under
  `---Desktops---` in `content/docs/haus/meta.json`; a row in
  [`desktops/choosing`](content/docs/haus/desktops/choosing.mdx)'s table.
  **No landing page.** **`blank` has no `DESKTOPS` row and no installer URL**: it
  is the null selection, and `hausfold.co/blank.sh` would promise a machine it
  does not produce. It **does** keep its docs page, and that is the right shape:
  a page can explain a null selection, a `curl | bash` cannot.
- **Adding a product name that isn't real yet.** It needs a row in `PRESENCE.md`
  ([`hausfold/ops`](https://github.com/hausfold/ops), private) first. **One
  narrow exception**: the last line of `#made` may carry a workshop-stage name
  the register accounts for explicitly — today `trill`; two at once would be a
  habit. Read the register there; **never restate what you find** — which names
  are held is the thing it is private for.
