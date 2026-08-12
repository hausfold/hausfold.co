// The handful of strings the docs build repeats. One place, so a rename is
// one edit rather than a grep.

export const appName = 'hausfold';
export const siteUrl = 'https://hausfold.co';

export const docsRoute = '/docs';
export const docsContentRoute = '/llms.mdx/docs';

export const gitConfig = {
  user: 'hausfold',
  repo: 'hausfold.co',
  branch: 'main',
};

// Two `theme-color`s per page, one per scheme — the same pair every
// hand-written page in `public/` carries, and the same values as
// `--ground` in `public/hausfold.css`. `scripts/sync-nebelung.mjs --check`
// asserts the HTML pages' copies; this is the docs build's copy of the same
// fact, so change all three together.
export const themeColor = {
  light: '#faf9f7',
  dark: '#121212',
};

// The six product accents, by the name a page puts in its `accent`
// frontmatter. The values live in `public/hausfold.css` as `--a-*`; this
// list only says which names are spendable, so a typo in frontmatter is a
// page with no accent rather than a page with an invented colour.
export const accents = [
  'nebelhaus',
  'pounce',
  'holt',
  'perch',
  'nebelung',
  'trill',
] as const;

export type Accent = (typeof accents)[number];
