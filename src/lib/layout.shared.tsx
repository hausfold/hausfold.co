import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, gitConfig } from './shared';
import { Icon } from './icons';

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
    // The way back out to the rest of the site, at the head of the sidebar.
    // Each carries a glyph, to be found by shape rather than read. `perch`
    // names a *product* and carries that product's accent; `/desktops` is a
    // catalogue rather than a product, owns no accent anywhere on this site,
    // and so takes the current page's tint like any other row.
    //
    // Two rows left on 2026-08-14, for one reason: **a link out of the docs
    // that lands back in the docs is not a way out, it is the tree switcher
    // at the top of this same sidebar.** `haus` pointed at `/haus`, which was
    // retired into `/docs/haus`; `pounce` pointed at `/pounce`, which was
    // retired into `/docs/pounce`. Both glyphs live in the switcher now — see
    // `src/lib/icons.tsx`. The url below is `/#desktops` rather than
    // `/desktops` for a smaller reason: `/desktops` only 301s there.
    links: [
      { text: 'desktops', url: '/#desktops', external: true, icon: <Icon name="desktops" /> },
      { text: 'perch', url: '/perch', external: true, icon: <Icon name="perch" /> },
    ],
    githubUrl: `https://github.com/${gitConfig.user}`,
  };
}
