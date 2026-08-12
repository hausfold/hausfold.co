import { loader } from 'fumadocs-core/source';
import { docsContentRoute, docsRoute, accents } from './shared';
import { defineDocs } from 'fumadocs-mdx/macro';
import { applyMdxPreset } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { z } from 'zod';
import { nebelungCssVars } from './shiki-theme';

const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    // One extra frontmatter key over fumadocs' own: `accent`, naming which
    // product a page is about. It is the only way colour reaches the chrome
    // — the sidebar entry and the page's rules take that product's hue on
    // hover, and nothing takes one at rest. A page about the layer itself
    // omits it and stays ink, which is the default and the common case.
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
