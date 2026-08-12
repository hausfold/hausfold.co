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
    // Each carries a glyph, to be found by shape rather than read. The three
    // that name a *product* carry that product's accent — `/haus` takes the
    // layer's mauve, the same hue the haus tree wears inside the docs, so the
    // outward link and the tree are visibly the same subject. `/desktops` is
    // a catalogue rather than a product, owns no accent anywhere on this
    // site, and so takes the current page's tint like any other row.
    links: [
      { text: 'haus', url: '/haus', external: true, icon: <Icon name="layer" /> },
      { text: 'desktops', url: '/desktops', external: true, icon: <Icon name="desktops" /> },
      { text: 'pounce', url: '/pounce', external: true, icon: <Icon name="pounce" /> },
      { text: 'perch', url: '/perch', external: true, icon: <Icon name="perch" /> },
    ],
    githubUrl: `https://github.com/${gitConfig.user}`,
  };
}
