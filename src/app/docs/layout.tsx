import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { Separator } from '@/components/sidebar-parts';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      // The layer and the desktops are two trees, not two sections of one.
      // `content/docs/*/meta.json`'s `root: true` makes each a tab, and
      // `tabMode: 'auto'` renders the switcher as a dropdown at the head of
      // the sidebar rather than a row of tabs across the top — the same
      // shape Vercel uses for app-router vs pages-router, and the right one
      // here because the two trees are about different things rather than
      // being two views of the same thing.
      tabMode="auto"
      // One override, and it is about a selector rather than a shape: the
      // group label gets a class instead of being styled as "the bare `<p>`
      // in the sidebar", which the tree switcher also is. See
      // `src/components/sidebar-parts.tsx`.
      sidebar={{ components: { Separator } }}
      {...baseOptions()}
    >
      {children}
    </DocsLayout>
  );
}
