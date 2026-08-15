import Link from 'next/link';
import { Command } from '@/components/command';
import { Colophon, Crumbs } from '@/components/sheet';
import { pageMetadata } from '@/lib/page-meta';

// perch's product page, ported from `public/perch/index.html`.
//
// ⚠️ `workshop/web/src/pages/perch.astro` is still what `nebelhaus.com/perch`
// serves. Two pages about one product will not agree for long — fix a fact in
// both or in neither until the 301s land.
//
// 🚨 Since 2026-08-14 perch also has a docs tree, `content/docs/perch/`, and
// this page did NOT get retired into it the way /pounce did. The split is by
// shape, not by subject: this is a **sales sheet** — a policy URL, a download,
// and later a price — and a manual is the wrong container for any of those.
// The cost is the duplicate-fact risk the warning above describes, one repo
// closer to home: the behaviour list below and `/docs/perch/using` say the
// same things, so a fact fixed here is fixed there in the same commit or in
// neither. Anything that is only ever *read* rather than *pitched* belongs in
// the tree alone.
export const metadata = pageMetadata({
  title: 'perch — hausfold',
  description:
    "A shelf that drops out of the notch to catch whatever you're dragging. Pile things in, carry them out in one motion. Native, quiet, and it never touches your originals.",
  path: '/perch/',
  ogTitle: 'perch — A shelf in the notch.',
  ogDescription:
    'Start dragging, flick up to the notch, and a shelf drops down to catch it. Pile in as much as you like, then carry the lot somewhere else in one motion.',
});

