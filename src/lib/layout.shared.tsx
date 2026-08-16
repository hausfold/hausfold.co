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
    // One row, and it carries a glyph to be found by shape rather than read.
    // `desktops` names a kind of thing rather than a product, owns no accent
    // anywhere on this site, and so takes the current page's tint like any
    // other row.
    //
    // 🚨 Three rows have left this list on 2026-08-14, all for the same
    // reason: **a link out of the docs that lands back in the docs is not a
    // way out, it is the tree switcher at the top of this same sidebar.**
    // `haus` pointed at `/haus` and `pounce` at `/pounce`, both retired into
    // trees; `perch` pointed at `/perch`, which is NOT retired — but perch
    // got a tree of its own the same day, and a sidebar that names one
    // product twice, once in the switcher and once here, spends two rows to
    // offer one thing. The product sheet is still linked, from the head of
    // `/docs/perch` where a reader who wants the pitch will be. Every one of
    // those glyphs lives in the switcher now — see `src/lib/icons.tsx`.
    //
    // ⚠️ The url is `/#desktops`, not `/desktops`, for a smaller reason:
    // `/desktops` only 301s there. That anchor is load-bearing — the 301, the
    // 404 and this row all land on it — and it survived the section under it
    // being cut twice. Since 2026-08-14 that section is one sentence and one
    // link, which is still the right destination: this row's job is "there is
    // a site around these docs, and it has desktops in it", and the section
    // says exactly that before handing over to `desktops/choosing`.
    links: [
      { text: 'desktops', url: '/#desktops', external: true, icon: <Icon name="desktops" /> },
    ],
    githubUrl: `https://github.com/${gitConfig.user}`,
  };
}
