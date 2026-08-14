# hausfold.co

**The house's front door — and the URL that installs the house.**

```sh
curl -fsSL https://hausfold.co/nebelhaus.sh | bash
```

[hausfold.co](https://hausfold.co) is the landing pages, the docs, and that
one-liner. A Next static export behind a Cloudflare Worker; pushing to `main`
deploys it.

## the site

| | |
|---|---|
| **the pages** — `/`, `/desktops/nebelhaus`, `/perch` (`/perch/privacy`), `/pounce`, `/terms`, `/refunds` | routes under `src/app/`. greyscale at rest, two faces, almost no script of our own |
| **the docs** — [`/docs/haus`](https://hausfold.co/docs/haus) the layer, [`/docs/nebelhaus`](https://hausfold.co/docs/nebelhaus) the desktop | MDX in `content/docs/`, on [Fumadocs](https://fumadocs.dev). one hue per tree, so you can tell the halves apart with the page upside down |
| **the three routes that can't be files** — `/nebelhaus.sh`, `/download/<app>`, `/api/release/<app>` | [`worker.js`](worker.js). the only code here where a bug is a *security* bug — read its header first |

Everything else is a file: `npm run build` writes `out/`, Next copies `public/`
into it verbatim, and `out/` is what ships.

## running it

```sh
npm ci
npm run dev                          # every page, hot reload
npm run build && npx wrangler dev    # the site as deployed — redirects, headers, the Worker
npm test                             # worker.js, offline, ~1s
```

| want to change… | edit |
|---|---|
| a page | `src/app/<route>/page.tsx` |
| a docs page | `content/docs/<tree>/*.mdx` |
| colour, type, layout | `public/hausfold.css` — its header comment is the design record (the docs' own type and per-tree hue are `src/app/global.css`) |
| what `hausfold.co/<name>.sh` installs | `worker.js` — a second desktop is a row in `DESKTOPS`, not a new route |

Three things here are **generated, never hand-typed**: the dark palette
(vendored from [nebelung](https://github.com/hausfold/nebelung)), the haus
options reference, and the keybinding snapshot the docs' prose is checked
against. Run the script, commit its output — CI fails on a hand-edit.

## more

- [Development](docs/development.md) — the repo map, the generated files, what CI checks
- [Deploying](docs/deploying.md) — CI, a preview Worker per PR, and why the token needs DNS
- [Design](docs/design.md) — greyscale at rest, borrowed colour, both themes, empty frames
- [History](docs/history.md) — why this repo starts at one commit
- [AGENTS.md](AGENTS.md) — the rules in full, for people and coding agents alike

Docs live here, but the software doesn't: a bug in a product belongs in that
product's repo — [haus](https://github.com/hausfold/haus),
[pounce](https://github.com/hausfold/pounce),
[perch](https://github.com/hausfold/perch),
[nebelung](https://github.com/hausfold/nebelung).

---

<p align="center"><a href="https://hausfold.co">⌂ hausfold</a></p>
