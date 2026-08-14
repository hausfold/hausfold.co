import { getPageMarkdownUrl, source } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
} from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { ViewOptions } from '@/components/page-actions';
import { gitConfig, siteUrl } from '@/lib/shared';

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;

  // Which tree the page is in — `haus` or `nebelhaus` — from its first slug.
  // This is what gives a whole tree one hue without every page in it saying
  // so, and it is the reason most pages need no `accent` at all: the layer's
  // pages wear the palette's own mauve, the desktop's pages wear its pink,
  // and `accent` in frontmatter is left for the page that is genuinely about
  // a *product*. See "the borrowed accent" in `global.css`.
  const tree = page.slugs[0];
  // The tree's own node, for its name and its glyph. A root folder's `$id`
  // is its directory under `content/docs`, which is also the page's first
  // slug — the two trees are the only folders directly under the root, so
  // this cannot match anything else. (It is deliberately not matched on
  // `index.url`: a root folder's index page is lifted out of the tree by
  // the time the layout sees it, and that lookup silently found nothing.)
  const eyebrow = source.pageTree.children.find(
    (node) => node.type === 'folder' && node.$id === tree,
  );

  return (
    // `data-tree` and `data-accent` are the whole of this page's colour
    // budget: the sidebar row, the tick at the head of each h2, a table's
    // rules and a link on hover all read them. See `public/hausfold.css` for
    // the values and `global.css` for what spends them.
    //
    // 🚨 They go on `DocsPage`'s own `<article>`, NOT on a `display:contents`
    // wrapper around it. Next's scroll handler walks this route segment's
    // first DOM node and skips any element whose `getBoundingClientRect()` is
    // all zeros — which a `contents` div always is. With no sibling to fall
    // back to it gives up and scrolls nothing, so every sidebar navigation
    // left the reader at the previous page's scroll offset.
    <DocsPage
      data-tree={tree}
      data-accent={page.data.accent}
      toc={page.data.toc}
      full={page.data.full}
      // The prev/next pair fumadocs puts at the foot of a page, given a
      // class so it can be styled as two doorways rather than two grey
      // boxes. It is the strongest "keep reading" affordance the layout
      // has, and it costs nothing to make it look like one.
      footer={{ className: 'hf-next' }}
    >
      {/* The page's meta row — everything *about* this page, on one line
          above the title, and nothing between the description and the
          first sentence of the body.

          Left: which half of the docs you are in — the same answer the
          sidebar's switcher gives, for the reader who arrived from a
          search result and never saw the sidebar. Right: what you can do
          with the page as a file — copy it as Markdown, open it in
          GitHub or in a model.

          They share a row because they are the same kind of thing: an
          answer to "what is this page", addressed to a reader who is not
          reading yet. The actions used to sit *under* the description as
          two bordered buttons — the loudest objects above the fold, in the
          position the lede wants, pushing the first sentence of the page
          about 100px down. Here they cost no height at all: the eyebrow's
          row was already being drawn.

          The trade, so it reads as chosen: they now come before the `h1`
          in the DOM, so a screen reader meets them before the title.
          Heading navigation is unaffected, and the alternative is a split
          between DOM order and visual order, which is worse. */}
      <div className="hf-meta">
        {eyebrow && (
          <p className="hf-eyebrow">
            {eyebrow.icon}
            {eyebrow.name}
          </p>
        )}
        <div className="hf-actions">
          <MarkdownCopyButton className="hf-action" markdownUrl={markdownUrl}>
            Copy Markdown
          </MarkdownCopyButton>
          <ViewOptions
            className="hf-action"
            markdownUrl={markdownUrl}
            githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${page.path}`}
            pageUrl={`${siteUrl}${page.url}`}
          />
        </div>
      </div>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: { canonical: page.url },
  };
}
