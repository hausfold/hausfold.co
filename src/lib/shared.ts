// The handful of strings the docs build repeats. One place, so a rename is
// one edit rather than a grep.

export const appName = 'hausfold';
export const siteUrl = 'https://hausfold.co';

export const docsRoute = '/docs';
export const docsContentRoute = '/llms.mdx/docs';

export const gitConfig = {
  user: 'hausfold',
  // This repo — what the per-page "source on GitHub" row edits, because the
  // MDX lives here.
  repo: 'hausfold.co',
  branch: 'main',
  // The platform repo, and NOT the same thing: it is what the docs sidebar's
  // GitHub mark points at. See `src/lib/layout.shared.tsx` for why the two
  // differ.
  platformRepo: 'haus',
};

// Two `theme-color`s, one per scheme, for the whole site — spent by `viewport`
// in `src/app/layout.tsx`, which puts them on every route in the build. The
// values are `--ground` in `public/hausfold.css`.
//
// 🚨 **This is the copy `scripts/sync-nebelung.mjs --check` reads**, and it is
// the only one: until 2026-08-14 the same pair was hand-typed into ten
// `public/**.html` heads and the script walked those instead. Change a ground
// colour in the stylesheet and change `dark` here with it, or Palette goes red
// naming this line.
export const themeColor = {
  light: '#faf9f7',
  dark: '#121212',
};

// The six product accents, by the name a page puts in its `accent`
// frontmatter. The values live in `public/hausfold.css` as `--a-*`; this
// list only says which names are spendable, so a typo in frontmatter is a
// page with no accent rather than a page with an invented colour.
export const accents = [
  'hacker',
  'pounce',
  'holt',
  'perch',
  'nebelung',
  'trill',
] as const;

export type Accent = (typeof accents)[number];
