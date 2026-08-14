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
//
// 🚨 It also carries what used to be the `/docs/nebelhaus` tree. That tab was
// retired on 2026-08-14 when the docs switcher's axis became "the layer, and
// the apps": a desktop is a set of values for haus's own options rather than a
// subject of its own, so `first-run` and `keybindings` were retired *here*,
// and `/docs/nebelhaus/*` now 301s to this page. It is explicitly a holding
// position — the user's word was "for now".
//
// What came across is what a first week actually needs, and no more. The
// terminal chords, service mode and the Ghostty unbindings did NOT: they are
// layer facts, not this desktop's, and they live in /docs/haus/rooms/development
// and /docs/haus/rooms/windows, which this page links rather than repeats.
//
// The keys are `.facts` lists, not tables, because `public/hausfold.css` has no
// table styles at all — that is deliberate ("a table would rule four lines to
// say two"), and a dt/dd pair is the same key→meaning shape anyway.
export const metadata = pageMetadata({
  title: 'nebelhaus — hausfold',
  description:
    'An opinionated macOS, raised in the fog. Tiling windows, a bar, a themed terminal — the whole Mac in one Nix flake.',
  path: '/desktops/nebelhaus/',
  ogTitle: 'nebelhaus — An opinionated macOS, raised in the fog.',
  ogDescription:
    'Tiling windows, a bar, a themed terminal — the whole Mac in one Nix flake. Silver-grey, keyboard-first, reproducible.',
});

