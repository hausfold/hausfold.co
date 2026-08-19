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
    // /docs/haus, peach under /docs/pounce — from `data-tree`, and
    // `accent` exists for the page that is genuinely about one product
    // rather than about the tree it sits in. As of 2026-08-19 *no* page
    // carries one — `rooms/launcher` was the last, and a room page wearing
    // pounce's peach read as the whole page belonging to the app rather
    // than to the room. The key stays because the case it exists for is
    // real; it is just not this one. See "the borrowed accent" in
    // `src/app/global.css`.
    schema: pageSchema.extend({
      accent: z.enum(accents).optional(),
      // The page's way-onward cards, moved out of the MDX body on 2026-08-16
      // (the user's call) so they can render BELOW the prev/next pair, which
      // the layout draws after the body. They are navigation rather than
      // prose — every entry duplicates its target page's own title and
      // description — so leaving the search index and llms-full.txt costs
      // nothing a reader could have found only here. Rendered by the footer
      // slot in `src/app/docs/[[...slug]]/page.tsx`; `icon` names a row in
      // `src/lib/icons.tsx`, exactly as frontmatter's own `icon` does.
      related: z
        .array(
          z.object({
            title: z.string(),
            description: z.string(),
            href: z.string(),
            icon: z.string().optional(),
          }),
        )
        .optional(),
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

// Processed Markdown is resolved asynchronously. Keep every consumer that
// gathers all pages in one artifact on a fixed input order, rather than the
// filesystem/import order Fumadocs happened to produce in this build. The
// distinction became visible in the two cold-build check once the generated
// options page joined the corpus.
export function getPagesInOrder() {
  return source.getPages().toSorted((a, b) => a.url.localeCompare(b.url));
}

// createFromSource needs the complete loader for breadcrumbs, not merely its
// pages. A proxy preserves that surface while making its getPages call use the
// same stable order as llms-full.txt.
export const orderedSource = new Proxy(source, {
  get(target, property, receiver) {
    if (property === 'getPages') return getPagesInOrder;
    return Reflect.get(target, property, receiver);
  },
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
