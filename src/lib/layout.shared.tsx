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
    links: [
      { text: 'haus', url: '/haus', external: true },
      { text: 'desktops', url: '/desktops', external: true },
      { text: 'pounce', url: '/pounce', external: true },
      { text: 'perch', url: '/perch', external: true },
    ],
    githubUrl: `https://github.com/${gitConfig.user}`,
  };
}