export default function Perch() {
  return (
    <main className="sheet sheet--inner">
      <Crumbs trail={[{ href: '/', label: 'hausfold' }]} current="perch" />

      <header className="masthead">
        <h1 className="wordmark">perch</h1>
        <p className="standfirst">A shelf in the notch.</p>
        <div className="lede">
          <p>
            You know the dance. Drag a file, realise the window you wanted is buried under four
            others, let go, dig it out, drag again.
          </p>
          <p>
            Perch ends it. Start dragging <strong>anything</strong>, flick up to the notch, and a
            small shelf drops down to catch it. Pile in as much as you like, from as many places as
            you like — then grab any tile and carry the whole group to its real home in one motion.
          </p>
          <p>
            It has no Dock icon and asks for no permissions. It sees what you drop on it, and
            nothing else.
          </p>
        </div>
      </header>

      <section className="block">
        <h2>Install</h2>
        <Command>brew install --cask hausfold/tap/perch</Command>
        <p className="aside">
          Prefer a download?{' '}
          {/* A plain <a>, deliberately, even though the path is internal:
              /download/<app> is a `worker.js` route, not a Next route, so
              next/link would try to client-navigate to a page the router has
              never heard of. Internal-but-not-a-route is the one case where
              the <Link> rule doesn't apply. */}
          The <a href="/download/perch">latest release</a> is the same build — signed with our Apple
          Developer ID and notarized, so it opens straight away with no Gatekeeper prompt and no
          quarantine hack.
        </p>
      </section>

      <section className="block">
        <h2>One setting to turn off</h2>
        <p>
          In System Settings ▸ Desktop &amp; Dock, turn <em>off</em> “Drag windows to top of screen
          to enter Mission Control”. macOS arms that top-edge trigger for the whole of any drag —
          files included — and it fires over the same band the shelf lives in. Leave it on and the
          Dock steals the drop. It&apos;s the only thing perch asks of your Mac.
        </p>
      </section>

      <section className="block">
        <h2>What it looks like</h2>
        <div className="shots">
          <div className="shot shot--wide">
            <span>
              the shelf, mid-drag
              <br />
              [ shot not taken yet ]
            </span>
          </div>
          <div className="shot">
            <span>
              a full shelf
              <br />
              [ shot not taken yet ]
            </span>
          </div>
          <div className="shot">
            <span>
              carrying the lot out
              <br />
              [ shot not taken yet ]
            </span>
          </div>
        </div>
      </section>

      <section className="block">
        <h2>How it behaves</h2>
        <dl className="facts">
          <dt>drop</dt>
          <dd>
            files, folders, Photos exports, images dragged out of Safari, links and plain text all
            land in the same shelf
          </dd>

          <dt>carry</dt>
          <dd>
            take one tile or grab the stack and take the lot; whatever the destination accepts
            leaves the shelf, and a refused drop springs back
          </dd>

          <dt>copies</dt>
          <dd>
            perch stages its own copy and hands out copies. It never moves, renames, edits or
            deletes the thing you dropped in — an interrupted drag cannot lose data
          </dd>

          <dt>patience</dt>
          <dd>
            a tile only appears once its copy has finished. Nothing on the shelf is half-written,
            and quitting doesn&apos;t lose it
          </dd>

          <dt>quiet</dt>
          <dd>
            no Dock icon, no Accessibility, no Input Monitoring, no Screen Recording, no telemetry.
            Nothing about your files is ever written to a log
          </dd>

          <dt>offline</dt>
          <dd>
            the only thing perch sends to the internet is an hourly look at its own release tag, and
            Settings turns that off. It also listens on your own network for an iPhone you paired
            yourself — encrypted end to end, and off in Settings if you don&apos;t want it
          </dd>
        </dl>
      </section>

      <section className="block">
        <h2>What it needs</h2>
        <dl className="facts">
          <dt>macOS 14</dt>
          <dd>
            or newer. A notch is nice, not required — the shelf works on any Mac and on any display
          </dd>

          <dt>nothing else</dt>
          <dd>
            no account and no sign-in. Perch asks for none of the permissions that make a Mac app
            feel invasive — no Accessibility, no Input Monitoring, no Screen Recording
          </dd>
        </dl>
        <p className="aside">
          Perch also has a <Link href="/docs/haus/rooms/shelf">room in haus</Link>, where it&apos;s
          installed and kept up to date with the rest of the house. Standalone and in-the-house are
          the same app.
        </p>
      </section>

      <section className="block">
        <h2>Questions</h2>
        <dl className="facts">
          <dt>fair source</dt>
          <dd>
            every line of perch is public and readable on GitHub, and each release becomes
            Apache-2.0 two years after it ships. Until then you may read it, change it and build it
            for yourself — what you may not do is turn it into a competing product or hand out your
            own builds of it. That&apos;s <a href="https://fsl.software">fair source</a>, and
            it&apos;s the honest version of “mostly open”
          </dd>

          <dt>my files</dt>
          <dd>
            they stay where they are. Perch keeps its copies inside its own sandbox container, and
            it only ever knows about the things you dragged onto it
          </dd>

          <dt>a shelf app?</dt>
          <dd>
            there are others, and they&apos;re good. Perch&apos;s angle is dependability and
            restraint: copies rather than moves, no permissions to grant, no telemetry, and a shelf
            that lives where your hand already is
          </dd>
        </dl>
      </section>

      <section className="block">
        <h2>Elsewhere</h2>
        <ul className="plain" role="list">
          {/* Inward the day the inward page existed, which is the rule this
              site applies to every link: perch got a docs tree of its own on
              2026-08-14 and this row landed with it. */}
          <li>
            <Link className="index-name" href="/docs/perch">
              the perch docs
            </Link>{' '}
            — the shelf in full: what it catches, what it keeps, every setting.
          </li>
          <li>
            <a className="index-name" href="https://github.com/hausfold/perch">
              github.com/hausfold/perch
            </a>{' '}
            — the source, the changelog, and where to file a bug.
          </li>
          <li>
            <Link className="index-name" href="/perch/privacy">
              privacy
            </Link>{' '}
            — the whole policy, which is shorter than this page.
          </li>
        </ul>
      </section>

      {/* The one page whose pre-release note is its own: perch#57 turned
          retention off by default and made Clear ask first, so this page can
          say what the shelf does instead of the general promise every other
          colophon makes. */}
      <Colophon note="Your originals are never moved, renamed or touched, and nothing leaves the shelf on its own — clearing it asks first, and the expiry timer is off unless you turn it on. That's the intent, not a warranty.">
        <Link href="/terms">terms</Link>
        <Link href="/refunds">refunds</Link>
      </Colophon>
    </main>
  );
}
