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
