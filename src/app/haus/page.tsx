import Link from 'next/link';
import { Command } from '@/components/command';
import { Colophon, Crumbs, GithubMark } from '@/components/sheet';
import { pageMetadata } from '@/lib/page-meta';

// The platform page, ported from `public/haus/index.html`. Not a product page
// — it is the floor the products stand on, which is why the landing page
// closes on it rather than opening with it.
export const metadata = pageMetadata({
  title: 'haus — hausfold',
  description:
    'The nix-darwin layer every hausfold desktop is built on. Describe the machine you want in one file, run one command, and the Mac matches it — tiling, bar, shell, fonts, keys, apps and the macOS defaults nobody should have to find twice.',
  path: '/haus/',
  ogTitle: 'haus — The Mac, written down.',
  ogDescription:
    'One file describes the machine. One command makes the Mac match it. A desktop is a set of values for these options — take one as it comes, or write your own.',
});

const example = `{
  haus.git.name = "Ada Lovelace";
  haus.git.email = "ada@example.com";

  haus.prowl.enable = true;   # tiling, Caps Lock as the leader key
  haus.sill.enable = true;    # the bar on the top edge
  haus.pounce.enable = true;  # the launcher, on ⌘Space

  haus.roster = {
    # installed, and on Caps Lock + s
    slack = { cask = "slack"; name = "Slack"; key = "s"; };
    # installed, no key
    figma = { cask = "figma"; };
  };
}`;

export default function Haus() {
  return (
    <main className="sheet sheet--inner">
      <Crumbs trail={[{ href: '/', label: 'hausfold' }]} current="haus" />

      <header className="masthead">
        <h1 className="wordmark">haus</h1>
        <p className="standfirst">The Mac, written down.</p>
        <div className="lede">
          <p>
            <strong>haus is the layer everything else stands on</strong> — a set of nix-darwin
            modules with one namespace over them. You describe the machine you want in a single
            file, run one command, and the Mac matches the file: the window manager, the bar, the
            shell, the fonts, the keybindings, the apps, and the several dozen macOS defaults nobody
            should have to find twice.
          </p>
          <p>
            It is not a dotfiles repo you fork and then maintain. Every part of the machine is an{' '}
            <em>option</em> with a name and a default, so the file you keep is the handful of lines
            where your Mac differs from the one we&apos;d hand you.
          </p>
          <p>
            A desktop — <Link href="/desktops/nebelhaus">nebelhaus</Link>, say — isn&apos;t a
            different program. It&apos;s a set of values for these options. Take one as it comes,
            change a line, or write your own from the same parts.
          </p>
        </div>
      </header>

      <section className="block">
        <h2>One file</h2>
        <Command>{example}</Command>
        <p>
          That&apos;s a whole machine&apos;s worth of decisions in the form they&apos;re actually
          made: one file, plain data, no scripts to read. Run <code>haus rebuild</code> and the Mac
          is that. Wipe it, run it again, and the Mac is that again — the file is the machine, so
          nothing drifts out of place because nothing was ever dragged into it.
        </p>
        <p className="aside">
          Options you don&apos;t set keep their default, and the defaults are a working Mac rather
          than an empty one. Nothing above is required to start; a first file that sets a name and
          an email produces a machine you can use.
        </p>
      </section>

      <section className="block">
        <h2>The commands</h2>
        <dl className="facts">
          <dt>haus rebuild</dt>
          <dd>apply the file to this Mac</dd>

          <dt>haus plan</dt>
          <dd>what a rebuild would change, before it changes it</dd>

          <dt>haus set</dt>
          <dd>change one option without opening an editor</dd>

          <dt>haus rollback</dt>
          <dd>the machine you had an hour ago, back</dd>

          <dt>haus update</dt>
          <dd>move to a newer haus, deliberately, not on someone else&apos;s clock</dd>

          <dt>haus doctor</dt>
          <dd>what this machine is missing, and what to do about it</dd>
        </dl>
        <p className="aside">
          Rollback is the load-bearing one. A change to a Mac is normally something you undo by
          remembering what you did; here every rebuild leaves a generation behind, so undoing is a
          command rather than an archaeology. These six are the ones you&apos;ll use; there are a
          dozen more — <code>status</code>, <code>diff</code>, <code>generations</code>,{' '}
          <code>capture</code> among them — and <code>haus --help</code> lists them all.
        </p>
      </section>

      <section className="block">
        <h2>What it covers</h2>
        <p>
          The parts of a Mac that usually take an afternoon each, and then take it again on the next
          machine.
        </p>
        <dl className="facts">
          <dt>windows</dt>
          <dd>tiling, launched at boot, one leader key instead of a chord</dd>

          <dt>the bar</dt>
          <dd>the clock, battery, media and whatever else you put up there</dd>

          <dt>the shell</dt>
          <dd>zsh, a prompt, git, an editor and a themed toolbelt</dd>

          <dt>colour and type</dt>
          <dd>one palette and one font ramp, applied to everything at once</dd>

          <dt>apps</dt>
          <dd>one list, whatever the source, each with an optional launcher key</dd>

          <dt>macOS itself</dt>
          <dd>the defaults you&apos;d otherwise hunt through System Settings for</dd>

          <dt>Touch ID</dt>
          <dd>sudo without the password, and rebuilds that don&apos;t stop to ask</dd>

          <dt>secrets</dt>
          <dd>which secrets a machine needs, declared — never the values</dd>
        </dl>
      </section>

      <section className="block">
        <h2>Take it as it comes, or take it apart</h2>
        <p>
          A machine runs exactly one <strong>desktop</strong>, and four ship with it —{' '}
          <code>nebelhaus</code>, <code>everyday</code>, <code>minimal</code> and{' '}
          <code>blank</code>. A desktop is data, not code: one file whose only key is{' '}
          <code>haus</code>, which you can read in a minute and know the worst it can do. The axis
          is rooms, not tools: <code>nebelhaus</code> turns nearly every room on,{' '}
          <code>minimal</code> keeps the same toolbelt with almost none of them,{' '}
          <code>everyday</code> is the one that isn&apos;t a developer&apos;s machine at all, and{' '}
          <code>blank</code> starts you from nothing.
        </p>
        <p>
          Nothing is all-or-nothing. Anything a desktop chose, your own file overrides in a line —
          and a single room can be imported into a config you already have, leaving the rest of your
          machine alone: the bar without the tiling, the shell without either.
        </p>
      </section>

      <section className="block">
        <h2>Elsewhere</h2>
        <ul className="plain" role="list">
          <li>
            <Link className="index-name" href="/#desktops">
              desktops
            </Link>{' '}
            — the machines already built on it, ready to run.
          </li>
          <li>
            <a className="index-name" href="https://nebelhaus.com">
              nebelhaus.com
            </a>{' '}
            — the docs: every option, and the guides.
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
