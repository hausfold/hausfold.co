import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { Provider } from '@/components/provider';
import { Folder, Separator } from '@/components/sidebar-parts';

// `<Provider>` is here rather than in the root layout, and that placement is
// the whole of what keeps the landing pages quiet. It carries fumadocs' search
// context — including the ⌘K binding and the fetch of the ~457 KB Orama index —
// plus `next-themes`, and `DocsLayout` requires all of it. At the root it
// reached `/`, `/perch` and the rest for nothing; here it reaches exactly the
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
        // The layer and the three apps are four trees, not four sections of
        // one. `content/docs/*/meta.json`'s `root: true` makes each a tab, and
        // `tabMode: 'auto'` renders the switcher as a dropdown at the head of
        // the sidebar rather than a row of tabs across the top — the same
        // shape Vercel uses for app-router vs pages-router, and the right one
        // here because the trees are about different things rather than
        // being views of the same thing.
        tabMode="auto"
        // Two overrides, both in `src/components/sidebar-parts.tsx`:
        //
        //   Separator  a selector fix — the group label gets a class instead
        //              of being styled as "the bare `<p>` in the sidebar",
        //              which the tree switcher also is.
        //   Folder     a shape change — at `/docs`, where the four roots are
        //              the sidebar's whole contents, each is a link to its
        //              tree rather than an accordion over it.
        sidebar={{ components: { Separator, Folder } }}
        {...baseOptions()}
      >
        {children}
      </DocsLayout>
    </Provider>
  );
}
