import { createCssVariablesTheme } from 'shiki/core';

/**
 * Code blocks are the one place this site spends colour at rest, and the
 * colour is nebelung's — the palette the whole family shares.
 *
 * Rather than ship two compiled Shiki themes (one per scheme) and keep their
 * hexes in step with `public/hausfold.css` by hand, Shiki emits
 * `var(--nb-token-*)` for every token and CSS decides what those are. So the
 * light/dark fork happens where every other colour on this site forks — in
 * the stylesheet, on the same `data-theme` attribute — and a palette change
 * is one edit in `src/app/global.css` rather than a rebuild of two theme
 * objects.
 *
 * The prefix is `--nb-`, not Shiki's default `--shiki-`: fumadocs-ui's own
 * `shiki.css` reads `--shiki-light`/`--shiki-dark` for its dual-theme output,
 * and a shared prefix would have the two conventions writing over each other.
 */
export const nebelungCssVars = createCssVariablesTheme({
  name: 'nebelung',
  variablePrefix: '--nb-',
  fontStyle: true,
});
