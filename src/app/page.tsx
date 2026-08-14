import Link from 'next/link';
import { Command } from '@/components/command';
import { Colophon, GithubMark } from '@/components/sheet';
import { pageMetadata } from '@/lib/page-meta';

// The landing page. Cut hard on 2026-08-14, twice in one day: first the prose
// carried across from `public/index.html` lost its second and third paragraphs,
// then the user cut it again by about two thirds. What survives is an *index* —
// enough to understand what hausfold is, and a door to whichever part of the
// site the reader actually wants. Everything that explains rather than points
// now lives in `/docs`, which is the only copy of it.
//
// Two structural decisions from that second cut, both the user's:
//
//   the desktop catalogue is gone — one sentence and a link to
//     /docs/haus/desktops/choosing, no screenshot frames at all. It is
//     explicitly a holding position ("we'll reconsider once velocity slows"),
//     not a claim that desktops matter less. The #desktops anchor STAYS: the
//     /desktops 301, the 404 and the docs sidebar's way-out row all land on it.
//   sections are lists, not paragraphs — a short line saying what the tier is,
//     then names. The page is read in ten seconds by someone deciding where to
//     click, and a paragraph is the wrong shape for that.
//
// The head is `pageMetadata` and the `theme-color`/favicon pair comes from
// `src/app/layout.tsx`.
export const metadata = pageMetadata({
  title: 'hausfold',
  description:
    'hausfold makes the software that turns a Mac into a workspace someone actually designed.',
  path: '/',
  ogTitle: 'hausfold — We rebuild the Mac.',
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
// this against when it drifts.
//
// It is the one thing on this page that survived the cut by being a
// demonstration rather than an explanation: four lines of it say what three
// paragraphs about "declarative configuration" would not.
const example = `{
  haus.theme.accent = "sapphire";

  haus.prowl.enable = true;   # tiling, Caps Lock as the leader key
  haus.pounce.enable = true;  # the launcher, on ⌘Space

  # installed, and on Caps Lock + s
  haus.roster.slack = { cask = "slack"; name = "Slack"; key = "s"; };
}`;

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <main className="sheet">
        <header className="masthead">
          {/* The site's only forward navigation, added 2026-08-14. Two words:
              the docs, which is where every explanation this page used to make
              now lives, and the org. It sits above the mark rather than beside
              it because the mark is 5rem tall and a row would have to pick a
              baseline between them; and it is right-aligned onto the column's
              own right edge, which is the axis the whole page hangs from now.

              Inner pages keep `.crumbs` instead — they are already inside the
              site and their question is "how do I get back up", not "where
              else is there".

              Two judgement calls worth having written down. It is inside
              `<main>`, which nests a nav landmark under main: the alternative
              is a sibling of `.sheet` re-deriving the column's whole
              right-leaning inset to line up with it, and one landmark inside
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
          <div className="lede">
            <p>
              A new Mac takes a weekend to make yours, and by the next one you can&apos;t remember
              how you did it. hausfold turns that weekend into <strong>a file</strong> — the windows,
              the bar, the shell, the keys, the apps, the settings — and one command puts it back.
            </p>
          </div>
        </header>

        {/* 🚨 The id is load-bearing and outlives whatever is under it: the
            /desktops 301 in public/_redirects, src/app/not-found.tsx and the
            docs sidebar's way-out row all point at /#desktops. It was a
            catalogue of three plates with a screenshot frame each until
            2026-08-14; the user cut it to a sentence the same day, on the
            grounds that the deep pages and /docs/haus/desktops/choosing both
            say it better and a front page should route rather than sell.

            The three names stay linked even though the prose is one line —
            /desktops/<name> is where the install command is, and the docs page
            beside them is where the comparison is. Only nebelhaus carries a
            data-accent: the rice is a named thing with a hue assigned
            upstream, and everyday and minimal are selections of the same
            options rather than products (AGENTS.md's closed vocabulary). */}
        <section className="block" id="desktops">
          <h2>Desktops</h2>
          <p>
            A desktop is a whole Mac written down — which rooms are on, how it looks, what it
            installs — and a Mac runs exactly one.
          </p>
          <p className="aside">
            <Link className="index-name" data-accent="nebelhaus" href="/desktops/nebelhaus">
              nebelhaus
            </Link>
            ,{' '}
            <Link className="index-name" href="/desktops/everyday">
              everyday
            </Link>
            ,{' '}
            <Link className="index-name" href="/desktops/minimal">
              minimal
            </Link>{' '}
            — <Link href="/docs/haus/desktops/choosing">how to choose between them</Link>.
          </p>
        </section>

        <section className="block">
          <h2>Apps</h2>
          {/* "made to sit inside the desktop", not "come with the desktop":
              trill is in the incubator and ships with nothing yet, and a
              blanket claim over a list whose last row says "In incubator"
              is a claim the products don't back. */}
          <p>
            Small Mac apps, made to sit inside the desktop and to work fine without it. Settings in a
            plain file — no account, no subscription.
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
            <li data-accent="trill">
              <span className="index-name">trill</span>, your notifications without the noise. In
              incubator.
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
          <p>
            Underneath all of it is <strong>haus</strong> — macOS itself, turned into options you set
            in a file.
          </p>
          <Command>{example}</Command>
          <p className="aside">
            <code>haus rebuild</code> applies it; <code>haus rollback</code> takes it back.{' '}
            <Link className="index-name" href="/docs/haus">
              The docs
            </Link>{' '}
            have every room and every option, and{' '}
            <Link className="index-name" href="/docs/haus/install">
              what the install does
            </Link>{' '}
            before you run it.
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
