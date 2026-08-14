import { Command } from '@/components/command';
import { Colophon, Crumbs, GithubMark } from '@/components/sheet';
import { pageMetadata } from '@/lib/page-meta';

// The nebelhaus desktop's own page, ported from
// `public/desktops/nebelhaus/index.html`.
//
// Every fact here is copied from that desktop's repo, and copies rot: the page
// mirrors `hausfold/haus`'s README and bootstrap as of 2026-08-08. Re-read the
// source rather than trusting the page — especially the install one-liner and
// the requirements, the two that hurt.
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
            macOS arranged like a tiling Linux rig but native to the grain of the Mac —{' '}
            <strong>one Nix flake raises the whole house</strong>. Fog-grey, quiet, and
            reproducible: wipe the machine, run one command, and the house stands again exactly as
            it was.
          </p>
          <p>
            You never edit the rice to use it. The installer scaffolds a thin config of your own at{' '}
            <code>~/.config/nix</code> that consumes it as an input, so your machine stays yours and
            the rice stays upstream.
          </p>
        </div>
      </header>

      <section className="block">
        <h2>Install</h2>
        <Command>curl -fsSL https://hausfold.co/nebelhaus.sh | bash</Command>
        <p className="aside">
          Or straight from the flake, once Nix is installed:{' '}
          <code>nix run github:hausfold/haus#bootstrap</code>
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
        <div className="shots">
          <div className="shot shot--wide">
            <span>
              the desktop — tiled, with the bar
              <br />
              [ shot not taken yet ]
            </span>
          </div>
          <div className="shot">
            <span>
              pounce, mid-launch
              <br />
              [ shot not taken yet ]
            </span>
          </div>
          <div className="shot">
            <span>
              the terminal — zsh, helix, lazygit
              <br />
              [ shot not taken yet ]
            </span>
          </div>
        </div>
      </section>

      <section className="block">
        <h2>What&apos;s in it</h2>
        <p>
          The house is built from composable nix-darwin modules. Take the whole thing, or import one
          room into a config of your own.
        </p>
        <dl className="facts">
          <dt>den</dt>
          <dd>macOS defaults, the Homebrew framework, core CLI tools, fonts</dd>

          <dt>prowl</dt>
          <dd>AeroSpace tiling, launched at boot, Caps Lock as the leader key</dd>

          <dt>sill</dt>
          <dd>a SketchyBar bar perched on the top edge</dd>

          <dt>hearth</dt>
          <dd>zsh, a tinted starship prompt, git, helix and a themed toolbelt</dd>

          <dt>collar</dt>
          <dd>Touch ID for sudo, and rebuilds that don&apos;t stop to ask twice</dd>

          <dt>secrets</dt>
          <dd>declarative secrets — projects commit which, never the values</dd>

          <dt>pounce</dt>
          <dd>the launcher on ⌘Space, its permissions intact across rebuilds</dd>

          <dt>perch</dt>
          <dd>the notch file shelf, installed and kept at a fixed path</dd>

          <dt>hush</dt>
          <dd>one hotkey for Focus, with optional shell and Slack hooks</dd>

          <dt>theme</dt>
          <dd>the wallpaper and a wordmark derived from your accent</dd>

          <dt>apps</dt>
          <dd>the picks a finished machine gets, one switch each</dd>
        </dl>
        <p className="aside">
          nebelhaus is one desktop of four that ship with haus — the others are{' '}
          <code>everyday</code>, <code>minimal</code> and <code>blank</code>, and a Mac runs exactly
          one. A desktop is data, not code: one file whose only key is <code>haus</code>, which you
          can read in a minute and know the worst it can do.
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
          <dd>the first switch needs sudo</dd>
        </dl>
      </section>

      <section className="block">
        <h2>Elsewhere</h2>
        <ul className="plain" role="list">
          <li>
            <a className="index-name" href="https://nebelhaus.com">
              nebelhaus.com
            </a>{' '}
            — the docs, the guides, and support.
          </li>
          <li>
            <a className="index-name" href="https://nebelhaus.com/start/first-run/">
              first run
            </a>{' '}
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
