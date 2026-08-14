import Link from 'next/link';
import { Command } from '@/components/command';
import { Colophon, Crumbs, GithubMark } from '@/components/sheet';
import { pageMetadata } from '@/lib/page-meta';

// The minimal desktop's page. The second desktop to get one, added 2026-08-14
// alongside `everyday` — the catalogue was a single row from 2026-08-08 until
// then, and AGENTS.md's bar for a second one is that it exists and a stranger
// can install it. Both are true: `hausfold/haus` ships `desktops/minimal.nix`,
// and `hausfold.co/minimal.sh` installs it.
//
// Every fact here is read off `hausfold/haus/desktops/minimal.nix` as of
// 2026-08-14 — its option set AND its header comment, which is where the
// "deliberately absent" list below comes from. Copies rot: re-read the source
// rather than trusting the page, especially the room list and the one-liner.
//
// 🚨 No `data-accent` anywhere on this page, and that is not an oversight. The
// six `--a-*` accents are the whole vocabulary (AGENTS.md), they belong to
// products, and minimal is not one. Inventing a seventh hue for a desktop is
// the exact thing the greyscale rule exists to stop.
export const metadata = pageMetadata({
  title: 'minimal — hausfold',
  description:
    'Just the themed shell. The prompt, the toolbelt and the colours, on an otherwise stock macOS.',
  path: '/desktops/minimal/',
  ogTitle: 'minimal — Just the themed shell.',
  ogDescription:
    'The prompt, the toolbelt and the colours, on an otherwise stock macOS. Few rooms, not few tools.',
});

export default function Minimal() {
  return (
    <main className="sheet sheet--inner">
      <Crumbs
        trail={[
          { href: '/', label: 'hausfold' },
          { href: '/#desktops', label: 'desktops' },
        ]}
        current="minimal"
      />

      <header className="masthead">
        <h1 className="wordmark">minimal</h1>
        <p className="standfirst">Just the themed shell.</p>
        <div className="lede">
          <p>
            The terminal, finished — a tinted prompt, a themed toolbelt, and the colours to match —
            on an otherwise <strong>stock macOS</strong>. No bar, no tiling, no launcher, no shelf.
            Nothing that changes how the Mac behaves outside the window you type in.
          </p>
          <p>
            It is still a developer machine. Minimal here means{' '}
            <strong>few rooms, not few tools</strong> — the toolbelt is the same one nebelhaus
            ships. If what you want is a Mac with no developer tooling on it at all, that one is{' '}
            <Link href="/desktops/everyday">everyday</Link>.
          </p>
        </div>
      </header>

      <section className="block">
        <h2>Install</h2>
        <Command>curl -fsSL https://hausfold.co/minimal.sh | bash</Command>
        <p className="aside">
          The URL picks the desktop, so the installer won&apos;t ask which one you want. Use{' '}
          <a href="/haus.sh">hausfold.co/haus.sh</a> to be asked instead, or{' '}
          <code>nix run github:hausfold/haus#bootstrap</code> straight from the flake once Nix is
          installed.
        </p>
        <p>
          It installs the prerequisites and scaffolds a host file for this machine, then stops — it
          won&apos;t switch a config you haven&apos;t personalised, so the first run hands the
          machine back to you. Once you&apos;ve made it yours, that first switch puts{' '}
          <code>haus</code> on your PATH: <code>haus rebuild</code> to apply a change,{' '}
          <code>haus rollback</code> to undo one, <code>haus plan</code> to see what a rebuild would
          do before it does it.
        </p>
      </section>

      <section className="block">
        <h2>What it looks like</h2>
        {/* One frame, like every other desktop page — see the longer comment
            on /desktops/nebelhaus. Empty placeholders don't multiply: one
            reserved slot reads as a promise and three read as a gallery that
            failed to load. `.gallery`'s :only-child rule renders this one
            full width, and a second real capture turns the row into the
            sideways scroller with no markup change. */}
        <div className="gallery" tabIndex={0} role="group" aria-label="Screenshots of minimal">
          <div className="shot shot--wide">
            <span>
              the terminal — zsh, the tinted prompt, helix
              <br />
              [ shot not taken yet ]
            </span>
          </div>
        </div>
      </section>

      <section className="block">
        <h2>What&apos;s in it</h2>
        {/* "Two rooms, plus the shell", not "four rooms": `hearth` has no
            enable switch — it ships with every desktop, `blank` included —
            and `theme.accent` is tuning rather than a room. What minimal
            actually SELECTS is developer + collar. Read desktops/minimal.nix
            before changing this sentence; an earlier draft said four and was
            wrong. */}
        <p>
          Two rooms, plus the shell every desktop starts with — and nothing that reaches past the
          terminal window. Each is the same module nebelhaus uses: this desktop selects fewer of
          them, it doesn&apos;t use lesser ones.
        </p>
        <dl className="facts">
          <dt>hearth</dt>
          <dd>
            zsh, a tinted starship prompt, git, helix and a themed toolbelt — and zellij opens
            locked, so the multiplexer&apos;s own keys stay out of your way until you ask for them
          </dd>

          <dt>developer</dt>
          <dd>the toolbelt, with Node wired up</dd>

          <dt>collar</dt>
          <dd>Touch ID for sudo, and rebuilds that don&apos;t stop to ask twice</dd>

          <dt>theme</dt>
          <dd>the accent the palette is built from — mauve, until you say otherwise</dd>
        </dl>
        <p className="aside">
          Mono is set to 19pt, up from the room&apos;s 13 — a deliberate default rather than a
          leftover. This desktop is a terminal, and a terminal you read all day is worth the size.
        </p>
      </section>

      <section className="block">
        <h2>What it deliberately leaves out</h2>
        <p>
          Every one of these is absent for the same reason — it would reach outside the terminal,
          which is the one promise this desktop makes. All of them are a line in your own host file
          away if you disagree.
        </p>
        <dl className="facts">
          <dt>coding agents</dt>
          <dd>
            a room of their own; <code>haus.ai.enable = true</code> brings them here
          </dd>

          <dt>theme ports</dt>
          <dd>they write theme files into apps this desktop never installed</dd>

          <dt>the wallpaper</dt>
          <dd>the desktop picture is not the shell</dd>

          <dt>a video player</dt>
          <dd>
            an editorial app pick, and the one thing here you may miss from nebelhaus —{' '}
            <code>haus.apps.videoPlayer.enable = true</code> brings IINA back in one line
          </dd>

          <dt>hush, and the tour</dt>
          <dd>a Focus switch and a tutor both teach moves this selection doesn&apos;t ship</dd>
        </dl>
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
          <dd>the first switch needs sudo</dd>
        </dl>
      </section>

      <section className="block">
        <h2>Elsewhere</h2>
        <ul className="plain" role="list">
          <li>
            <Link className="index-name" href="/desktops/nebelhaus">
              nebelhaus
            </Link>{' '}
            — the same toolbelt, with the whole machine arranged around it.
          </li>
          <li>
            <Link className="index-name" href="/desktops/everyday">
              everyday
            </Link>{' '}
            — a Mac for someone who doesn&apos;t write code.
          </li>
          <li>
            <a className="index-name" href="https://github.com/hausfold/haus">
              github.com/hausfold/haus
            </a>{' '}
            — the flake, and <code>desktops/minimal.nix</code> in full.
          </li>
        </ul>
      </section>

      <Colophon>
        <GithubMark />
      </Colophon>
    </main>
  );
}
