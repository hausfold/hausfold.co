import Link from 'next/link';
import { codeToHtml } from 'shiki';
import { Command } from '@/components/command';
import { Colophon, GithubMark } from '@/components/sheet';
import { pageMetadata } from '@/lib/page-meta';
import { nebelungCssVars } from '@/lib/shiki-theme';

// /haus — the layer's own page, and the second life of this URL.
//
// 🚨 It was a sheet until 2026-08-14, retired then into /docs/haus for a good
// reason: it had become a shorter, staler account of the same subject. Its two
// 301s in `public/_redirects` are deleted in the same commit that adds this
// file, because a route existing does NOT beat a redirect pointing away from
// it — Cloudflare reads `_redirects` ahead of the assets.
//
// What makes this NOT a repeat of that mistake: the page is not a second
// account of the docs, it is the *front door* that used to be `/`. On
// 2026-08-17 the user split the site in two — hausfold is the org and the
// house, haus is one of the things it makes — so `/` became an index of
// everything hausfold publishes and everything that argued for the layer
// moved down here, word for word:
//
//   the lede         the hero paragraph, with `hausfold` swapped for `haus`,
//                    because it was always describing the layer
//   Rooms            added to `/` on 2026-08-15, unchanged
//   #desktops        the id is load-bearing and it MOVED with the section:
//                    /desktops now 301s to /haus/#desktops, and the 404's row
//                    points there too. Both were updated in the same commit.
//   the example      the one file, inherited from the first /haus on
//                    2026-08-14 and now home again
//
// The masthead is the inner-page shape (`/perch`'s): no ⌂, no standfirst
// sentence, just the name. The house's mark belongs to the house, and this
// page is one floor down from it.
export const metadata = pageMetadata({
  title: 'haus · hausfold',
  description:
    'A layer for macOS. The windows, the bar, the shell, the keys, the apps and the settings you always change by hand, written down in one file and installed with one command.',
  path: '/haus/',
  ogTitle: 'haus · The Mac, written down.',
  ogDescription:
    'A Mac out of the box is somebody else’s idea of a Mac. haus rebuilds it into yours, from one file, on any machine you own.',
});

// The one file, in the form it's actually written. Every option here is real
// and spelled as `content/docs/haus/reference/options.mdx` spells it — that
// page is generated from haus's own module system, so it is the thing to check
// this against when it drifts. (`name` is required whenever `key` is set, per
// the roster options, so the claude entry can't shed it.)
//
// It is the one thing on the old landing page that survived every cut by being
// a demonstration rather than an explanation: four lines of it say what three
// paragraphs about "declarative configuration" would not.
//
// The lines are picked so each lands with a different reader (the user's
// brief, 2026-08-16): the accent for someone who cares how it looks, tiling
// for someone who lives in windows, focus for someone guarding their
// attention, animations for someone who wants macOS out of the way, and the
// roster entry — Claude, deliberately — for someone who'd hand this very file
// to an agent. The comments stay one clause each; they are the explainers.
//
// Line length is a layout constraint, not a style choice: `.cmd code` is
// 0.82rem mono inside a 41rem sheet, and anything much past ~58 characters
// puts a horizontal scrollbar on the box at ordinary zoom. The roster entry
// is written multi-line for exactly that reason. Keep new lines under that.
const example = `{
  haus.theme.accent = "sapphire"; # one hue, everywhere

  haus.windows.enable = true;  # tiling, Caps Lock as leader
  haus.launcher.enable = true; # the launcher, on ⌘Space
  haus.focus.enable = true;    # Do Not Disturb, one switch
  haus.animations = "fast";    # no bounce, no genie

  # the Claude macOS app, installed, on Caps Lock + c
  haus.roster.claude = {
    cask = "claude";
    name = "Claude";
    key = "c";
  };
}`;

