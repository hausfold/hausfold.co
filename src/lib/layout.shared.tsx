import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      // The masthead, shrunk to a nav bar: the same `⌂` that opens the
      // landing page, with the same hover sheen, and the wordmark in mono
      // beside it. `.mark`'s `::after` carries the gradient copy — see
      // `public/hausfold.css` — so this is one class, not a second
      // animation.
      title: (
        <span className="hf-brand">
          <span className="mark mark--nav" aria-hidden="true">
            ⌂
          </span>
          <span className="wordmark wordmark--nav">{appName}</span>
        </span>
      ),
      // Out of the docs and back to the site. Docs are a wing of
      // hausfold.co, not a site of their own.
      url: '/',
    },
    // 🚨 There is no `links` list any more, and adding one back is a
    // decision rather than a tidy-up. It held the sidebar's way-out rows —
    // links from the docs to the rest of hausfold.co — and four rows have
    // now left it, the first three on 2026-08-14 for one reason: **a link
    // out of the docs that lands back in the docs is not a way out, it is
    // the tree switcher at the top of this same sidebar.** `haus` pointed at
    // `/haus` and `pounce` at `/pounce`, both retired into trees; `perch`
    // pointed at `/perch`, which is NOT retired, but perch got a tree of its
    // own the same day and a sidebar that names one product twice spends two
    // rows to offer one thing. Every one of those glyphs lives in the
    // switcher now — see `src/lib/icons.tsx`.
    //
    // The fourth was `desktops` → `/#desktops`, removed 2026-08-16 at the
    // user's instruction, for the reason that survives the other three: a
    // list of one row reads as a leftover rather than as a section, and the
    // thing it pointed at is one sentence handing over to
    // `haus/desktops/choosing` — a page the haus tree already lists under
    // `---Desktops---`. The way back to the site is the `⌂` in the nav
    // above, which is where a reader looks for it.
    //
    // ⚠️ The `#desktops` anchor on `/` is still load-bearing — the
    // `/desktops` 301 and `src/app/not-found.tsx` both land on it. This row
    // going does not free it.
    githubUrl: `https://github.com/${gitConfig.user}`,
  };
}
