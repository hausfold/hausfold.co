import Link from 'next/link';
import { Command } from '@/components/command';
import { Colophon, Crumbs } from '@/components/sheet';
import { pageMetadata } from '@/lib/page-meta';

// pounce's product page, ported from `public/pounce/index.html`.
//
// ⚠️ `workshop/web/src/pages/pounce.astro` is still what `nebelhaus.com/pounce`
// serves, and it is the denser of the two duplicate pairs — more to drift.
// Fix a fact in both or in neither until the 301s land.
export const metadata = pageMetadata({
  title: 'pounce — hausfold',
  description:
    'A launcher you teach. Hit one key, type a few letters, hit return — your apps and your own commands in one list. Every command is a shell script in a folder. Free and MIT.',
  path: '/pounce/',
  ogTitle: 'pounce — A launcher you teach.',
  ogDescription:
    'Your apps and your own commands in one list, one keypress away. A command is a shell script in a folder — no plugin API, no store, no restart.',
});

const install = `brew install hausfold/tap/pounce
brew services start pounce
pounce --request-accessibility`;

const script = `#!/bin/bash
# pounce: name = Say Hello
# pounce: icon = hand.wave
osascript -e 'display notification "🐾" with title "Pounce"'`;

export default function Pounce() {
  return (
    <main className="sheet sheet--inner">
      <Crumbs trail={[{ href: '/', label: 'hausfold' }]} current="pounce" />

      <header className="masthead">
        <h1 className="wordmark">pounce</h1>
        <p className="standfirst">A launcher you teach.</p>
        <div className="lede">
          <p>
            Every launcher lets you open an app. The moment you want it to do something of your own,
            you are reading an extension SDK, making an account, or waiting for someone else to
            publish the thing you needed twenty minutes ago.
          </p>
          <p>
            Pounce takes the other road. Press the hotkey, type a few letters, press return — your
            installed apps and your own commands come up in <strong>one list</strong>, ranked by
            what you actually reach for. And a command is nothing but a shell script in a folder:
            five lines, two comments, and it&apos;s in the palette the next time you open it.
          </p>
          <p>
            It is free, MIT-licensed, and asks for no account. There is no paid tier to be nudged
            toward, because there isn&apos;t one.
          </p>
        </div>
      </header>

      <section className="block">
        <h2>Install</h2>
        <Command>{install}</Command>
        <p className="aside">
          The formula installs a prebuilt <code>Pounce.app</code> — signed with our Apple Developer
          ID and notarized, so there&apos;s no compile step and no Xcode command-line tools to
          fetch. The last line asks macOS for the permission pounce needs to hold a hotkey; approve
          it once. Prefer a download?{' '}
          {/* Plain <a>: /download/<app> is a `worker.js` route, not a Next
              route — see the same note on /perch. */}
          The <a href="/download/pounce">latest release</a> is the same build as a DMG: drag it to
          Applications and open it. First launch registers a login item and starts the daemon —
          approve the login item in System Settings if macOS asks.
        </p>
      </section>

      <section className="block">
        <h2>One key to free up</h2>
        <p>
          Pounce wants <em>⌘Space</em>, and on a stock Mac that key belongs to Spotlight — which
          wins silently, so the palette simply doesn&apos;t appear. Turn it off in System Settings ▸
          Keyboard ▸ Keyboard Shortcuts ▸ Spotlight, then restart the daemon. (If you&apos;d rather
          keep Spotlight where it is, the hotkey is a line of config; and inside the{' '}
          <Link href="/desktops/nebelhaus">nebelhaus</Link> desktop the key is already handed over.)
        </p>
      </section>

      <section className="block">
        <h2>What it looks like</h2>
        <div className="shots">
          <div className="shot shot--wide">
            <span>
              the palette, mid-type
              <br />
              [ shot not taken yet ]
            </span>
          </div>
          <div className="shot">
            <span>
              a command with a submenu
              <br />
              [ shot not taken yet ]
            </span>
          </div>
          <div className="shot">
            <span>
              clipboard history
              <br />
              [ shot not taken yet ]
            </span>
          </div>
        </div>
      </section>

      <section className="block">
        <h2>What&apos;s in it</h2>
        <dl className="facts">
          <dt>apps &amp; actions</dt>
          <dd>
            one list, fuzzy-matched. Type <code>saf</code>, get Safari; your own commands sit in the
            same list, ranked the same way
          </dd>

          <dt>quick answers</dt>
          <dd>
            <code>2*847</code>, <code>72 f in c</code>, <code>100 usd in eur</code>,{' '}
            <code>14:00 utc in pst</code> — the answer pins to the top row and ⏎ copies it
          </dd>

          <dt>clipboard</dt>
          <dd>
            your recent copies in a two-pane view, searchable, with an optional paste straight back
            into the app you came from
          </dd>

          <dt>files</dt>
          <dd>
            search by name as you type, over Spotlight&apos;s own index. ⏎ opens, ⌘⏎ reveals in
            Finder, ⌥⏎ copies the path
          </dd>

          <dt>emoji &amp; symbols</dt>
          <dd>
            one grid for both — type <code>command</code> and get ⌘, <code>arrow</code> and get →.
            Plain Unicode, so it pastes anywhere. Screenshots, a camera peek and a searchable
            cheatsheet live beside it
          </dd>

          <dt>settings panes</dt>
          <dd>
            every System Settings pane by name — “Displays” goes to Displays, not to the Settings
            window
          </dd>

          <dt>windows</dt>
          <dd>
            an opt-in ⌘⇥ that walks your actual <em>windows</em>, newest first, with
            type-to-filter. If you run AeroSpace it groups them by workspace
          </dd>

          <dt>plugins</dt>
          <dd>
            Docker, SSH hosts, Tailscale, Spotify, Bluetooth, audio devices, GitHub, caffeinate —
            off by default, on by id, and each one is still just a script
          </dd>
        </dl>
      </section>

      <section className="block">
        <h2>Every command is a file</h2>
        <p>
          This is the whole extension model. A script, two comment lines telling the palette what to
          call it and which SF Symbol to draw, dropped in <code>~/.config/pounce/commands</code>. No
          registry, no manifest, no rebuild, no restart — it&apos;s there on the next summon.
        </p>
        <Command>{script}</Command>
        <p className="aside">
          It runs the other way too:{' '}
          {/* A template literal, not JSX text: the backslash-n pairs are
              literal two-character sequences in the shell line, and writing
              them as text would leave them at the mercy of JSX whitespace
              collapsing across the line break. */}
          <code>{`printf 'a\\nb\\nc\\n' | pounce -p "pick one:"`}</code> turns any list on stdin
          into a native picker, so a script you already have can ask a real question. A submenu is
          just a command that calls pounce again with a new list.
        </p>
      </section>

      <section className="block">
        <h2>How it behaves</h2>
        <dl className="facts">
          <dt>instant</dt>
          <dd>
            the daemon holds the hotkey in-process, so a press lands in an already-warm program — no
            shell, no client to spawn, no round trip
          </dd>

          <dt>learns</dt>
          <dd>
            match quality, then frequency × recency on a 72-hour half-life, plus a nudge for apps
            you&apos;ve just installed. What you meant is usually the first row
          </dd>

          <dt>quiet</dt>
          <dd>
            no account, no sign-in, no telemetry, nothing to log in to and nothing reported back
          </dd>

          <dt>offline</dt>
          <dd>
            two outbound calls exist and both are optional: daily reference rates for currency
            conversion, and an hourly look at pounce&apos;s own release tag. Either can be turned
            off in <code>config.json</code>; everything else works with the Wi-Fi off
          </dd>

          <dt>updates</dt>
          <dd>
            nudged, never automatic. A pending release pins itself to the first row and notifies at
            most once a day; ⌘⏎ skips that version. Applying it is always your keystroke
          </dd>

          <dt>diagnosable</dt>
          <dd>
            <code>pounce doctor</code> answers the three questions that go wrong — is the daemon up,
            is Accessibility granted, is something else eating your hotkey
          </dd>
        </dl>
      </section>

      <section className="block">
        <h2>What it needs</h2>
        <dl className="facts">
          <dt>macOS 14</dt>
          <dd>Sonoma or newer, on Apple Silicon</dd>

          <dt>Accessibility</dt>
          <dd>
            one permission to run, and pounce is honest about why: a global hotkey that works over
            every app can&apos;t be had without it. Two features ask for their own the first time
            you use them — the camera peek, and the Bluetooth plugin. Nothing else: no Input
            Monitoring, no Screen Recording, no Full Disk Access
          </dd>

          <dt>nothing else</dt>
          <dd>no account, no key, no sign-in, no Xcode, no Nix</dd>
        </dl>
        <p className="aside">
          Pounce also has a room in the <Link href="/desktops/nebelhaus">nebelhaus</Link> desktop,
          where the daemon, the hotkey and the permission are wired up with the rest of the house.
          Standalone and in-the-house are the same app.
        </p>
      </section>

      <section className="block">
        <h2>Questions</h2>
        <dl className="facts">
          <dt>free how?</dt>
          <dd>
            free as in no money and free as in MIT. Read it, fork it, ship your own — there is no
            licence key, no trial timer and no tier above the one you have
          </dd>

          <dt>another launcher?</dt>
          <dd>
            there are good ones, and if you want a marketplace of ready-made extensions you should
            use one of them. Pounce&apos;s angle is ownership: the extension API is the shell you
            already know, and nothing you write depends on us staying interested
          </dd>

          <dt>my scripts</dt>
          <dd>
            stay yours, as files, in your own folder. Nothing is imported into a database, so
            backing them up is backing up a directory and moving Macs is copying one
          </dd>
        </dl>
      </section>

      <section className="block">
        <h2>Elsewhere</h2>
        <ul className="plain" role="list">
          <li>
            <a className="index-name" href="https://github.com/hausfold/pounce">
              github.com/hausfold/pounce
            </a>{' '}
            — the source, the changelog, and where to file a bug.
          </li>
          {/* Inward on 2026-08-14. It pointed at nebelhaus.com/guides/pounce,
              which still resolves and still serves the older of two live
              copies — the launcher room has been in this repo since
              2026-08-12. */}
          <li>
            <Link className="index-name" href="/docs/haus/rooms/launcher">
              the guide
            </Link>{' '}
            — the long version: config, the command format, the plugin shelf.
          </li>
        </ul>
      </section>

      <Colophon />
    </main>
  );
}
