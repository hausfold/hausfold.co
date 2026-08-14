import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { Provider } from '@/components/provider';
import { Separator } from '@/components/sidebar-parts';

// `<Provider>` is here rather than in the root layout, and that placement is
// the whole of what keeps the landing pages quiet. It carries fumadocs' search
// context — including the ⌘K binding and the fetch of the ~457 KB Orama index —
// plus `next-themes`, and `DocsLayout` requires all of it. At the root it
// reached `/`, `/terms` and the rest for nothing; here it reaches exactly the
// pages that spend it.
//
// Consequence worth knowing: the light/dark toggle is a `/docs` affordance
// only. The landing pages follow `prefers-color-scheme`, as they did when they
// were hand-written HTML. See the note in `src/app/layout.tsx`.
export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <Provider>
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
    </Provider>
  );
}
