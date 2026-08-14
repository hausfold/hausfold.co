import type { Metadata, Viewport } from 'next';
import { appName, siteUrl, themeColor } from '@/lib/shared';
import './global.css';

// The head EVERY page carries — docs and landing pages alike, since the eight
// hand-written pages in `public/` became Next routes.
//
// AGENTS.md's rule for `public/` used to be that the canonical, the `og:` tags
// and the two `theme-color`s were hand-copied onto every page and *nothing
// checked*. Nothing is hand-copied now: what varies per page (title,
// description, canonical, `og:url`) is `src/lib/page-meta.ts`, and what does
// not — the icons and the two `theme-color`s below — is here, applied by Next
// to every route in the build.
//
// No `og:image`, deliberately, and for the same reason the hand-written
// pages had none: a link card with no image degrades to the title and one
// line, which is the tone these pages are for. The scaffolded `/og` route
// that would have generated one per page was removed rather than left
// switched off.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: `%s · ${appName}`,
    default: `${appName} docs`,
  },
  description: 'Documentation for haus — the macOS layer — and the desktops built on it.',
  // `en_US`, not `en`: `og:locale` wants language_TERRITORY, which is what all
  // eight hand-written pages sent and what `src/lib/page-meta.ts` keeps
  // sending. This said `en` while the two halves were separate documents; one
  // build emitting both spellings would be the drift the merge is meant to
  // end.
  openGraph: {
    siteName: appName,
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
  },
  // The same pair every hand-written page links: the SVG mark first, the
  // monochrome ICO as Safari's fallback (WebKit doesn't resolve the SVG one).
  // Without either, every /docs page shows a blank tab beside pages that
  // don't — which is exactly the "every page carries the same head" rule
  // breaking across the new half.
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
  },
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: themeColor.light },
    { media: '(prefers-color-scheme: dark)', color: themeColor.dark },
  ],
};

// 🚨 **No `<Provider>` here — it belongs to `/docs` alone**, in
// `src/app/docs/layout.tsx`. It sat at the root for the two days when `/docs`
// was the only thing under this layout, and when the landing pages arrived on
// 2026-08-14 that quietly gave every one of them fumadocs' search context and
// its ⌘K binding: pressing it on `/terms` opened the docs search and fetched
// the ~457 KB index. Moving it down is what makes "almost no JavaScript on the
// landing pages" true again rather than aspirational.
//
// The trade, and it is deliberate: `next-themes` lives inside that provider, so
// an explicit light/dark choice is a `/docs` thing. The landing pages follow
// `prefers-color-scheme` only — which is exactly what they did as
// hand-written HTML, since none of them ever shipped a toggle. `hausfold.css`
// keeps its `:root[data-theme=…]` blocks either way; nothing on a landing page
// sets the attribute, so they simply don't match.
//
// `suppressHydrationWarning` stays on `<html>`: it is what lets the provider
// write `class`/`data-theme` there before React hydrates, on the routes that
// still have one.
export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">{children}</body>
    </html>
  );
}
