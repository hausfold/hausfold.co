import Link from 'next/link';
import { Command } from '@/components/command';
import { Colophon, Crumbs, GithubMark } from '@/components/sheet';
import { pageMetadata } from '@/lib/page-meta';

// The everyday desktop's page, added 2026-08-14 with `minimal`.
//
// Every fact here is read off `hausfold/haus/desktops/everyday.nix` as of
// 2026-08-14 — its option set AND its header comment, which is where the
// judgement calls below come from almost verbatim. That file argues its own
// choices better than a marketing page could, and the argument is the reason
// to trust the desktop, so it is carried across rather than summarised away.
// Copies rot: re-read the source, especially the room list and the one-liner.
//
// 🚨 This is the one page on the site written for a reader who is NOT the
// person the rest of it addresses — someone who doesn't write code and may be
// installing this because somebody else told them to. Two consequences that
// are easy to undo by accident: the sudo requirement is stated plainly rather
// than buried at the bottom of a list, and nothing here assumes the reader
// knows what a flake, a room or a rebuild is before the page says so.
//
// No `data-accent`, same as /desktops/minimal — the six accents belong to
// products and a desktop is not one. See that page's header.
export const metadata = pageMetadata({
  title: 'everyday — hausfold',
  description:
    'A Mac for someone who doesn’t write code. A better menu bar, a search box that opens anything, and none of the developer tooling.',
  path: '/desktops/everyday/',
  ogTitle: 'everyday — A Mac for someone who doesn’t write code.',
  ogDescription:
    'A better menu bar, a search box that opens anything, and none of the developer tooling. The window behaviour stays the one they already know.',
});

