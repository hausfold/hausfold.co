import type { Metadata } from 'next';
import { appName } from '@/lib/shared';

// The head the hand-written pages used to carry nine times over.
//
// AGENTS.md's rule for `public/` was "every page carries the same head, and
// there is no template — a change to one is a change to all of them; nothing
// checks". This is the template. Every landing page calls it, so the
// canonical, the six `og:` tags and the `twitter:card` are written once and a
// new page cannot ship without them.
//
// What is deliberately NOT here: `theme-color` and the two `<link rel=icon>`s,
// which are `viewport` and `metadata.icons` in `src/app/layout.tsx` and
// therefore already land on every route in the build — docs and landing pages
// alike. And no `og:image`, for the reason `public/index.html` gave and this
// site still holds: a card with no image degrades to the title and one line,
// which is the tone these pages are for.
//
// `openGraph` is spelled out in full rather than leaning on the layout's copy
// of `siteName`/`type`/`locale`. Next resolves a child's `openGraph` as a
// replacement for the parent's, not a deep merge, so a page that set only
// `url`/`title`/`description` would silently drop the other three.
export function pageMetadata(opts: {
  /** `<title>`, exactly — these bypass the layout's `%s · hausfold` template,
   *  which is the docs half's shape and not this one's. */
  title: string;
  description: string;
  /** Absolute path, with the trailing slash `trailingSlash: true` serves it
   *  at. Becomes both the canonical and `og:url`. */
  path: string;
  /** The `og:title` where it differs from `<title>` — it usually does: the
   *  tab wants `perch — hausfold`, a link card wants `perch — A shelf in the
   *  notch.` */
  ogTitle?: string;
  /** Likewise for `og:description`, which is often the shorter of the two. */
  ogDescription?: string;
}): Metadata {
  return {
    title: { absolute: opts.title },
    description: opts.description,
    alternates: { canonical: opts.path },
    openGraph: {
      siteName: appName,
      type: 'website',
      locale: 'en_US',
      url: opts.path,
      title: opts.ogTitle ?? opts.title,
      description: opts.ogDescription ?? opts.description,
    },
    twitter: { card: 'summary' },
  };
}
