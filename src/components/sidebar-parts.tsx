'use client';
import type { SidebarPageTreeComponents } from 'fumadocs-ui/components/sidebar/page-tree';

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

// 🚨 A `Folder` override lived here from 2026-08-14 to 2026-08-17, rendering a
// root folder as a link rather than as fumadocs' collapsible. It is deleted
// rather than kept, because the page that was its only caller is: `/docs` was
// a doorway with four `<Cards>` on it, and the four roots were the sidebar's
// whole contents *there* and nowhere else — every tree's `meta.json` lists its
// pages as explicit paths, so nothing below a root is ever a folder node.
// Inside a tree the switcher is what moves between them.
//
// If a page outside all four trees ever comes back, so does this: `git log
// -- src/components/sidebar-parts.tsx` has it, and the one non-obvious line
// is that the href comes from `$id`, not from `node.index`, because a root
// folder's index page is lifted out of the tree before the layout sees it.
