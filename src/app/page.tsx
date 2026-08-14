import Link from 'next/link';
import { Colophon, GithubMark } from '@/components/sheet';
import { pageMetadata } from '@/lib/page-meta';

// The landing page, ported from `public/index.html` (rename plan §5.2 — the
// half AGENTS.md listed as "decided, not done"). Same markup, same classes out
// of `public/hausfold.css`, same words; the head is `pageMetadata` and the
// `theme-color`/favicon pair comes from `src/app/layout.tsx`.
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

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <main className="sheet">
        <header className="masthead">
          <div className="mark" aria-hidden="true">
            ⌂
          </div>
          <h1 className="wordmark">hausfold</h1>
          <p className="standfirst">We rebuild the Mac.</p>
          <div className="lede">
            <p>
              hausfold makes the software that turns a Mac into a workspace someone actually
              designed. <strong>The whole desktop</strong>, set down in a single file and themed to
              match, plus the small native tools that live inside it.
            </p>
            <p>
              None of it is a skin. It is the machine, rebuilt: one file you hand to a coder, a
              designer, or a whole floor of them, and every Mac comes up the same. Take it as it
              comes, or take it apart.
            </p>
          </div>
        </header>

        {/* The desktops. This section was its own page at /desktops until
            2026-08-12; the catalogue moved up here because the desktops are
            what the site is for, and a one-entry gallery behind a click read
            as smaller than it is. /desktops/ now 301s to this anchor (see
            public/_redirects) and the deep page at /desktops/nebelhaus stays
            exactly where it was — the URL that gets shared is the one for a
            particular desktop, not the one for the list. Rebuild the index
            page when there are enough entries to need filtering; until then
            the front page IS the list, and the closing note leads with the
            honest count. "More as they're written" is a deliberate amendment
            to AGENTS.md's "no coming-soon" rule and was the user's call: the
            ban is on empty rows and placeholder entries, not on a sentence
            saying the list is still growing.

            The id is load-bearing: /desktops/, src/app/not-found.tsx and
            /haus's Elsewhere list all point at /#desktops. */}
        <section className="block" id="desktops">
          <h2>Desktops</h2>
          <p>
            A desktop here is the <strong>whole machine</strong>, not a theme laid over one. The
            window manager, the bar, the shell, the terminal, the fonts, the keybindings and the
            several dozen macOS defaults nobody should have to find twice — all of it written down
            in one file and applied in one command.
          </p>
          <p>
            Run it on a new Mac and the machine comes up arranged. Wipe that Mac and run it again
            and it comes up the same. Nothing gets dragged into place by hand, so nothing drifts out
            of place either.
          </p>

          {/* No .shot frame here, unlike /desktops/nebelhaus. The frames are
              deliberately empty placeholders, and an empty box directly under
              the page's main heading reads as a broken image rather than as a
              slot. It goes back in — with a real capture in it, not a dashed
              outline — when the shot in the workshop's
              SHOT-nebelhaus-desktop.md has actually been taken. */}
          <ul className="catalogue" role="list">
            <li className="entry" data-accent="nebelhaus">
              <div className="entry-head">
                <h3 className="entry-name">
                  <Link href="/desktops/nebelhaus">nebelhaus</Link>
                </h3>
                <span className="meta">developers · tiling · nix</span>
              </div>
              <p className="entry-line">
                An opinionated macOS, raised in the fog. AeroSpace tiling launched at boot, a
                SketchyBar bar on the top edge, a themed zsh and helix toolbelt, and the Nix flake
                that puts all of it there. Silver-grey, keyboard-first, reproducible.
              </p>
              <p className="entry-line">
                <Link href="/desktops/nebelhaus">What&apos;s in it, and how to install it</Link>
              </p>
            </li>
          </ul>
          <p>
            A Mac runs exactly one of them. A desktop picks which <strong>rooms</strong> it wants —
            the bar, the launcher, tiling, the terminal, the shelf — and what the visible choices
            are; anything it chose, your own file overrides in a line. Choosing again is changing
            that line, not unpicking a pile.
          </p>
          <p className="aside">
            One today, and that&apos;s the honest number — more as they&apos;re written. Every
            desktop here is a set of values for the same options, so writing your own is editing a
            file, not starting a project.
          </p>
        </section>

        <section className="block">
          <h2>Apps</h2>
          {/* "made to sit inside the desktop", not "come with the desktop":
              trill is in the incubator and ships with nothing yet, and a
              blanket claim over a list whose last row says "In incubator"
              is a claim the products don't back. Phrase the tier by intent
              and let each row carry its own state. */}
          <p>
            Small native Mac apps, made to sit inside the desktop and to work fine without it. Each
            keeps its settings in a plain file you can read, edit, diff and hand to an agent — no
            account to make, nothing held behind a subscription, nothing you can&apos;t take with
            you.
          </p>
          <ul className="index" role="list">
            <li data-accent="pounce">
              <Link className="index-name" href="/pounce">
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

        {/* haus, and the two rows below it, are the postscript — no heading and
            no rule over either. Both used to sit in the index above the
            products, haus in a tier of its own; that ordering answered "how"
            before anyone had asked "what", so the layer now closes the page
            instead of opening it. It is still the thing that makes this a
            platform rather than a dotfiles repo, which is why it gets two real
            sentences here and not a link in the colophon.

            haus carries no data-accent, for the same reason the ⌂ has none of
            its own: the house borrows every colour and owns none. holt and
            nebelung do carry theirs — they're products, they're just not
            products for the person the rest of this page is written for.
            holt runs anywhere and nebelung is a palette, so neither is a
            desktop and neither is an app; a quiet line is the whole of the
            claim we want to make about them here, and both READMEs link back. */}
        <section className="block">
          <p>
            Underneath all of it is{' '}
            <Link className="index-name" href="/haus">
              haus
            </Link>
            , the layer the desktops and the apps are written against — macOS itself, turned into
            options you set in a file. That&apos;s why a desktop is a set of values rather than a
            project, and why taking one apart is editing, not forking.
          </p>
          <p className="aside">
            Also from hausfold —{' '}
            <a className="index-name" data-accent="holt" href="https://github.com/hausfold/holt">
              holt
            </a>
            , parallel coding agents that never collide, and{' '}
            <a
              className="index-name"
              data-accent="nebelung"
              href="https://github.com/hausfold/nebelung"
            >
              nebelung
            </a>
            , the quieter set of colours everything shares.
          </p>
        </section>

        <Colophon>
          <GithubMark />
        </Colophon>
      </main>
    </>
  );
}
