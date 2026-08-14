import Link from 'next/link';
import { Command } from '@/components/command';
import { Colophon, GithubMark } from '@/components/sheet';
import { pageMetadata } from '@/lib/page-meta';

// The landing page. Condensed on 2026-08-14: the prose was carried across from
// `public/index.html` a few hours earlier and read like a manifesto, so every
// section lost its second and third paragraph and kept the sentence that was
// doing the work.
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
          <div className="mark" aria-hidden="true">
            ⌂
          </div>
          <h1 className="wordmark">hausfold</h1>
          <p className="standfirst">We rebuild the Mac.</p>
          <div className="lede">
            <p>
              A new Mac takes a weekend to make yours, and by the next one you can&apos;t remember
              how you did it. hausfold turns that weekend into <strong>a file</strong> — the window
              manager, the bar, the shell, the fonts, the keys, the apps, and the several dozen macOS
              settings nobody should have to find twice.
            </p>
            <p>
              One command and the Mac matches the file. Wipe the machine, run it again, and it comes
              up the same — nothing drifts out of place, because nothing was ever dragged into it.
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

            The id is load-bearing: /desktops/ and src/app/not-found.tsx both
            point at /#desktops, as does the docs sidebar's way back out. */}
        <section className="block" id="desktops">
          <h2>Desktops</h2>
          <p>
            A desktop is the <strong>whole machine</strong>, not a theme laid over one: every choice
            above, written down together and applied in one command. Hand the file to a coder, a
            designer, or a whole floor of them, and every Mac comes up arranged the same way.
          </p>

          {/* The catalogue breaks out of the 41rem measure — see .catalogue in
              public/hausfold.css for why a picture may and prose may not.

              🚨 This section used to carry NO frame, and AGENTS.md said so:
              "a dashed empty box immediately under the page's first heading
              reads as a broken image rather than as a reserved slot." The
              user reversed that on 2026-08-14, and the reason it stops
              biting is structural rather than a change of taste — the frame
              is no longer immediately under a heading. It sits inside a
              plate, beside two paragraphs and a name, at roughly half the
              width it would have had. A slot with a caption and a label
              beside it reads as a slot; the same slot alone under an <h2>
              read as breakage.

              ONE frame here, however many the desktop's own page carries.
              The catalogue answers "which of these is mine?" and one
              establishing view per row is what that question needs; the
              gallery is on /desktops/<name>, where the reader has already
              chosen and wants to look.

              It is not a link while it is empty. When a real capture lands
              (workshop assets/SHOT-nebelhaus-desktop.md), wrap it in a
              <Link> to the desktop's page with aria-hidden + tabIndex={-1}
              so the row doesn't announce the same destination three times —
              a big picture you can't click is a frustration, but a dashed
              box promising nothing isn't one. */}
          <ul className="catalogue" role="list">
            <li className="entry" data-accent="nebelhaus">
              <div className="entry-body">
                <div className="entry-head">
                  <h3 className="entry-name">
                    <Link href="/desktops/nebelhaus">nebelhaus</Link>
                  </h3>
                  <span className="meta">developers · tiling · nix</span>
                </div>
                <p className="entry-line">
                  An opinionated macOS, raised in the fog. Tiling launched at boot, a bar across the
                  top edge, a themed zsh-and-helix terminal, Touch ID for <code>sudo</code>, and one
                  muted palette painted across every app you own.
                </p>
                <p className="entry-line">
                  <Link href="/desktops/nebelhaus">What&apos;s in it, and how to install it</Link>
                </p>
              </div>
              {/* aria-hidden: the caption repeats the name of the link three
                  lines above it, so a screen reader would announce
                  "nebelhaus" twice per row to say nothing it hasn't heard.
                  The frame is a placeholder — there is no information in it
                  a reader is missing. When a real capture lands, drop the
                  aria-hidden with it and give the <Image> alt text that
                  describes the machine rather than repeating the name. */}
              <div className="shot" aria-hidden="true">
                <span>
                  nebelhaus — the desktop
                  <br />
                  [ shot not taken yet ]
                </span>
              </div>
            </li>

            {/* 🚨 No data-accent on these two, unlike nebelhaus above, and it
                is not an oversight. The six --a-* accents belong to PRODUCTS
                and the vocabulary is closed (AGENTS.md); nebelhaus has one
                because the rice is a named thing with a hue assigned
                upstream, and everyday and minimal are selections of the same
                options rather than products of their own. So their names
                hover to plain ink. Inventing a seventh and an eighth hue to
                make the rows look uniform is exactly what the greyscale rule
                exists to stop — and the row that carries a colour is
                carrying a real distinction, not a decoration. */}
            <li className="entry">
              <div className="entry-body">
                <div className="entry-head">
                  <h3 className="entry-name">
                    <Link href="/desktops/everyday">everyday</Link>
                  </h3>
                  <span className="meta">everyone else · no code · nix</span>
                </div>
                <p className="entry-line">
                  A Mac for someone who doesn&apos;t write code. A quiet bar with the clock and the
                  weather, a search box on ⌘Space that opens anything, a wallpaper and colours that
                  agree — and none of the developer tooling. Windows behave the way they already do.
                </p>
                <p className="entry-line">
                  <Link href="/desktops/everyday">What&apos;s in it, and how to install it</Link>
                </p>
              </div>
              <div className="shot" aria-hidden="true">
                <span>
                  everyday — the desktop
                  <br />
                  [ shot not taken yet ]
                </span>
              </div>
            </li>

            <li className="entry">
              <div className="entry-body">
                <div className="entry-head">
                  <h3 className="entry-name">
                    <Link href="/desktops/minimal">minimal</Link>
                  </h3>
                  <span className="meta">developers · terminal only · nix</span>
                </div>
                <p className="entry-line">
                  Just the themed shell. A tinted prompt, the same toolbelt nebelhaus ships and the
                  colours to match, on an otherwise stock macOS. Few rooms, not few tools — nothing
                  here reaches outside the window you type in.
                </p>
                <p className="entry-line">
                  <Link href="/desktops/minimal">What&apos;s in it, and how to install it</Link>
                </p>
              </div>
              <div className="shot" aria-hidden="true">
                <span>
                  minimal — the terminal
                  <br />
                  [ shot not taken yet ]
                </span>
              </div>
            </li>
          </ul>
          <p>
            A Mac runs exactly one. A desktop picks which <strong>rooms</strong> it turns on — the
            windows, the bar, the launcher, the shelf, the terminal — and anything it chose, your own
            file overrides in a line.
          </p>
          {/* Was "One today, and that's the honest number" from 2026-08-12,
              when it was. Three now, and the sentence keeps doing the same
              job: lead with the real count rather than implying a catalogue
              that doesn't exist. The fourth desktop, `blank`, ships in the
              repo and is deliberately not listed — it is the null selection
              for someone assembling rooms by hand, not a thing to install,
              and a row for it would promise a machine it doesn't produce. */}
          <p className="aside">
            Three today, and that&apos;s the honest number — more as they&apos;re written. Every
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
            keeps its settings in a plain file you can read, diff and hand to an agent — no account,
            no subscription, nothing you can&apos;t take with you.
          </p>
          <ul className="index" role="list">
            {/* pounce points at its docs, not at a product page: it had one
                at /pounce until 2026-08-14, and it was retired into the docs
                tree rather than kept beside it. The app installs from
                Homebrew with no Nix and is read about far more than it is
                pitched, so the manual IS its front door. perch still has a
                sheet of its own — it is an App Store app with a policy URL
                and, later, a price. */}
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

            It gained a heading and the example file on 2026-08-14, when /haus
            was retired in favour of /docs/haus — the one-file demo was the
            piece of that page worth keeping on a sheet someone reads once, and
            a link with two sentences over it wasn't carrying it. Still the
            postscript by position; no longer a footnote by weight.

            haus carries no data-accent, for the same reason the ⌂ has none of
            its own: the house borrows every colour and owns none. holt and
            nebelung do carry theirs — they're products, they're just not
            products for the person the rest of this page is written for. */}
        <section className="block">
          <h2>haus</h2>
          <p>
            Underneath all of it is <strong>haus</strong>, the layer the desktops and the apps are
            written against — macOS itself, turned into options you set in a file.
          </p>
          <Command>{example}</Command>
          <p>
            Run <code>haus rebuild</code> and the Mac is that: Slack installed and on a key, tiling
            on, the terminal themed. <code>haus plan</code> shows a change before you make it, and{' '}
            <code>haus rollback</code> takes it back. That&apos;s why a desktop is a set of values
            rather than a project, and why taking one apart is editing, not forking.
          </p>
          <p className="aside">
            <Link className="index-name" href="/docs/haus">
              The docs
            </Link>{' '}
            have every room and every option — and{' '}
            <Link className="index-name" href="/docs/haus/install">
              what the install actually does
            </Link>
            , step by step, before you run it.
          </p>
        </section>

        {/* holt runs anywhere and nebelung is a palette, so neither is a
            desktop and neither is an app; a quiet line is the whole of the
            claim we want to make about them here, and both READMEs link back. */}
        <section className="block">
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
