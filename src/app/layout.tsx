import type { Metadata, Viewport } from 'next';
import { Provider } from '@/components/provider';
import { appName, siteUrl, themeColor } from '@/lib/shared';
import './global.css';

// The head every docs page carries. AGENTS.md's rule for `public/` is that
// the canonical, the `og:` tags and the two `theme-color`s are hand-copied
// onto every page and *nothing checks* — this is the half of the site where
// that stops being true: one object, applied by Next to every route.
//
// No `og:image`, deliberately, and for the same reason the hand-written
// pages have none: a link card with no image degrades to the title and one
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
  openGraph: {
    siteName: appName,
    type: 'website',
    locale: 'en',
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

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
