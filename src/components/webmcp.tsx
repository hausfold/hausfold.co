'use client';

import { useEffect } from 'react';

// WebMCP: the W3C draft that lets a browser-resident agent (Chrome 157+,
// the ChatGPT desktop browser) call site tools registered on
// document.modelContext. navigator.modelContext is the deprecated
// pre-Chrome-150 alias and is probed second. Registration is a no-op
// everywhere the API is absent, so this is pure enhancement: the page
// renders and behaves identically with or without it.
//
// The tools mirror the REST reads under /v1 and the /mcp tool table, so the
// agent executes the same public, keyless surface any curl could hit. There
// is nothing to authorize and nothing to sign. Mounted from src/app/layout.tsx
// (every page, landing half included — the one pure-enhancement exception),
// so a browser-resident agent sees the same menu on the homepage as in the
// docs.
//
// No teardown: a modelContext lives for the page, and a tool registered
// once per mount is one tool, not a leak.

type ToolDef = {
  name: string;
  description: string;
  inputSchema: object;
  execute: (args: unknown) => Promise<string>;
};

export function WebMcpTools() {
  useEffect(() => {
    const mc =
      (document as unknown as { modelContext?: { registerTool?: (t: ToolDef) => void } })
        .modelContext ??
      (navigator as unknown as { modelContext?: { registerTool?: (t: ToolDef) => void } })
        .modelContext;
    if (!mc || typeof mc.registerTool !== 'function') return;

    const tools: ToolDef[] = [
      {
        name: 'search_hausfold_docs',
        description:
          'Full-text search of the hausfold.co documentation (haus, pounce, perch, trill, scruff).',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'What to look for.' },
          },
          required: ['query'],
        },
        execute: async (args) => {
          const query = encodeURIComponent(String((args as { query?: string })?.query ?? ''));
          const res = await fetch(`/v1/search?q=${query}`);
          const data = await res.json();
          return JSON.stringify(data.results ?? data);
        },
      },
      {
        name: 'get_hausfold_install_command',
        description:
          'The one-line install command for a hausfold desktop (haus, hacker, everyday, minimal).',
        inputSchema: {
          type: 'object',
          properties: {
            desktop: {
              type: 'string',
              enum: ['haus', 'hacker', 'everyday', 'minimal'],
            },
          },
          required: ['desktop'],
        },
        execute: async (args) => {
          const desktop = String((args as { desktop?: string })?.desktop ?? '');
          const res = await fetch(`/v1/desktops`);
          const data = await res.json();
          const hit = (data.results ?? []).find((d: { desktop?: string }) => d.desktop === desktop);
          return JSON.stringify(hit ?? { error: 'unknown desktop' });
        },
      },
      {
        name: 'get_hausfold_release',
        description:
          'Latest signed macOS release of a hausfold app (pounce, perch): tag, asset, size, download URL.',
        inputSchema: {
          type: 'object',
          properties: {
            app: { type: 'string', enum: ['pounce', 'perch'] },
          },
          required: ['app'],
        },
        execute: async (args) => {
          const app = encodeURIComponent(String((args as { app?: string })?.app ?? ''));
          const res = await fetch(`/v1/releases/${app}`);
          return JSON.stringify(await res.json());
        },
      },
    ];
    for (const tool of tools) {
      try {
        mc.registerTool(tool);
      } catch {
        // A host that rejects a registration should not break the page.
      }
    }
  }, []);

  return null;
}
