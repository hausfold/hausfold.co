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
//     /desktops 301, the 404 and the docs sidebar's way-out row all land on it.
//   sections are lists, not paragraphs — a short line saying what the tier is,
//     then names. The page is read in ten seconds by someone deciding where to
//     click, and a paragraph is the wrong shape for that.
//
// A third followed hours later, also the user's: /desktops/{nebelhaus,
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
// Both GitHub orgs, in that order: `hausfold` is where everything ships from
// as of 2026-08-08 (the rename plan), and `nebelhaus` stays alive forever
// holding the redirects, so it is a true alias rather than a stale one.
// sameAs edges get cached for a long time — listing only the org being
// emptied would leave the machine-readable identity pointing at a redirect
// shell once the repos transfer.
const organization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'hausfold',
  url: 'https://hausfold.co/',
  description:
    'hausfold makes the software that turns a Mac into a workspace someone actually designed.',
  email: 'hi@hausfold.co',
  sameAs: ['https://github.com/hausfold', 'https://github.com/nebelhaus'],
};

// The one file, in the form it's actually written. Every option here is real
// and spelled as `content/docs/haus/reference/options.mdx` spells it — that
// page is generated from haus's own module system, so it is the thing to check
// this against when it drifts. (`name` is required whenever `key` is set, per
// the roster options, so the slack entry can't shed it.)
//
// It is the one thing on this page that survived the cut by being a
// demonstration rather than an explanation: four lines of it say what three
// paragraphs about "declarative configuration" would not.
//
// Line length is a layout constraint, not a style choice: `.cmd code` is
// 0.82rem mono inside a 41rem sheet, and anything much past ~58 characters
// puts a horizontal scrollbar on the box at ordinary zoom. The roster entry
// is written multi-line for exactly that reason. Keep new lines under that.
const example = `{
  haus.theme.accent = "sapphire";

  haus.windows.enable = true;  # tiling, Caps Lock as leader
  haus.launcher.enable = true; # the launcher, on ⌘Space

  # installed, and on Caps Lock + s
  haus.roster.slack = {
    cask = "slack";
    name = "Slack";
    key = "s";
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
  const exampleHtml = await codeToHtml(example, {
    lang: 'nix',
    theme: nebelungCssVars,
    structure: 'inline',
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      {/* Sections, in order: Rooms (added 2026-08-15), #desktops, Apps, haus,
          Also from hausfold. Rooms sits first so that "which rooms are on" in
          the desktops line isn't a forward reference; haus still comes after
          the products, per the 2026-08-12 decision. */}
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
            rooms are on" two sections down isn't a forward reference. It is
            NOT a merge candidate with `Apps`, and the distinction is the
            site's own axis (the docs switcher: the layer, and the apps): a
            room is a unit of haus, an app is a product that installs from
            brew and runs with no haus at all. Some rooms are built around
            our apps; the Apps section says so in one clause.

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
            wires the
            keys, the theme, and the macOS settings around it, so the pieces already know each
            other.
          </p>
          <p className="aside">
            <Link href="/docs/haus">Every room, and what it covers</Link>.
          </p>
        </section>

        {/* 🚨 The id is load-bearing and outlives whatever is under it: the
            /desktops 301 in public/_redirects, src/app/not-found.tsx and the
            docs sidebar's way-out row all point at /#desktops. It was a
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
          <p>
            A desktop is a complete setup, written down: which rooms are on, how it looks, what it
            installs. A Mac runs exactly one.
          </p>
          <p className="aside">
            <Link href="/docs/haus/desktops/choosing">The four that ship, and how to choose</Link>.
          </p>
        </section>

        <section className="block">
          <h2>Apps</h2>
          {/* "made to sit at the centre of a room", not "come with a room":
              trill is in the incubator and ships with nothing yet, and a
              blanket claim over a list whose last row says "In incubator"
              is a claim the products don't back. ("a room" rather than "the
              desktop" since 2026-08-15, when Rooms became a section above:
              it is the same fact one tier more precisely, and it is the one
              clause that says how Apps and Rooms relate.)

              The agent clause is the user's, restored 2026-08-14 — an earlier
              cut dropped the half of the sentence that says WHY a plain file
              is the point. Read, diff and hand to an agent is the same
              argument the haus section below makes about the whole machine,
              one tier down, and it is the one thing here a settings pane
              cannot do. */}
          <p>
            Small native Mac apps, made to sit at the centre of a room and to stand alone without
            one. Settings live in a plain file you can read, diff and hand to an agent. No account,
            no subscription, nothing you can&apos;t take with you.
          </p>
          <ul className="index" role="list">
            {/* pounce points at its docs, not at a product page: it had one
                at /pounce until 2026-08-14, and it was retired into the docs
                tree rather than kept beside it. perch still has a sheet of its
                own — it is an App Store app with a policy URL and, later, a
                price. */}
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
            {/* trill's name became a link on 2026-08-14, when it got a tree
                of its own — the "inward on the day the inward page exists"
                rule, applied to the one row that had nowhere to point. It is
                still the workshop-stage name AGENTS.md allows here on the
                condition the register accounts for it, and the page it lands
                on opens by saying there is nothing to install, so the link
                makes no claim the row didn't. */}
            <li data-accent="trill">
              <Link className="index-name" href="/docs/trill">
                trill
              </Link>
              , your notifications without the noise. In incubator.
            </li>
          </ul>
        </section>

        {/* haus closes the page, and that ordering is deliberate: it used to
            open the index, in a tier above the products, which answered "how"
            before anyone had asked "what".

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
            <code>haus rebuild</code> applies the file. <code>haus rollback</code> puts it back.
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
        </section>

        {/* holt runs anywhere and nebelung is a palette, so neither is a
            desktop and neither is an app — but a trailing sentence naming both
            was the one place on this page a reader had to parse a clause to
            find a link. It is the same list shape as `Apps` now, one tier
            down, which is what the user asked for: a label and two lines. */}
        <section className="block">
          <h2>Also from hausfold</h2>
          <ul className="index" role="list">
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
