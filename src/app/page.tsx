import Link from 'next/link';
import { Colophon, GithubMark } from '@/components/sheet';
import { pageMetadata } from '@/lib/page-meta';

// The front door, and since 2026-08-17 it is the *house's* door rather than
// the layer's.
//
// The user split the site in two that day: hausfold is the org, the maker and
// the publisher; haus is one of the things it makes. So everything that
// argued for the layer — the hero paragraph, Rooms, Desktops, the one-file
// example — moved to `/haus`, word for word, and what is left here is an
// index of everything hausfold publishes and a paragraph saying who publishes
// it.
//
// That makes this page the shortest it has ever been, which is the point: a
// stranger arriving at the domain wants to know what this house is and what
// comes out of it, and both answers should fit above the fold. Anything that
// explains rather than points belongs one floor down — on the thing's own
// page, or in `/docs`, and in exactly one of them.
//
// 🚨 Two ids used to be load-bearing here and only one still is. `#desktops`
// went to `/haus` with its section (the /desktops 301 and the 404 now point
// at /haus/#desktops); `#apps` became `#made`, because the list is no longer
// only apps — the four /terms and /refunds 301s were repointed in the same
// commit. See `public/_redirects`.
//
// The head is `pageMetadata` and the `theme-color`/favicon pair comes from
// `src/app/layout.tsx`.
export const metadata = pageMetadata({
  title: 'hausfold',
  description:
    'hausfold makes Mac software: a layer that rebuilds the whole machine, and the small native tools that live inside it.',
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
    'hausfold makes Mac software: a layer that rebuilds the whole machine, and the small native tools that live inside it.',
  email: 'hi@hausfold.co',
  sameAs: ['https://github.com/hausfold'],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <main className="sheet">
        <header className="masthead">
          {/* One word, since 2026-08-17. It was `docs` and `github` — and
              `docs` pointed at a doorway page that listed four trees, which
              was a third index of the same things this page now indexes
              directly. That page is deleted, every tree is one click from a
              row below, and a nav whose only job is to duplicate the list
              under it is chrome. What is left is the one destination no row
              can be: the org itself.

              It sits above the mark rather than beside it because the mark is
              5rem tall and a row would have to pick a baseline between them;
              and it is flush LEFT, onto the column's own left edge, which is
              the axis the whole page hangs from.

              Two judgement calls worth having written down. It is inside
              `<main>`, which nests a nav landmark under main: the alternative
              is a sibling of `.sheet` re-deriving the column's whole leaning
              inset to line up with it, and one landmark inside another is the
              cheaper of the two costs. And it takes `.crumbs`'s ink and size
              — the quietest on the site — because the page is twenty lines
              long and the exits that matter are the rows. */}
          <nav className="topnav" aria-label="Site">
            <a href="https://github.com/hausfold">github</a>
          </nav>

          <div className="mark" aria-hidden="true">
            ⌂
          </div>
          <h1 className="wordmark">hausfold</h1>
          <p className="standfirst">We rebuild the Mac.</p>
          {/* Half the length of the paragraph it replaced, and about a
              different subject: that one explained haus and moved to
              `/haus` still explaining it. This one says who is speaking.
              It names the two tiers — the layer, and the tools — without
              teaching either, because both are one row away and every row
              is a door.

              🚨 The closing clause is deliberately a description, not a
              stance. A draft of it read "Built for the way we use our own
              Macs, in the open, for anyone who wants theirs the same",
              which is the **maker's voice** AGENTS.md lists among the three
              recorded positioning reversals (2026-08-06) — and a reversed
              position walking back onto the front door in a sentence
              nobody decided is exactly what that rule is for. Every word
              here is instead a property something on this page backs:
              *native* by the apps' own pages, *open* by the licences, and
              *opinionated* by the desktops model, where a desktop is a
              complete answer rather than a pile of switches. */}
          <div className="lede">
            <p>
              hausfold makes Mac software: one layer that rebuilds the whole machine, and the small
              native tools that live inside it. Opinionated, native, and open all the way down.
            </p>
          </div>
        </header>

        {/* The whole index, in one list. It was "Also from hausfold" — the
            closing section under a page that spent four sections on the
            layer — and on 2026-08-17 it became the page: haus takes the
            first row, and the list is now the site's map rather than its
            footnote.

            Two tiers in one list, deliberately. haus is a layer and the rest
            are things that run on it — the distinction the docs' own tree
            switcher is built on — but a front door that sorts its answers
            into two headed sections asks the reader to understand the
            taxonomy before they have met a single name. The rows say which
            is which in their own words, and the order does the rest.

            Each row points at the fullest thing that exists for it: haus and
            perch to their own pages, pounce and trill to their docs trees
            (pounce's sheet was retired 2026-08-14), holt and nebelung to
            GitHub, which is all either has so far. trill is still the
            workshop-stage name AGENTS.md allows on the condition the
            register accounts for it — the page it lands on opens by saying
            there is nothing to install, so the link makes no claim the row
            doesn't. */}
        {/* 🚨 `#made` is load-bearing: the four /terms and /refunds 301s land
            on it, because this paragraph is where "nothing to buy" is said.
            It was `#apps` until 2026-08-17, when the section stopped being
            only apps; `public/_redirects` was repointed in the same commit,
            and it is the only caller. Renaming it again means editing those
            four lines again. */}
        <section className="block" id="made">
          <h2>What we make</h2>
          {/* The free-and-open-source clause landed 2026-08-16, with the
              retirement of `/terms` and `/refunds`: nothing hausfold
              publishes is for sale, and both of those URLs now 301 here, so
              this paragraph is what a reader who typed `/refunds` gets as an
              answer. It is the site's only statement of the fact. */}
          <p>
            Small, native, and every one of them keeps its settings in a plain file you can read and
            hand to an agent. All of it is free and open source: no account, no subscription,
            nothing to buy, nothing you can&apos;t take with you.
          </p>
          <ul className="index" role="list">
            {/* No data-accent, and it is the one row that couldn't have one:
                haus is the layer everything else sits in, and the house
                borrows every colour and owns none — the same reason the ⌂
                takes all six at once rather than one. (AGENTS.md's closed
                vocabulary: the six accents belong to products, and a
                seventh is not available to invent.) */}
            <li>
              <Link className="index-name" href="/haus">
                haus
              </Link>
              , the layer your whole Mac is written in.
            </li>
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