// The three tweaks people reach for first, carried over from the retired
// `/docs/nebelhaus/first-run` page. A `<Command>` block, not a code fence:
// this half of the site has no syntax highlighter and doesn't want one.
const settings = `haus.theme.accent = "sapphire";        # one accent, everywhere
haus.hearth.editorName = "neovim";     # named, so haus installs it

haus.roster.slack = {                  # an app, with a launcher key
  key = "s";
  name = "Slack";
  appId = "com.tinyspeck.slackmacgap";
  cask = "slack";
};
haus.workspaces.S = {                  # …and a workspace of its own
  key = "s";
  icon = ":slack:";
  apps = [ "slack" ];
};`;

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
            <strong>one Nix flake raises the whole house</strong>. Fog-grey, keyboard-first, and the
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
        {/* This URL is in shell histories and in print, so it keeps working
            forever. What changed on 2026-08-14 is what it MEANS: it used to
            be the installer and is now nebelhaus's installer, one of four
            routes. /haus.sh is the one that asks. */}
        <p className="aside">
          That URL picks this desktop. <a href="/haus.sh">hausfold.co/haus.sh</a> is the same script
          with nothing picked, if you&apos;d rather be asked.
        </p>
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
        {/* One frame today, and a gallery the moment there are two.

            Those are not in tension, and the resolution is the `:only-child`
            rule in .gallery: a lone frame renders full width and identical to
            the old `.shots` single, and a second one turns the row into the
            sideways scroller without a markup change. So this keeps the
            editorial call that arrived with the condensation pass — the
            frames are deliberately empty placeholders (AGENTS.md: never a
            stale screenshot), and three dashed boxes in a row spend a third
            of the page saying nothing, where one reserved slot reads as a
            promise — while putting the container in place now rather than
            re-deciding the markup on the day a capture lands. The scene and
            the crop are in the workshop's SHOT-nebelhaus-desktop.md.

            tabIndex={0} and the label are not decoration: a scroll container
            is only keyboard-operable if it can take focus, and Safari (unlike
            Chrome) does not make one focusable on its own. Without this the
            arrow keys reach nothing and everything past the right edge is
            mouse-only, which is a WCAG 2.1.1 failure rather than a rough
            edge. The visible ring is .gallery:focus-visible. They are
            harmless while there is one frame and nothing overflows. */}
        <div className="gallery" tabIndex={0} role="group" aria-label="Screenshots of nebelhaus">
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
          <dd>
            workspaces, weather, media, battery, clock — and a light that reddens when something has
            stopped
          </dd>

          <dt>the launcher</dt>
          <dd>pounce on ⌘Space, where every command is a file you can write</dd>

          <dt>the shelf</dt>
          <dd>perch, dropping out of the notch to catch a drag on its way somewhere else</dd>

          <dt>the terminal</dt>
          <dd>Ghostty, zellij, zsh, a tinted prompt, helix and a toolbelt that all matches</dd>

          <dt>focus</dt>
          <dd>one hotkey for Do Not Disturb, your Slack status, and your own hooks</dd>

          <dt>security</dt>
          <dd>
            Touch ID for <code>sudo</code>, inside a multiplexer too, and secrets declared rather
            than pasted
          </dd>

          <dt>agents</dt>
          <dd>coding agents, each in its own checkout of the repo, so they never collide</dd>

          <dt>the colours</dt>
          <dd>
            the nebelung palette and a generated wallpaper, rendered onto twenty-odd tools at once
          </dd>
        </dl>
        {/* The two named desktops moved inward on 2026-08-14, the day their
            pages landed — AGENTS.md's rule is that a link moves inward on the
            day the inward page exists, not before. `blank` stays in <code>
            rather than becoming a link: it is the null selection, it has no
            page here, and it deliberately isn't in the catalogue either. */}
        <p className="aside">
          nebelhaus is one desktop of four — the others are{' '}
          <Link href="/desktops/everyday">everyday</Link>,{' '}
          <Link href="/desktops/minimal">minimal</Link> and <code>blank</code>, and a Mac runs
          exactly one. Anything it chose, your own file overrides in a line.
        </p>
      </section>

      {/* The id is load-bearing: /docs/haus/install's "First run" card and the
          /docs/nebelhaus/first-run redirect both land on it. */}
      <section className="block" id="first-moves">
        <h2>First moves</h2>
        <p>
          The first switch has finished. Windows now tile themselves, the menu bar has been
          replaced, your terminal opens into a themed session, ⌘Space belongs to the palette, and{' '}
          <code>haus</code> is on your <code>PATH</code>. Here&apos;s the muscle memory.
        </p>
        <dl className="facts">
          <dt>⌘Space</dt>
          <dd>
            the palette. Type a few letters, hit Return. Start here for everything —{' '}
            <Link href="/docs/pounce">what else it does</Link>
          </dd>

          <dt>Tap ⇪, then a letter</dt>
          <dd>
            launch or focus that app. <code>T</code> is the terminal, <code>B</code> the browser
          </dd>

          <dt>Tap ⇪, then an arrow</dt>
          <dd>
            move focus between tiled windows. Keep arrowing; hold ⇧ to <em>move</em> the window
            instead
          </dd>

          <dt>Tap ⇪, then a digit</dt>
          <dd>jump to that workspace. Add ⇧ to throw the current window there</dd>

          <dt>Tap ⇪, then /</dt>
          <dd>
            the cheatsheet, generated from <em>your</em> app list — so it is never out of date
          </dd>
        </dl>
        <p className="aside">
          Tap Caps-Lock — don&apos;t hold it. It&apos;s a leader key now, not a modifier.
        </p>
        <p>
          Try these in order: tap <strong>⇪ T</strong> and the terminal opens and tiles itself;{' '}
          <strong>⌘Space</strong>, type <code>saf</code>, Return and Safari launches;{' '}
          <strong>⇪ then ← / →</strong> jumps focus between the two; <strong>⌥/</strong> flips the
          split between horizontal and vertical; <strong>⌘Space</strong>, type{' '}
          <code>emoji</code>, Return turns the palette into an emoji grid.
        </p>
        <p>
          One permission to grant — a few palette features use a keyboard path macOS gates behind
          Accessibility. Everything else works without it.
        </p>
        <Command>pounce --request-accessibility</Command>
      </section>

      <section className="block">
        <h2>Making it yours</h2>
        <p>
          Your settings live in one file. <code>haus edit</code> opens it; the tweaks people reach
          for first are an accent, an editor, and an app with a launcher key and a workspace of its
          own.
        </p>
        <Command>{settings}</Command>
        <p>
          Then <code>haus rebuild</code>. The commands you&apos;ll actually use:
        </p>
        <dl className="facts">
          <dt>haus rebuild</dt>
          <dd>build, then switch. Your everyday apply</dd>

          <dt>haus plan</dt>
          <dd>
            what a rebuild <em>would</em> change — packages, settings, files. Read-only
          </dd>

          <dt>haus update</dt>
          <dd>pull new versions, then rebuild</dd>

          <dt>haus status</dt>
          <dd>which generation you&apos;re on, and how stale it is</dd>

          <dt>haus rollback</dt>
          <dd>back to the previous generation. A failed build never activated in the first place</dd>

          <dt>haus doctor</dt>
          <dd>health check, with the exact fix for anything it finds</dd>
        </dl>
        <p className="aside">
          The full list is{' '}
          <Link href="/docs/haus/reference/haus">the haus reference</Link>, and{' '}
          <Link href="/docs/haus/keeping-it-current">Keeping it current</Link> is the loop they
          belong to.
        </p>
      </section>

      {/* The /docs/nebelhaus/keybindings redirect lands here. */}
      <section className="block" id="keys">
        <h2>The keys</h2>
        <p>
          The defaults, and the ones worth knowing in week one. ⌥ Option · ⌘ Command · ⌃ Control ·
          ⇧ Shift · ⇪ Caps-Lock. There is a live copy on your own machine — tap <strong>⇪ /</strong>{' '}
          — generated from your own tables; use that one when they disagree.
        </p>
        <p>
          Three options move everything below: <code>haus.keys.leader</code> (what ⇪ is),{' '}
          <code>haus.keys.windowNav</code> (what ⌥ is) and <code>haus.keys.palette</code> (what
          opens the launcher). Each can also be <code>&quot;none&quot;</code>, which removes its
          bindings rather than moving them.
        </p>

        <h3>Tiling</h3>
        <dl className="facts">
          <dt>⌥H ⌥J ⌥K ⌥L</dt>
          <dd>focus left / down / up / right</dd>

          <dt>⌥/ · ⌥,</dt>
          <dd>tiles layout, toggling horizontal ↔ vertical · accordion layout</dd>

          <dt>⌥F</dt>
          <dd>fullscreen</dd>

          <dt>⌥⇧Tab</dt>
          <dd>move the workspace to the next monitor</dd>

          <dt>⌥⇧;</dt>
          <dd>
            service mode — flatten the tree, float a window, close every other one, join a
            neighbour
          </dd>
        </dl>
        <p className="aside">
          ⌥Tab is deliberately unbound: ⌘Tab below answers the same question better.
        </p>

        <h3>Tap ⇪ — launch mode</h3>
        <dl className="facts">
          <dt>an app key</dt>
          <dd>
            launch or focus that app — <code>T</code> terminal, <code>B</code> browser by default.
            ⇧ throws the focused window to that app&apos;s workspace and follows it
          </dd>

          <dt>1–4 · ⇧1–⇧4</dt>
          <dd>focus workspace 1–4 · throw the focused window there and follow it</dd>

          <dt>←↓↑→</dt>
          <dd>
            focus a tiled window — drops into navigate mode, where arrows repeat and ⇧+arrow{' '}
            <em>moves</em> the window
          </dd>

          <dt>- / =</dt>
          <dd>resize mode: shrink / grow, repeatably</dd>

          <dt>V · E · Z</dt>
          <dd>clipboard history · emoji picker · reopen the last closed app</dd>

          <dt>, · ` · /</dt>
          <dd>macOS System Settings · re-sort every window to its workspace · this cheatsheet</dd>
        </dl>

        <h3>The palette — ⌘Space</h3>
        <dl className="facts">
          <dt>⌘Space · ⌘Tab</dt>
          <dd>open it · most-recently-used window switcher, across workspaces</dd>

          <dt>fn, tapped alone</dt>
          <dd>emoji picker</dd>

          <dt>⏎ · ⇧⏎ · ⌘⏎</dt>
          <dd>
            default action · newline, since the query field is multi-line · the modifier action,
            e.g. Reveal in Finder
          </dd>
        </dl>
        <p className="aside">
          The terminal has a chord set of its own — panes, tabs, find, agent worktrees — and it
          belongs to the layer rather than to this desktop:{' '}
          <Link href="/docs/haus/rooms/development">Development</Link> has it, and{' '}
          <Link href="/docs/haus/rooms/windows">Windows</Link> has the tiling half in full,
          including how to move all of it onto keys you&apos;d rather use.
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

          <dt>an admin account</dt>
          <dd>
            the two steps that actually change the machine run under <code>sudo</code>
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
            301s that finally retire that tree.

            They pointed at /docs/nebelhaus for a few hours after that, until
            the tree itself was retired into this page. "What it is" is this
            page's masthead and "first run" is the #first-moves section above,
            so neither wants a row: what is left points at the layer, which is
            the one thing this page is deliberately not a copy of. */}
        <ul className="plain" role="list">
          <li>
            <Link className="index-name" href="/docs/haus">
              the haus docs
            </Link>{' '}
            — the layer this desktop is a set of values for, room by room.
          </li>
          <li>
            <Link className="index-name" href="/docs/haus/desktops/customizing">
              making it yours
            </Link>{' '}
            — overriding anything the desktop chose, in a line.
          </li>
          <li>
            <Link className="index-name" href="/docs/pounce">
              pounce
            </Link>{' '}
            — the palette on ⌘Space, in full.
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
