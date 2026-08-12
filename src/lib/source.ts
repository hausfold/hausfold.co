import { loader } from 'fumadocs-core/source';
import { docsContentRoute, docsRoute, accents } from './shared';
import { defineDocs } from 'fumadocs-mdx/macro';
import { applyMdxPreset } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { z } from 'zod';
import { nebelungCssVars } from './shiki-theme';
import { resolveIcon } from './icons';

const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    // One extra frontmatter key over fumadocs' own: `accent`, naming which
    // product a page is about.
    //
    // ⚠️ It is an *override*, not the source of a page's colour. Since
    // 2026-08-12 every page takes its tree's hue at rest — mauve under
    // /docs/haus, pink under /docs/nebelhaus — from `data-tree`, and
    // `accent` exists for the page that is genuinely about one product
    // rather than about the tree it sits in. Most pages therefore have
    // none, including both nebelhaus pages, which the tree already colours.
    // See "the borrowed accent" in `src/app/global.css`.
    schema: pageSchema.extend({
      accent: z.enum(accents).optional(),
    }),
    mdxOptions: applyMdxPreset({
      rehypeCodeOptions: {
        // One theme, not fumadocs' light/dark pair — the fork happens in
        // CSS, not in the markup (see src/lib/shiki-theme.ts).
        //
        // It has to be written as a one-entry `themes` map rather than the
        // simpler `theme:` key, and that is a sharp edge worth naming:
        // fumadocs merges its own defaults *under* whatever you pass, those
        // defaults set `themes`, and Shiki branches on `'themes' in options`
        // — so a `theme:` key leaves a `themes` key beside it and Shiki takes
        // the two-theme path with nothing in it. The failure is
        // `TypeError: Cannot convert undefined or null to object`, thrown per
        // MDX file, naming neither the option nor the theme.
        themes: { light: nebelungCssVars },
        defaultColor: 'light',
        defaultLanguage: 'text',
      },
    }),
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  // `icon: bar` in a meta.json or a page's frontmatter becomes a glyph in the
  // sidebar and in the tree switcher. The names are ours, not Lucide's — see
  // `src/lib/icons.tsx` for the table and for why the indirection earns its
  // keep. Fumadocs ships a `lucideIconsPlugin` that would take Lucide names
  // straight from content; we don't use it, because an icon that can carry a
  // product's accent has to be constructed here rather than named there.
  icon: resolveIcon,
  plugins: [],
});

export function getPageMarkdownUrl(page: (typeof source)['$inferPage']) {
  const segments = [...page.slugs, 'content.md'];

  return {
    segments,
    url: '/' + [page.locale, ...docsContentRoute.split('/'), ...segments].filter(Boolean).join('/'),
  };
}

export async function getLLMText(page: (typeof source)['$inferPage']) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title} (${page.url})

${processed}`;
}
