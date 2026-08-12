'use client';
import SearchDialog from '@/components/search';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { type ReactNode } from 'react';

export function Provider({ children }: { children: ReactNode }) {
  return (
    <RootProvider
      theme={{
        // Two attributes, on purpose. fumadocs-ui's own dark tokens live
        // under `.dark`; `public/hausfold.css` — which the hand-written
        // pages share and this build imports — forks on
        // `:root[data-theme="dark"]`. Writing both means one toggle drives
        // both stylesheets and neither needs to learn the other's
        // convention.
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
