import Link from 'next/link';
import { Command } from '@/components/command';
import { Colophon, Crumbs, GithubMark } from '@/components/sheet';
import { pageMetadata } from '@/lib/page-meta';

// The nebelhaus desktop's own page.
//
// Every fact here is copied from somewhere else, and copies rot. It was
// mirroring `hausfold/haus`'s README as of 2026-08-08 and had drifted by
// 2026-08-14: it listed haus's internal module names (den, prowl, sill,
// hearth, collar…) at a reader who will only ever meet the **rooms** those
// modules implement, and it claimed the installer runs on any Mac when it
// stops on Intel. Both are now taken from `content/docs/` — the ported docs
// were verified against haus itself, they live in this repo, and CI regenerates
// the options reference from haus's own module system. Check this page against
// `content/docs/haus/install.mdx` and `content/docs/haus/desktops/choosing.mdx`
// rather than against a README in another repo.
export const metadata = pageMetadata({
  title: 'nebelhaus — hausfold',
  description:
    'An opinionated macOS, raised in the fog. Tiling windows, a bar, a themed terminal — the whole Mac in one Nix flake.',
  path: '/desktops/nebelhaus/',
  ogTitle: 'nebelhaus — An opinionated macOS, raised in the fog.',
  ogDescription:
    'Tiling windows, a bar, a themed terminal — the whole Mac in one Nix flake. Silver-grey, keyboard-first, reproducible.',
});

export default function Nebelhaus() {
  return (
    <main className="sheet sheet--inner">
      {/* Two crumbs, not three, even though the URL has three segments. The
          middle one used to be /desktops; that page folded into the landing
          page's first section on 2026-08-12 and the path now only 301s, so a
          crumb pointing at it would be a link to a redirect. The URL keeps its
          /desktops/ segment on purpose — it is the namespace the second and
          third desktop will land in, and this page's canonical has been shared
          as-is. */}
      <Crumbs
        trail={[
          { href: '/', label: 'hausfold' },
          { href: '/#desktops', label: 'desktops' },
        ]}
        current="nebelhaus"
      />

      <header className="masthead">
        <h1 className="wordmark">nebelhaus</h1>
        <p className="standfirst">An opinionated macOS, raised in the fog.</p>
        <div className="lede">
          <p>
            A Mac arranged like a tiling Linux rig, but native to the grain of the Mac —{' '}
            <strong>one command raises the whole house</strong>. Fog-grey, keyboard-first, and the
            same after you wipe the machine.
          </p>
          <p>
            You never edit the desktop to use it. The installer scaffolds a thin config of your own
            at <code>~/.config/nix</code> that consumes it as an input, so your machine stays yours
            and nebelhaus stays upstream.
          </p>
        </div>
      </header>

      <section className="block">
        <h2>Install</h2>
        <Command>curl -fsSL https://hausfold.co/nebelhaus.sh | bash</Command>
        <p>
          It installs Nix if you don&apos;t have it, asks you a few things — your name, an accent
          colour, an editor — and writes your config. It does <strong>not</strong> change the Mac on
          its own: it prints the one command that activates all of it, and asks first. So you can
          stop between the two and read what the first one wrote.
        </p>
        <p className="aside">
          <Link href="/docs/haus/install">What the install does</Link>, step by step — including how
          to read the script before you pipe it anywhere.
        </p>
      </section>

      <section className="block">
        <h2>What it looks like</h2>
        {/* One frame, not three. They are deliberately empty placeholders
            (AGENTS.md: never a stale screenshot), and three dashed boxes in a
            row spend a third of the page saying nothing — one reserved slot
            reads as a promise, three read as a gallery that failed to load.
            The scene and the crop are in the workshop's
            SHOT-nebelhaus-desktop.md; when the capture exists, drop an
            <Image> in and delete the label. */}
        <div className="shots">
          <div className="shot shot--wide">
            <span>
              the desktop — tiled, with the bar
              <br />
              [ shot not taken yet ]
            </span>
          </div>
        </div>
      </section>

      <section className="block">
        <h2>What you get</h2>
        <p>
          haus is organised into <strong>rooms</strong>, each one a capability with its own switch.
          nebelhaus turns nearly all of them on.
        </p>
        <dl className="facts">
          <dt>windows</dt>
          <dd>tiling launched at boot, and Caps Lock as the leader key instead of a chord</dd>

          <dt>the bar</dt>
          <dd>workspaces, weather, media, battery, clock — and a light that reddens when something has stopped</dd>

          <dt>the launcher</dt>
          <dd>pounce on ⌘Space, where every command is a file you can write</dd>

          <dt>the shelf</dt>
          <dd>perch, dropping out of the notch to catch a drag on its way somewhere else</dd>

          <dt>the terminal</dt>
          <dd>Ghostty, zellij, zsh, a tinted prompt, helix and a toolbelt that all matches</dd>

          <dt>focus</dt>
          <dd>one hotkey for Do Not Disturb, your Slack status, and your own hooks</dd>

          <dt>security</dt>
          <dd>Touch ID for <code>sudo</code>, inside a multiplexer too, and secrets declared rather than pasted</dd>

          <dt>agents</dt>
          <dd>coding agents, each in its own checkout of the repo, so they never collide</dd>

          <dt>the colours</dt>
          <dd>the nebelung palette and a generated wallpaper, rendered onto twenty-odd tools at once</dd>
        </dl>
        <p className="aside">
          nebelhaus is one desktop of four — the others are <code>everyday</code>,{' '}
          <code>minimal</code> and <code>blank</code>, and a Mac runs exactly one. Anything it chose,
          your own file overrides in a line.
        </p>
      </section>

      <section className="block">
        <h2>What it needs</h2>
        <dl className="facts">
          <dt>a Mac on Apple Silicon</dt>
          <dd>running a recent macOS. Intel isn&apos;t supported</dd>

          <dt>Xcode Command Line Tools</dt>
          <dd>the installer prompts for them if they&apos;re missing</dd>

          <dt>Nix</dt>
          <dd>
            Determinate Nix, installed for you. If you already run stock Nix it stops and explains
            rather than touching it
          </dd>

          <dt>10–15 minutes</dt>
          <dd>and a few GB of download, for the first build only</dd>
        </dl>
      </section>

      <section className="block">
        <h2>Elsewhere</h2>
        {/* These pointed at nebelhaus.com until 2026-08-14. The docs are in
            this repo now (content/docs/), so the outward links were sending
            readers to the older of two live copies — see AGENTS.md on the
            301s that finally retire that tree. */}
        <ul className="plain" role="list">
          <li>
            <Link className="index-name" href="/docs/nebelhaus">
              the docs
            </Link>{' '}
            — what it is, and whether it&apos;s for you.
          </li>
          <li>
            <Link className="index-name" href="/docs/nebelhaus/first-run">
              first run
            </Link>{' '}
            — what to do once it&apos;s on the machine.
          </li>
          <li>
            <a className="index-name" href="https://github.com/hausfold/haus">
              github.com/hausfold/haus
            </a>{' '}
            — the flake itself.
          </li>
        </ul>
      </section>

      <Colophon>
        <GithubMark />
      </Colophon>
    </main>
  );
}
