# design

`public/hausfold.css` carries the palette, type and layout decisions in its
header comment, and [AGENTS.md](../AGENTS.md#rules-that-are-easy-to-break-by-accident)
has the rules in full — the six accents, the four exceptions (two of them on
hover), the motion bar, the component bar. This page is the reasoning under
them, which is the part a rule can't carry.

## why the house holds no hue

hausfold is the quiet house the products sit in, not a sixth product competing
with them for attention. The house being the *platform* is an argument for
holding no colour, not against: the accents belong to the desktops and the apps,
and nebelung's palette is the one brand asset the family genuinely shares. So
the landing pages own none of it, and every colour on them is borrowed.

**The favicon doesn't give way, deliberately**: it holds the six-accent sweep at
rest. The hover exceptions need a hover a favicon hasn't got, and an icon that
stays grey until you point at it is just a grey icon. It still borrows — the same
six accents, out of the same vendored nebelung port — and it's chrome, not page.

Nothing moves at rest either. The one turn there is — the `⌂` mark's stripes
drifting over 0.7s under the pointer — keeps its colour under
`prefers-reduced-motion` and drops only the movement: the colour is the idea,
the movement is the flourish.

**The docs are the other exception**: one hue per tree, at rest, so a reader can
tell `/docs/haus` from `/docs/pounce` with the page upside down. A landing page
is read once; a docs page is lived in. Five of the six accents are spent as tree
hues — one per root folder, `haus` on `--a-nebelung` — which is exactly why there
is no seventh to hand out.

## why the light theme isn't latte

The dark theme's nebelung values are vendored, not typed — see
[development](development.md#the-generated-files). Two dark values sit outside
that on purpose: `--ink`, a rung above nebelung's text, and `--well`,
hand-picked and *not* mantle. The whole light theme is hand-picked too, a
paper-warm mirror rather than latte, because nebelung's pastels are built for a
dark ground and go chalky on a light one.

Style through the tokens, never inside the media query, and check both themes
before shipping a colour change.

## why two omissions are decisions

**No `og:image`.** A link card with no image degrades to the title and one line,
which is the tone these pages are for; a 1200×630 sheet with a wordmark centred
on it is the tone they aren't.

**No screenshots, and no `.shot` class to draw an empty frame with.** There is no
real capture of the hacker desktop, and a picture that lies about what the
desktop looks like today is worse than a grey box admitting it hasn't got one —
and with no sheet to reserve a slot on, no box beats both. A real capture, when
one exists, goes in the docs tree it documents; it is also wall-to-wall nebelung,
so the day one lands on a landing page is the day the site stops being greyscale
at rest.

Every validator flags both. That flag is not a bug report.

## why `<Provider>` lives in the docs layout

The pages are Next routes, so they ship Next's client runtime — the price of the
port, paid deliberately. What they do **not** ship is Fumadocs. At the root
layout, `<Provider>` gave every landing page the search context, the ⌘K binding
and a lazy fetch of the ~457 KB search index. Measured with it in the docs
layout instead: a landing page is 8 chunks / 173 KB gzip, a docs page 16 / 398 KB.

We ship none of our own, and the bar for a first one is `command.tsx`'s: it
renders `hidden` in the exported HTML and unhides only where
`navigator.clipboard` exists, so with JS off the command is still plain
selectable text. Pure enhancement, nothing lost without it.