export default async function Haus() {
  // Highlighted at build time — this is a server component and the site is
  // `output: 'export'`, so Shiki runs once during `next build` and the colour
  // is in the static HTML. No client JS, no flash of plain text. The theme is
  // the same css-variables one the docs' code blocks use (src/lib/shiki-theme.ts):
  // Shiki emits `var(--nb-token-*)` and the stylesheet decides the hues, so
  // this example and every docs block fork light/dark in one place.
  // `structure: 'inline'` drops the pre/code wrapper so the output slots into
  // `.cmd`'s existing `<code>` untouched.
  const highlight = (code: string, lang: string) =>
    codeToHtml(code, { lang, theme: nebelungCssVars, structure: 'inline' });
  // The two inline commands in the aside go through the same pipeline as the
  // block (the user's ask, 2026-08-16): same theme, same build-time cost of
  // zero at runtime. `children` on those <code>s stays out — Shiki's spans ARE
  // the content, and the raw string never needs copying.
  const [exampleHtml, rebuildHtml, rollbackHtml] = await Promise.all([
    highlight(example, 'nix'),
    highlight('haus rebuild', 'sh'),
    highlight('haus rollback', 'sh'),
  ]);

  return (
    <main className="sheet sheet--inner">
      <header className="masthead">
        {/* Three words, in `/`'s own two-word vocabulary. The first is the way
            back up, which is the job `.crumbs` does on every other inner
            sheet — this page merges the two navs into one row rather than
            stacking a breadcrumb over a nav, because they are the same size,
            the same ink and the same axis, and two rows of micro-mono at the
            top of a page reads as chrome rather than as navigation.

            Both outward links are haus's, not the house's: `docs` goes to the
            layer's tree rather than to the docs root (which no longer exists),
            and `github` to `hausfold/haus` rather than to the org. A page
            about one thing should hand you that thing. */}
        <nav className="topnav" aria-label="Site">
          <Link href="/">hausfold</Link>
          <Link href="/docs/haus">docs</Link>
          <a href="https://github.com/hausfold/haus">github</a>
        </nav>

        <h1 className="wordmark">haus</h1>
        {/* Written 2026-08-14, the user's call, and the note is the brief
            rather than the copy: the version before it opened "a new Mac
            takes a weekend to make yours", which reads as one person ricing
            one laptop over a wet Sunday. That undersells what is actually
            here — a layer that rebuilds macOS itself and hands you the
            result as text, on any number of machines. So: general before
            personal, and the same facts (what it covers, that it is one
            file, that it is one command) in the same number of words.

            One word changed when it moved off `/` on 2026-08-17: the subject
            of the second sentence is `haus`, which is what it always
            described. hausfold is the house that makes it, and says so one
            floor up. */}
        <div className="lede">
          <p>
            A Mac out of the box is somebody else&apos;s idea of a Mac. haus rebuilds it into yours:
            the windows, the bar, the shell, the keys, the apps, the settings you always change by
            hand. The whole arrangement is written down in <strong>one file</strong>. One command
            puts that Mac on any machine you own, and puts it back after a wipe.
          </p>
        </div>
      </header>

      {/* Added 2026-08-15 at the user's request, above Desktops so "which
          rooms are on" one section down isn't a forward reference.

          The app-store comparison is the section's one claim, and it is
          the mechanism as /docs/haus states it (the accent lands in the
          terminal, the bar and the browser at once; Slack arrives
          installed AND bound). Don't count the rooms here: AGENTS.md
          records that any number written down is wrong somewhere. */}
      <section className="block" id="rooms">
        <h2>Rooms</h2>
        <p>
          The rebuild happens in rooms: Windows, Launcher, Bar, Focus, and the rest, each a single
          concern handled all the way down. An app store stops at the app; a room also wires the
          keys, the theme, and the macOS settings around it, so the pieces already know each other.
        </p>
        {/* ⚠️ This href is also the `.topnav`'s `docs`, and that is a
            deliberate exception rather than an oversight. The one-href-per-
            section rule below is about a *section* spending a reader's
            attention twice to move them once; the nav is chrome, addressed
            to someone who is not reading yet, and this is prose at the end
            of the paragraph that earns the click. The alternative was
            pointing this at `reference/options`, which is the generated
            list and the wrong next step for a reader who has just been told
            what a room is: the rooms table is on `/docs/haus`, so that is
            where "every room" goes. */}
        <p className="aside">
          <Link href="/docs/haus">Every room, and what it covers</Link>.
        </p>
      </section>

      {/* 🚨 The id is load-bearing and it followed this section down from `/`
          on 2026-08-17: the /desktops 301 in public/_redirects and
          src/app/not-found.tsx now both point at /haus/#desktops, updated in
          the same commit. It was a catalogue of three plates with a
          screenshot frame each until 2026-08-14; the user cut it to a
          sentence the same day, on the grounds that
          /docs/haus/desktops/choosing says it better and a front page should
          route rather than sell.

          ONE link, and deliberately not the desktops' names. It listed
          three of them for a few hours, on the reasoning that each name led
          to its own install command — then those pages were deleted too,
          and naming three things a reader cannot yet tell apart, in a
          section whose whole job is to send them one click on, is three
          decisions asked before the one that matters. `choosing` is the
          page that answers "which of these is mine?"; every desktop's own
          page is one further click from there.

          Nothing here carries a data-accent, and that follows from the same
          cut rather than from a change of rule: a desktop is not a product
          and never had one, except `hacker`, which is a named thing with a
          hue assigned upstream — and its name is no longer on this page to
          carry it. (AGENTS.md's closed vocabulary.) */}
      <section className="block" id="desktops">
        <h2>Desktops</h2>
        {/* The making-and-sharing sentence, added 2026-08-16 at the user's
            request. Both halves are backed pages, not aspiration:
            /docs/haus/desktops/creating and /docs/haus/desktops/sharing.
            It stays linkless on purpose — the aside's ONE link is still the
            rule; `choosing` links onward to `creating`, which links
            `sharing`. */}
        <p>
          A desktop is a complete setup, written down: which rooms are on, how it looks, what it
          installs. A Mac runs exactly one. And a desktop is just a file, so it travels: make your
          own, or run one a friend swears by.
        </p>
        <p className="aside">
          <Link href="/docs/haus/desktops/choosing">The four that ship, and how to choose</Link>.
        </p>
      </section>

      {/* The example file closes the page, as it closed the layer's section on
          `/` before the split. Its heading was `haus` there, which is the
          page's own name here — so it says what the section actually shows.

          The two paragraphs that used to explain `haus rebuild`, `haus plan`
          and `haus rollback` are in content/docs/haus/reference/haus.mdx,
          which says more about all three — repeating them here was the same
          two-copies-of-one-subject mistake that retired the first /haus, just
          at paragraph scale. */}
      <section className="block">
        <h2>One file</h2>
        <Command html={exampleHtml}>{example}</Command>
        {/* Two links, and neither repeats the other. A section with the same
            href on it twice spends a reader's attention twice to move them
            once. */}
        <p className="aside">
          <code dangerouslySetInnerHTML={{ __html: rebuildHtml }} /> applies the file.{' '}
          <code dangerouslySetInnerHTML={{ __html: rollbackHtml }} /> puts it back. There are no
          surprises:{' '}
          <Link className="index-name" href="/docs/haus/reference/options">
            every option
          </Link>{' '}
          is documented, and{' '}
          <Link className="index-name" href="/docs/haus/install">
            the install
          </Link>{' '}
          tells you what it will do before you run it.
        </p>
        {/* The agent note closes the section, at the user's request
            (2026-08-16): the one consequence of "the machine is one file"
            worth its own line, weighted above an .aside but still
            greyscale — the .note class is a heavier left rule and body
            ink, no colour, per the landing half's at-rest rule. "The rare
            Mac", not "the only Mac": it is the docs' own claim
            (agent-rebuilds' lede says "the rare machine"), and the
            stronger word is a positioning claim nothing backs. The link
            is the door to the page that explains the how. */}
        {/* A plain prose link, not an .index-name: the mono face is for a
            product's NAME in an index row, and five mono words mid-serif
            sentence read as a different voice butting in (the user's read,
            2026-08-16). */}
        <p className="note">
          The whole machine in one file, every rebuild reversible: a haus Mac is the rare Mac an
          agent can reconfigure{' '}
          <Link href="/docs/haus/agent-rebuilds">quickly, confidently, and safely</Link>.
        </p>
      </section>

      <Colophon>
        <GithubMark />
      </Colophon>
    </main>
  );
}
