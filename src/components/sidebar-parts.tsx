'use client';
import type { SidebarPageTreeComponents } from 'fumadocs-ui/components/sidebar/page-tree';
import { SidebarItem } from 'fumadocs-ui/components/sidebar/base';
import { usePathname } from 'fumadocs-core/framework';
import { docsRoute } from '@/lib/shared';

// The sidebar's group label — "Guides", and whatever comes after it.
//
// Fumadocs renders a separator as a bare `<p>`, which is a fine hook right up
// until the tree switcher above it also renders bare `<p>`s: styling
// `#nd-sidebar p` gave the switcher's title small caps, letter-spacing and a
// hairline under it, which is how "haus" became "H A U S" with a rule through
// the middle of the dropdown. So the label gets a class of its own and the
// stylesheet stops guessing.
export const Separator: SidebarPageTreeComponents['Separator'] = ({ item }) => (
  <p className="hf-group">
    {item.icon}
    {item.name}
  </p>
);

// A tree, in the sidebar at `/docs` — a LINK, never an accordion.
//
// The only folders in this page tree are the roots (`haus`, `pounce`, `perch`,
// `trill`): every tree's own `meta.json` lists its pages as explicit paths, so
// nothing below a root ever becomes a folder node. They are visible in one
// place only — `/docs` itself, which sits outside all four — and fumadocs'
// default there is a collapsible: a chevron that expands one tree's whole
// contents inline, under a title that isn't a link.
//
// That is the wrong affordance for this page and the user said so. `/docs` is
// a doorway with four `<Cards>` on it; the sidebar beside them should answer
// the same question the same way — click the name, arrive at the tree. An
// accordion instead asks the reader to browse a table of contents for a tree
// they have not chosen yet, and it does it in a 15px column where an
// eighteen-row expansion is unreadable.
//
// 🚨 A root folder's index page is NOT `node.index` by the time the layout
// sees it — it is lifted out of the tree, which is the same trap the eyebrow
// in `src/app/docs/[[...slug]]/page.tsx` documents. So the href comes from
// `$id`, which for a root folder is its directory under `content/docs` and
// therefore the first segment of every URL in it. `index` is still preferred
// where it exists, so a non-root folder (there are none today) keeps working.
//
// ⚠️ `SidebarItem` here is the **base** primitive, and it arrives unstyled: an
// `<a>` with no classes at all. The styled wrapper that `createPageTreeRenderer`
// is handed lives inside `fumadocs-ui/layouts/docs/slots/sidebar` and is not
// exported, so there is nothing to import. `.hf-tree` in `src/app/global.css`
// puts the row geometry back — and only the geometry: the colours, the hover
// and the active wash already come from the `#nd-sidebar a` rules that every
// other row in this sidebar reads, so this row cannot drift from them.
export const Folder: SidebarPageTreeComponents['Folder'] = ({ item }) => {
  const pathname = usePathname();
  const url = item.index?.url ?? `${docsRoute}/${item.$id}`;
  const active = pathname === url || pathname === `${url}/`;

  return (
    <SidebarItem className="hf-tree" href={url} active={active} icon={item.icon}>
      {item.name}
    </SidebarItem>
  );
};
