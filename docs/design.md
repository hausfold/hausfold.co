# design

`public/hausfold.css` carries the palette, type and layout decisions in its
header comment; that comment is the record, this page is the shape of it.
[AGENTS.md](../AGENTS.md#the-site) has the rules in full.

## greyscale at rest, and every colour is borrowed

The landing pages own no colour. hausfold is the quiet house the products sit
in, not a sixth product competing with them for attention — and the house being
the *platform* is an argument for holding no hue, not against: the accents
belong to the desktops and the apps, and nebelung's palette is the one brand
asset the family genuinely shares.

Nothing moves, either. Both rules give way only under the pointer: hovering a
product's name tints it with **that product's** accent, and hovering the `⌂` mark
stripes it with all six and lets them drift, fading over 0.7s rather than
snapping. Leave, and it's grey and still again. `prefers-reduced-motion` keeps
the colour and drops the turn — the colour is the idea, the movement is the
flourish.

One thing doesn't give way, deliberately: **the favicon holds the six-accent
sweep at rest.** The hover exceptions need a hover a favicon hasn't got, and an
icon that stays grey until you point at it is just a grey icon. It still
*borrows* — the same six accents, generated out of the same vendored nebelung
port — and it's chrome, not page. `favicon.ico`, Safari's fallback, stays
outside even that: flat ink on crust.

The six `--a-*` accents are the whole vocabulary. Nothing may invent a seventh.

**The docs are the deliberate exception**: one hue per tree, at rest, so a
reader can tell `/docs/haus` from `/docs/pounce`, `/docs/perch` or `/docs/trill`
with the page upside down.
A landing page is read once; a docs page is lived in. Same six accents — four
of which are now spent as tree hues, which is exactly why there is no seventh
to hand out.

## both themes, every time

Colours are tokens on `:root`, redefined under `@media (prefers-color-scheme:
dark)` and again under `:root[data-theme=…]` so an explicit toggle wins in both
directions. Style through the tokens, never inside the media query. Check both
before shipping a colour change.

The dark theme's nebelung values are **vendored, not typed** — see
[development](development.md#the-generated-files). Two dark values sit outside
that on purpose (`--ink`, a rung above nebelung's text; `--well`, hand-picked
and *not* mantle), and the whole light theme is hand-picked: a paper-warm mirror
rather than latte, because nebelung's pastels are built for a dark ground.

## two decisions that look like omissions

**No `og:image`.** A link card with no image degrades to the title and one line,
which is the tone these pages are for; a 1200×630 sheet with a wordmark centred
on it is the tone they aren't. Every validator flags its absence. That flag is
not a bug report.

**There are no screenshots at all.** There were empty frames, drawn in CSS and
labelled `[ shot not taken yet ]`; `/perch` was the last page that drew any, and
when it retired into its docs tree on 2026-08-26 the `.shot` classes went with
it. There is still no real capture of the hacker desktop, and a picture that
lies about what the desktop looks like today is worse than a grey box that
admits it hasn't got one — with no sheet left to reserve a slot on, no box beats
both. A real capture, when one exists, goes in the docs tree it documents; if a
landing page ever takes one, note `images: { unoptimized: true }`, since
`next/image`'s optimizer is a server and there isn't one.

There's a nice tension here worth naming: a real capture of hacker is
wall-to-wall nebelung, so the day one lands is the day the site stops being
greyscale at rest. Worth doing on purpose rather than by accident.

## the script budget

Almost none, and none of it load-bearing. The pages are Next routes, so they
ship Next's client runtime — that's the price of the port, paid deliberately.
What they do **not** ship is Fumadocs: `<Provider>` lives in the docs layout,
not the root one, and that placement is load-bearing. At the root it gave every
landing page the search context, the ⌘K binding and a lazy fetch of the ~457 KB
search index. Measured after moving it down: a landing page is 8 chunks / 173 KB
gzip, a docs page 16 / 398 KB.

Since 2026-08-26 we ship none of our own. The one component there ever was is
`<Command>`, the copy button beside a fenced command; `/haus` and `/perch` were
its last two callers and both retired into docs trees that day, where a fenced
block is MDX and gets fumadocs' own copy button. It set the bar for a second
one: it rendered `hidden` in the exported HTML and unhid only where
`navigator.clipboard` exists, so the command was plain selectable text with JS
off. Pure enhancement, nothing lost without it.
