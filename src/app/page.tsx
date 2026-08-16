import Link from 'next/link';
import { codeToHtml } from 'shiki';
import { Command } from '@/components/command';
import { Colophon, GithubMark } from '@/components/sheet';
import { pageMetadata } from '@/lib/page-meta';
import { nebelungCssVars } from '@/lib/shiki-theme';

// The landing page. Cut hard on 2026-08-14, twice in one day: first the prose
// carried across from `public/index.html` lost its second and third paragraphs,
// then the user cut it again by about two thirds. What survives is an *index* —
// enough to understand what hausfold is, and a door to whichever part of the
// site the reader actually wants. Everything that explains rather than points
// now lives in `/docs`, which is the only copy of it.
//
// Two structural decisions from that second cut, both the user's:
//
//   the desktop catalogue is gone — one sentence and ONE link, to
//     /docs/haus/desktops/choosing, no screenshot frames at all. It is
//     explicitly a holding position ("we'll reconsider once velocity slows"),
//     not a claim that desktops matter less. The #desktops anchor STAYS: the
//     /desktops 301 and the 404 both land on it. (The docs sidebar's way-out
//     row did too, until it was removed on 2026-08-16.)
//   sections are lists, not paragraphs — a short line saying what the tier is,
//     then names. The page is read in ten seconds by someone deciding where to
//     click, and a paragraph is the wrong shape for that.
//
// A third followed hours later, also the user's: /desktops/{hacker,
// everyday,minimal} were deleted outright and every desktop is documented at
// /docs/haus/desktops/<name>. So this page names no desktop at all — the one
// link goes to the page that compares them, which is the question a front
// door can actually answer.
//
// The head is `pageMetadata` and the `theme-color`/favicon pair comes from
// `src/app/layout.tsx`.
export const metadata = pageMetadata({
  title: 'hausfold',
  description:
    'hausfold makes the software that turns a Mac into a workspace someone actually designed.',
  path: '/',
  ogTitle: 'hausfold · We rebuild the Mac.',
});

// Says "hausfold is one organisation, and these accounts are it" to anything
// resolving the name. No claim here that the page doesn't already make in
// prose.
//
// One GitHub org: `hausfold`, where everything ships from. sameAs edges get
// cached for a long time, so this lists only the identity meant to outlive
// the cache.
const organization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'hausfold',
  url: 'https://hausfold.co/',
  description:
    'hausfold makes the software that turns a Mac into a workspace someone actually designed.',
  email: 'hi@hausfold.co',
  sameAs: ['https://github.com/hausfold'],
};

// The one file, in the form it's actually written. Every option here is real
// and spelled as `content/docs/haus/reference/options.mdx` spells it — that
// page is generated from haus's own module system, so it is the thing to check
// this against when it drifts. (`name` is required whenever `key` is set, per
// the roster options, so the claude entry can't shed it.)
//
// It is the one thing on this page that survived the cut by being a
// demonstration rather than an explanation: four lines of it say what three
// paragraphs about "declarative configuration" would not.
//
// The lines are picked so each lands with a different reader (the user's
// brief, 2026-08-16): the accent for someone who cares how it looks, tiling
// for someone who lives in windows, focus for someone guarding their
// attention, animations for someone who wants macOS out of the way, and the
// roster entry — Claude, deliberately — for someone who'd hand this very file
// to an agent. The comments stay one clause each; they are the explainers.
//
// Line length is a layout constraint, not a style choice: `.cmd code` is
// 0.82rem mono inside a 41rem sheet, and anything much past ~58 characters
// puts a horizontal scrollbar on the box at ordinary zoom. The roster entry
// is written multi-line for exactly that reason. Keep new lines under that.
const example = `{
  haus.theme.accent = "sapphire"; # one hue, everywhere

  haus.windows.enable = true;  # tiling, Caps Lock as leader
  haus.launcher.enable = true; # the launcher, on ⌘Space
  haus.focus.enable = true;    # Do Not Disturb, one switch
  haus.animations = "fast";    # no bounce, no genie

  # the Claude macOS app, installed, on Caps Lock + c
  haus.roster.claude = {
    cask = "claude";
    name = "Claude";
    key = "c";
  };
}`;

