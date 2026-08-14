'use client';
import SearchDialog from '@/components/search';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { type ReactNode } from 'react';

// 🚨 **Mounted by `src/app/docs/layout.tsx`, not by the root layout.** It
// carries fumadocs' search context — the ⌘K binding and the lazy fetch of the
// Orama index — plus `next-themes`, and it doubles a page's JS. At the root it
// reached every landing page for nothing; scoped to `/docs` it reaches
// exactly what spends it. If a component ever demands it higher up, give that
// component its own provider rather than raising this one.
export function Provider({ children }: { children: ReactNode }) {
  return (
    <RootProvider
      theme={{
        // Two attributes, on purpose. fumadocs-ui's own dark tokens live
        // under `.dark`; `public/hausfold.css` — which the landing pages are
        // built out of and this build imports — forks on
        // `:root[data-theme="dark"]`. Writing both means one toggle drives
        // both stylesheets and neither needs to learn the other's
        // convention. (`data-theme` earns its keep on a `/docs` page too: the
        // shared sheet is what colours a code block and a table rule there.)
        attribute: ['class', 'data-theme'],
        defaultTheme: 'system',
        enableSystem: true,
      }}
      search={{ SearchDialog }}
    >
      {children}
    </RootProvider>
  );
}
