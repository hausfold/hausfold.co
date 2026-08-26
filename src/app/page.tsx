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
// `/haus` was that floor until 2026-08-26, when it retired into
// `content/docs/haus/index.mdx`: most readers reach the tree without passing
// the sheet, so the argument was being made to the smaller half of the
// audience and kept in step for the other. haus's row below points at the
// docs now, which is what the rule in the paragraph above always asked for.
//
// 🚨 One id is load-bearing here. `#apps` became `#made`, because the list is
// no longer only apps — the four /terms and /refunds 301s were repointed in
// the same commit. (`#desktops` was the other; it went to `/haus` with its
// section and retired with it.) See `public/_redirects`.
//
// The head is `pageMetadata` and the `theme-color`/favicon pair comes from
// `src/app/layout.tsx`.
export const metadata = pageMetadata({
  title: 'hausfold',
  description:
    'hausfold makes Mac software: one layer that rebuilds the whole machine, and the small native tools that live inside it.',
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
    'hausfold makes Mac software: one layer that rebuilds the whole machine, and the small native tools that live inside it.',
  email: 'julien@hausfold.co',
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
          {/* No nav at all, since 2026-08-18. It was two words (`docs` and
              `github`), then one (`github`) once the `/docs` doorway was
              deleted on 2026-08-17 — and a nav of one link, above a mark
              five rem tall, is chrome rather than navigation. The org's
              GitHub is still one click away, in the colophon below, which
              is where every `.sheet` route with a colophon puts it.
              (`/perch/privacy` writes its own footer and has none — see
              `src/components/sheet.tsx`.)

              🚨 It stopped being `/`'s rule alone on 2026-08-26: `/perch`
              and `/haus` both retired into their docs trees that day, and
              `.crumbs` and `.topnav` went with them. No page on this site
              opens on a nav row now. An inner page that comes back still
              owes a way back up — the two tombstones in
              `public/hausfold.css` carry the shapes. */}

          <div className="mark" aria-hidden="true">
            ⌂
          </div>
          <h1 className="wordmark">hausfold</h1>
          <p className="standfirst">We rebuild the Mac.</p>
          {/* Half the length of the paragraph it replaced, and about a
              different subject: that one explained haus and moved to
              `/haus`, then into `/docs/haus`, still explaining it. This one
              says who is speaking.
              It names the two tiers — the layer, and the tools — without
              teaching either, because both are one row away and every row
              is a door.

              🚨 The closing clause has been wrong twice, in opposite
              directions, and both mistakes are worth knowing.

              First it read "Built for the way we use our own Macs", which
              is the **maker's voice** AGENTS.md lists among the three
              recorded positioning reversals (2026-08-06).

              Then it read "Opinionated, native, and open", and the user
              caught the deeper error: **opinionated is what haus is NOT.**
              A *desktop* is opinionated — `desktops/hacker` says so in its
              own description, and `leaving` says "opinionated, not
              possessive" — but the layer underneath exists precisely so
              you can disagree with it, which is what every `haus.*` option
              and the whole rooms model are for. Calling the platform
              opinionated concedes the ground that separates it from a
              take-it-or-leave-it rice.

              What replaced it names the macOS pain instead of a stance:
              **nothing by hand**. That is the site's own recurring phrase
              for the thing people actually resent (`docs/haus`'s lede
              says "the settings you always change by hand"), and it is a
              promise the layer keeps rather than a
              personality it claims. "native" came out in the same edit: it
              was already in the sentence, two clauses earlier. */}
          <div className="lede">
            <p>
              hausfold makes Mac software: one layer that rebuilds the whole machine, and the small
              native tools that live inside it. Nothing by hand, and open all the way down.
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
              answer. It is the site's only statement of the fact.

              🚨 The opening sentence is not new copy: it is the deleted
              `/docs` doorway's own line ("haus is the machinery; the rest
              are things that run on it, and run perfectly well on a Mac
              that has never heard of it"), rehomed rather than dropped when
              that page went on 2026-08-17. It has to be *somewhere*: it is
              the axis the whole site is organised on (AGENTS.md's tree
              switcher, "the layer, and the apps"), and without it a list
              with haus at the top reads as haus plus five accessories,
              which is the exact misreading this page's split exists to
              prevent. */}
          <p>
            haus is the machinery; the rest run on it, and run just as well on a Mac that has never
            heard of it. All small, all native, and each keeps its settings in a plain file you can
            read and hand to an agent. Every one is free and open source: no account, no
            subscription, nothing to buy, nothing you can&apos;t take with you.
          </p>
          <ul className="index" role="list">
            {/* No data-accent, and it is the one row that couldn't have one:
                haus is the layer everything else sits in, and the house
                borrows every colour and owns none — the same reason the ⌂
                takes all six at once rather than one. (AGENTS.md's closed
                vocabulary: the six accents belong to products, and a
                seventh is not available to invent.) */}
            <li>
              <Link className="index-name" href="/docs/haus">
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
            {/* Pointed at `/perch` until 2026-08-26, when the last product
                sheet was retired into its own tree the way `/pounce` was.
                Every row in this list now lands on a docs tree or a repo. */}
            <li data-accent="perch">
              <Link className="index-name" href="/docs/perch">
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