export default async function Home() {
  // Highlighted at build time — this is a server component and the site is
  // `output: 'export'`, so Shiki runs once during `next build` and the colour
  // is in the static HTML. No client JS, no flash of plain text. The theme is
  // the same css-variables one the docs' code blocks use (src/lib/shiki-theme.ts):
  // Shiki emits `var(--nb-token-*)` and the stylesheet decides the hues, so
  // the landing example and every docs block fork light/dark in one place.
  // `structure: 'inline'` drops the pre/code wrapper so the output slots into
  // `.cmd`'s existing `<code>` untouched.
  const highlight = (code: string, lang: string) =>
    codeToHtml(code, { lang, theme: nebelungCssVars, structure: 'inline' });
  // The two inline commands in the aside go through the same pipeline as the
  // block (the user's ask, 2026-08-16): same theme, same build-time cost of
  // zero at runtime. `children` on those <code>s stays out — Shiki's spans ARE
  // the content, and the raw string never needs copying.
  const [exampleHtml, rebuildHtml, rollbackHtml] = await Promise.all([
    highlight(example, 'nix'),
    highlight('haus rebuild', 'sh'),
    highlight('haus rollback', 'sh'),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      {/* Sections, in order: Rooms (added 2026-08-15), #desktops, haus, Also
          from hausfold. Rooms sits first so that "which rooms are on" in the
          desktops line isn't a forward reference. Apps stopped being a
          section on 2026-08-16, the user's call — its three rows live in the
          closing index now. */}
      <main className="sheet">
        <header className="masthead">
          {/* The site's only forward navigation, added 2026-08-14. Two words:
              the docs, which is where every explanation this page used to make
              now lives, and the org. It sits above the mark rather than beside
              it because the mark is 5rem tall and a row would have to pick a
              baseline between them; and it is flush LEFT, onto the column's
              own left edge, which is the axis the whole page hangs from since
              the lean reversed. (It was flush right for the few hours the
              column leaned right — same rule, mirrored with the geometry.)

              Inner pages keep `.crumbs` instead — they are already inside the
              site and their question is "how do I get back up", not "where
              else is there".

              Two judgement calls worth having written down. It is inside
              `<main>`, which nests a nav landmark under main: the alternative
              is a sibling of `.sheet` re-deriving the column's whole
              leaning inset to line up with it, and one landmark inside
              another is the cheaper of the two costs. And it takes `.crumbs`'s
              ink and size — the quietest on the site — even though this is the
              page's only exit, because the page is 40 lines long and the exits
              that matter are the links in the prose. If either turns out
              wrong, the fix is this rule, not a second nav. */}
          <nav className="topnav" aria-label="Site">
            <Link href="/docs">docs</Link>
            <a href="https://github.com/hausfold">github</a>
          </nav>

          <div className="mark" aria-hidden="true">
            ⌂
          </div>
          <h1 className="wordmark">hausfold</h1>
          <p className="standfirst">We rebuild the Mac.</p>
          {/* Rewritten 2026-08-14, the user's call, and the note is the brief
              rather than the copy: the version before it opened "a new Mac
              takes a weekend to make yours", which reads as one person ricing
              one laptop over a wet Sunday. That undersells what is actually
              here — a layer that rebuilds macOS itself and hands you the
              result as text, on any number of machines. So: general before
              personal, and the same facts (what it covers, that it is one
              file, that it is one command) in the same number of words. */}
          <div className="lede">
            <p>
              A Mac out of the box is somebody else&apos;s idea of a Mac. hausfold rebuilds it into
              yours: the windows, the bar, the shell, the keys, the apps, the settings you always
              change by hand. The whole arrangement is written down in <strong>one file</strong>.
              One command puts that Mac on any machine you own, and puts it back after a wipe.
            </p>
          </div>
        </header>

        {/* Added 2026-08-15 at the user's request, above Desktops so "which
            rooms are on" two sections down isn't a forward reference. Rooms
            and the apps stay distinct tiers even now that Apps has no section
            of its own (2026-08-16) — the distinction is the site's own axis
            (the docs switcher: the layer, and the apps): a room is a unit of
            haus, an app is a product that installs from brew and runs with
            no haus at all.

            The app-store comparison is the section's one claim, and it is
            the mechanism as /docs/haus states it (the accent lands in the
            terminal, the bar and the browser at once; Slack arrives
            installed AND bound). Don't count the rooms here: AGENTS.md
            records that any number written down is wrong somewhere. */}
        <section className="block" id="rooms">
          <h2>Rooms</h2>
          <p>
            The rebuild happens in rooms: Windows, Launcher, Bar, Focus, and the rest, each a
            single concern handled all the way down. An app store stops at the app; a room also
            wires the keys, the theme, and the macOS settings around it, so the pieces already know
            each other.
          </p>
          <p className="aside">
            <Link href="/docs/haus">Every room, and what it covers</Link>.
          </p>
        </section>

        {/* 🚨 The id is load-bearing and outlives whatever is under it: the
            /desktops 301 in public/_redirects and src/app/not-found.tsx both
            point at /#desktops. The docs sidebar's way-out row was a third,
            until it was removed on 2026-08-16 — the anchor's two remaining
            callers are enough to keep it. It was a
            catalogue of three plates with a screenshot frame each until
            2026-08-14; the user cut it to a sentence the same day, on the
            grounds that /docs/haus/desktops/choosing says it better and a
            front page should route rather than sell.

            ONE link, and deliberately not the desktops' names. It listed
            three of them for a few hours, on the reasoning that each name led
            to its own install command — then those pages were deleted too,
            and naming three things a reader cannot yet tell apart, in a
            section whose whole job is to send them one click on, is three
            decisions asked before the one that matters. `choosing` is the
            page that answers "which of these is mine?"; every desktop's own
            page is one further click from there.

            Nothing here carries a data-accent any more, and that follows from
            the same cut rather than from a change of rule: a desktop is not a
            product and never had one, except `hacker`, which is a named
            thing with a hue assigned upstream — and its name is no longer on
            this page to carry it. (AGENTS.md's closed vocabulary.) */}
        <section className="block" id="desktops">
          <h2>Desktops</h2>
          {/* The making-and-sharing sentence, added 2026-08-16 at the user's
              request. Both halves are backed pages, not aspiration:
              /docs/haus/desktops/creating and /docs/haus/desktops/sharing.
              It stays linkless on purpose — the aside's ONE link is still the
              rule; `choosing` links onward to `creating`, which links
              `sharing`. */}
          <p>
            A desktop is a complete setup, written down: which rooms are on, how it looks, what it
            installs. A Mac runs exactly one. And a desktop is just a file, so it travels: make
            your own, or run one a friend swears by.
          </p>
          <p className="aside">
            <Link href="/docs/haus/desktops/choosing">The four that ship, and how to choose</Link>.
          </p>
        </section>

        {/* haus sits between Desktops and the index, and the ordering moved
            on 2026-08-16, the user's call: the Apps section dissolved into
            "Also from hausfold" below, so haus is no longer last. The
            2026-08-12 reasoning (don't answer "how" before "what") still
            shapes the top of the page — Rooms and Desktops come first.

            It carries the example file and almost nothing else. The two
            paragraphs that used to explain `haus rebuild`, `haus plan` and
            `haus rollback` are in content/docs/haus/reference/haus.mdx, which
            says more about all three — repeating them here was the same
            two-copies-of-one-subject mistake that retired /haus and /pounce,
            just at paragraph scale.

            haus carries no data-accent, for the same reason the ⌂ has none of
            its own: the house borrows every colour and owns none. */}
        <section className="block">
          <h2>haus</h2>
          {/* `haus` is the link rather than a <strong>, changed 2026-08-14 at
              the user's request. It was the one place on this page where the
              name of the thing the whole section is about was emphasised and
              inert, with the door to it two paragraphs below in an .aside.
              The name IS the door now; the .aside still carries the deeper
              pair (every option, and what the install does) because those are
              different questions. */}
          <p>
            Underneath all of it is{' '}
            <Link className="index-name" href="/docs/haus">
              haus
            </Link>
            : macOS itself, turned into options you set in a file.
          </p>
          <Command html={exampleHtml}>{example}</Command>
          {/* Two links, and neither repeats the one in the sentence above —
              which it did until `haus` itself became that link. A section
              with the same href on it twice spends a reader's attention
              twice to move them once. */}
          <p className="aside">
            <code dangerouslySetInnerHTML={{ __html: rebuildHtml }} /> applies the file.{' '}
            <code dangerouslySetInnerHTML={{ __html: rollbackHtml }} /> puts it back.
            There are no surprises:{' '}
            <Link className="index-name" href="/docs/haus/reference/options">
              every option
            </Link>{' '}
            is documented, and{' '}
            <Link className="index-name" href="/docs/haus/install">
              the install
            </Link>{' '}
            tells you what it will do before you run it.
          </p>
          {/* The agent note closes the section, at the user's request
              (2026-08-16): the one consequence of "the machine is one file"
              worth its own line, weighted above an .aside but still
              greyscale — the .note class is a heavier left rule and body
              ink, no colour, per the landing half's at-rest rule. "The rare
              Mac", not "the only Mac": it is the docs' own claim
              (agent-rebuilds' lede says "the rare machine"), and the
              stronger word is a positioning claim nothing backs. The link
              is the door to the page that explains the how. */}
          {/* A plain prose link, not an .index-name: the mono face is for a
              product's NAME in an index row, and five mono words mid-serif
              sentence read as a different voice butting in (the user's read,
              2026-08-16). */}
          <p className="note">
            The whole machine in one file, every rebuild reversible: a haus Mac is the rare Mac an
            agent can reconfigure{' '}
            <Link href="/docs/haus/agent-rebuilds">quickly, confidently, and safely</Link>.
          </p>
        </section>

        {/* The whole index, in one list — the user folded `Apps` into this
            section on 2026-08-16, so it holds the three apps and then the two
            things that are neither desktop nor app. The intro line is the old
            Apps paragraph compressed: the plain-file clause is the user's
            (restored 2026-08-14, kept through the move, "diff" dropped from
            it 2026-08-16), because read and hand to an agent is the same
            argument the haus section makes about the whole machine, one
            tier down. "The apps" scopes the
            settings claim to the rows it backs; the no-account clause holds
            for all five.

            pounce points at its docs, not a product page (its sheet was
            retired 2026-08-14); perch keeps a sheet of its own. trill is
            still the workshop-stage name AGENTS.md allows on the condition
            the register accounts for it — the page it lands on opens by
            saying there is nothing to install, so the link makes no claim
            the row doesn't. */}
        {/* 🚨 `#apps` is load-bearing, like `#desktops` above it: the four
            /terms and /refunds 301s land on it, because this paragraph is
            where "nothing to buy" is said. Renaming the id turns those into
            a scroll to the masthead. */}
        <section className="block" id="apps">
          <h2>Also from hausfold</h2>
          {/* The free-and-open-source clause landed 2026-08-16, with the
              retirement of `/terms` and `/refunds`: nothing hausfold publishes
              is for sale, and both of those URLs now 301 here, so this
              paragraph is what a reader who typed `/refunds` gets as an
              answer. It is the site's only statement of the fact. */}
          <p>
            The apps are small, native, and keep their settings in a plain file you can read and
            hand to an agent. Every one of them is free and open source: no account, no
            subscription, nothing to buy, nothing you can&apos;t take with you.
          </p>
          <ul className="index" role="list">
            <li data-accent="pounce">
              <Link className="index-name" href="/docs/pounce">
                pounce
              </Link>
              , a launcher you teach your own commands.
            </li>
            <li data-accent="perch">
              <Link className="index-name" href="/perch">
                perch
              </Link>
              , a place for files to park on their way somewhere else.
            </li>
            <li data-accent="trill">
              <Link className="index-name" href="/docs/trill">
                trill
              </Link>
              , your notifications without the noise. In incubator.
            </li>
            <li data-accent="holt">
              <a className="index-name" href="https://github.com/hausfold/holt">
                holt
              </a>
              , parallel coding agents that never collide.
            </li>
            <li data-accent="nebelung">
              <a className="index-name" href="https://github.com/hausfold/nebelung">
                nebelung
              </a>
              , the quieter set of colours everything shares.
            </li>
          </ul>
        </section>

        <Colophon>
          <GithubMark />
        </Colophon>
      </main>
    </>
  );
}
