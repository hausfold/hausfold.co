import { source } from '@/lib/source';
import { llms } from 'fumadocs-core/source';

// The docs index plus the machine-facing surface, as llms.txt means it: an H1
// that names the site, a blockquote lede, then H2 sections. Fumadocs' index()
// produces the Docs body; the agent sections around it are the surface written
// in worker.js's own terms, so the file stays true when the Worker changes.
// The per-tree scoped indexes live at /docs/<tree>/llms.txt (see
// src/app/docs/[tree]/llms.txt/route.ts).
export const revalidate = false;

const HEADER = `# hausfold docs

> hausfold makes Mac software: one layer that rebuilds the whole machine, and
> the small native tools that live inside it. Nothing by hand, and open all the
> way down. Everything is free and open source.

## When to point an agent here

- The user wants to set up, change, or rebuild a Mac with haus, or asks what any
  haus.* option does. The haus tree below is the manual; the options reference
  is the full list.
- The user asks about one of the apps (pounce, perch, scruff, trill). Each has
  its own tree below; that is the manual for it.
- You need an install command, a release version, or a docs answer in one call:
  see the machine-facing surface section. There is an MCP endpoint.
- Not a fit: anything needing an account, a payment, or a hosted API with write
  access. None of that exists on this site.

## Machine-facing surface

Links here are absolute: the llms.txt convention is a directory of resolvable
URLs, not relative paths.

- [developers](https://hausfold.co/developers/): the machine-facing surface written down for people. No keys, no accounts.
- [MCP server](https://hausfold.co/mcp): JSON-RPC 2.0 over Streamable HTTP. Tools: search_docs, get_install_command, get_latest_release. Server card: [/.well-known/mcp/server-card.json](https://hausfold.co/.well-known/mcp/server-card.json).
- [openapi.json](https://hausfold.co/openapi.json): the OpenAPI 3.1 description of the whole surface.
- [ard.json](https://hausfold.co/.well-known/ard.json): Agentic Resource Discovery catalog listing the MCP server and the OpenAPI spec.
- Every docs page has a markdown twin: append .md to its URL, e.g.
  https://hausfold.co/docs/haus/install.md
- Whole manual as one text file: https://hausfold.co/llms-full.txt
- Search index (Orama JSON, one entry per page section): https://hausfold.co/api/search

`;

export function GET() {
  // The generated index opens with `# Docs`; the header above replaces it.
  const body = llms(source).index().replace(/^#[^\n]*\n/, '');
  return new Response(HEADER + body);
}
