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
      // How deep the "On this page" rail goes. Fumadocs has no such key — it
      // renders every heading — and the generated options reference carried
      // this frontmatter unread since the Starlight port, which is where the
      // shape comes from. It is read now, in `src/app/docs/[[...slug]]/page.tsx`.
      //
      // It exists for one page and would be wrong on any other: a reference
      // rendered from a module system has one h4 per option, and 318 of them
      // made a rail that wrapped `haus.apps.videoPlayer.enable` over three
      // lines and reached nothing a reader could aim at. Stopping at the
      // namespace gives back a list you can read; the leaf names live beside
      // the prose instead, as each namespace's own index of links.
      //
      // ⚠️ Absent, nothing is filtered. Don't reach for it to shorten an
      // ordinary page's rail — a hand-written page with too many headings is
      // a page with too many headings.
      tableOfContents: z.object({ maxHeadingLevel: z.number().int() }).optional(),
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
        // 🚨 No guillotine on the tokenizer. Shiki defaults this to 500ms PER
        // LINE, and vscode-textmate's `_tokenizeString` checks it against a
        // wall clock: blow the budget and it returns what it has so far and
        // stops scanning that line. The rest of the line keeps whatever scope
        // was open, so the code still renders — just coarser. `const scruff =
        // new ScruffClient();` comes out as `const` plus one undifferentiated
        // run, and `for (const lane of …)` loses everything after `lane`.
        // Nothing throws, nothing is logged, and the page looks plausible
        // unless you know the palette.
        //
        // Which makes it a clock in the build output, and that is what the two
        // cold builds in `docs.yml` kept catching: the same page, three
        // different tokenizations across four runs, red about half the time.
        // It never reproduces on an idle Mac. It needs a loaded 4-core runner
        // with nine Next workers on it, tokenizing a grammar whose regexes are
        // being compiled for the first time. `scruff/sdks` was always the
        // victim because it holds the corpus's only `ts` blocks: `nix` and
        // `sh` are warm from hundreds of fences by the time anything competes
        // for a core.
        //
        // ⚠️ The failure it produced is worse than a red check, because the
        // check only fires when the two builds disagree. Two builds that both
        // run slow degrade the same way, pass, and deploy. Whichever
        // tokenization a deploy happened to get is what visitors saw.
        //
        // 0 means unlimited. A slow line now takes as long as it takes and
        // always produces the same bytes, which is the only property this
        // build actually needs from it.
        tokenizeTimeLimit: 0,
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