export default function Everyday() {
  return (
    <main className="sheet sheet--inner">
      <Crumbs
        trail={[
          { href: '/', label: 'hausfold' },
          { href: '/#desktops', label: 'desktops' },
        ]}
        current="everyday"
      />

      <header className="masthead">
        <h1 className="wordmark">everyday</h1>
        <p className="standfirst">A Mac for someone who doesn&apos;t write code.</p>
        <div className="lede">
          <p>
            The same care, aimed at a machine that will never open a terminal. A quiet bar with the
            clock, the battery and the weather; a search box on ⌘Space that opens anything; a
            wallpaper and a set of colours that agree with each other. And{' '}
            <strong>none of the developer tooling</strong> — no compilers, no agents, nothing
            installed for a job this Mac isn&apos;t doing.
          </p>
          <p>
            It is a whole answer, not a stripped-down one. Windows behave exactly the way they
            already do, because the fastest way to lose someone is to change what their machine does
            when they click.
          </p>
        </div>
      </header>

      <section className="block">
        <h2>Install</h2>
        <Command>curl -fsSL https://hausfold.co/everyday.sh | bash</Command>
        <p className="aside">
          The URL picks the desktop, so the installer won&apos;t ask which one you want. Use{' '}
          <a href="/haus.sh">hausfold.co/haus.sh</a> to be asked instead.
        </p>
        <p>
          It installs what it needs and writes a config file for this machine, then stops — the
          first run hands the Mac back to you rather than rearranging it behind your back. It will
          ask for your password once, and it sets things up so it doesn&apos;t have to ask again
          every time.
        </p>
        <p className="aside">
          🚨 It needs an admin account, and the first setup takes a while — this is not a five
          second install. If you are doing this for someone else, do it while sitting next to them.
        </p>
      </section>

      <section className="block">
        <h2>What it looks like</h2>
        {/* One frame, like every other desktop page — see the longer comment
            on /desktops/nebelhaus. */}
        <div className="gallery" tabIndex={0} role="group" aria-label="Screenshots of everyday">
          <div className="shot shot--wide">
            <span>
              the desktop — the bar, the wallpaper, ordinary windows
              <br />
              [ shot not taken yet ]
            </span>
          </div>
        </div>
      </section>

      <section className="block">
        <h2>What&apos;s in it</h2>
        <dl className="facts">
          <dt>the bar</dt>
          <dd>a clock, battery and weather along the top edge — a better menu bar, not a new one</dd>

          <dt>the launcher</dt>
          <dd>⌘Space opens a search box that finds and opens things</dd>

          <dt>the shelf</dt>
          <dd>a place in the notch for files on their way somewhere else</dd>

          <dt>Focus</dt>
          <dd>one key to go quiet, and one to come back</dd>

          {/* `wallpaper.style = "minimal"` — the haus mark on a flat field in
              your palette. It is `bold` that derives from the accent, so
              don't "improve" this line back to "built from your accent". */}
          <dt>the look</dt>
          <dd>the haus mark on your palette as a wallpaper, and apps themed to agree with it</dd>

          <dt>a video player</dt>
          <dd>IINA, which opens the formats Quick Look won&apos;t</dd>

          <dt>a first lap</dt>
          <dd>one prompt, once: press ⌘Space, type, hit return. That is the whole tutorial</dd>
        </dl>
      </section>

      <section className="block">
        <h2>The judgement calls</h2>
        <p>
          A desktop is a set of decisions somebody made on your behalf, so these are the four worth
          seeing before you install it. Every one of them is a line in your own file away.
        </p>
        <dl className="facts">
          <dt>tiling is off</dt>
          <dd>
            Tiling is good; remapping Caps Lock to a leader key on someone else&apos;s Mac is not.
            Windows keep the behaviour they already know — which is also why this desktop claims no
            leader key at all.
          </dd>

          <dt>the launcher is on</dt>
          <dd>
            A search box that opens things is legible to anyone. It is the one power feature that
            needs no explanation.
          </dd>

          <dt>the bar is on</dt>
          <dd>
            A clock, a battery and the weather is a better menu bar — not a different way of
            thinking about the screen.
          </dd>

          <dt>developer tooling is off, and agents with it</dt>
          <dd>
            Coding agents on a machine that ships no coding tools is a room enabling itself for
            nobody. If you want them, <code>haus.ai.enable = true</code> is the line.
          </dd>
        </dl>
        <p className="aside">
          If you used the old <code>everyday</code> preset, this is the same idea rebuilt as a whole
          desktop rather than a layer over another one — and two things it used to inherit are now
          deliberately off: the coding agents, and the Node toolchain that came with them.{' '}
          <a href="https://github.com/hausfold/haus/blob/main/desktops/everyday.nix">
            The file states every difference in full
          </a>
          .
        </p>
      </section>

      <section className="block">
        <h2>What it needs</h2>
        <dl className="facts">
          <dt>macOS</dt>
          <dd>the installer stops on anything that isn&apos;t a Mac</dd>

          <dt>Xcode CLT</dt>
          <dd>installed for you if it isn&apos;t there</dd>

          <dt>Nix</dt>
          <dd>
            Determinate Nix, installed for you. An existing Nix that Determinate doesn&apos;t own
            has to be removed first.
          </dd>

          <dt>an admin account</dt>
          <dd>the first setup needs your password</dd>
        </dl>
      </section>

      <section className="block">
        <h2>Elsewhere</h2>
        <ul className="plain" role="list">
          <li>
            <Link className="index-name" href="/desktops/nebelhaus">
              nebelhaus
            </Link>{' '}
            — the same house, for someone who lives in a terminal.
          </li>
          <li>
            <Link className="index-name" href="/desktops/minimal">
              minimal
            </Link>{' '}
            — just the themed shell, and nothing else.
          </li>
          <li>
            <a className="index-name" href="https://github.com/hausfold/haus">
              github.com/hausfold/haus
            </a>{' '}
            — the flake, and <code>desktops/everyday.nix</code> in full.
          </li>
        </ul>
      </section>

      <Colophon>
        <GithubMark />
      </Colophon>
    </main>
  );
}
