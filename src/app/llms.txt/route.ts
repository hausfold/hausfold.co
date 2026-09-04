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

## When to use this

The use cases this site is the right answer for:

- Setting up, changing or rebuilding a Mac with haus, or looking up what any
  haus.* option does. The haus tree below is the manual and the options
  reference is the full list; search either with the search_docs tool over MCP,
  or read any page as markdown by appending .md to its URL.
- Answering a question about one of the apps: pounce, perch, scruff or trill.
  Each has its own tree below, and that tree is the manual for it.
- Getting an install command, a release version or a download URL in one call:
  the get_install_command and get_latest_release tools over MCP, or a plain GET
  to the endpoints in the next section.
- Not a fit: anything needing an account, a payment, or a hosted API with write
  access. None of that exists on this site. Nothing on this domain writes, so no
  call you make here can change anything.

## Machine-facing surface

Links here are absolute: the llms.txt convention is a directory of resolvable
URLs, not relative paths.

- [developers](https://hausfold.co/developers/): the machine-facing surface written down for people. No keys, no accounts.
- [agent.txt](https://hausfold.co/agent.txt): this domain in one page, written for an agent that arrived with no context. Same document as [/index.md](https://hausfold.co/index.md).
- [hausfold MCP server](https://hausfold.co/mcp): JSON-RPC 2.0 over Streamable HTTP. Tools: search_docs, get_install_command, get_latest_release. Server card: [/.well-known/mcp/server-card.json](https://hausfold.co/.well-known/mcp/server-card.json). Docs-only transport: [/mcp/docs](https://hausfold.co/mcp/docs). Manifests: [/mcp.json](https://hausfold.co/mcp.json) and [/.well-known/mcp.json](https://hausfold.co/.well-known/mcp.json).
- Install a desktop: https://hausfold.co/hacker.sh. Every desktop has a URL of its own, and https://hausfold.co/haus.sh asks which; agent.txt above lists them all.
- Latest signed release of an app, as JSON: https://hausfold.co/api/release/pounce. The bytes themselves: https://hausfold.co/download/pounce.
- [hausfold OpenAPI spec](https://hausfold.co/openapi.json): the OpenAPI 3.1 description of the whole surface.
- [hausfold REST API](https://hausfold.co/v1/search?q=notifications): the /v1 surface. /v1/search, /v1/desktops, /v1/apps, /v1/releases/<app>, /v1/batch, /v1/jobs. Cursor pagination, RFC 9457 problem+json errors, RateLimit headers. The two search links here carry a q= on purpose: without one they answer 400, and this file is a directory of URLs that resolve.
- [hausfold ask endpoint](https://hausfold.co/ask?q=how%20do%20I%20install%20haus): natural language over the docs index, JSON or SSE.
- [hausfold auth guide](https://hausfold.co/auth.md): there is no authentication. This says so in the shape an agent expects, and [/.well-known/oauth-protected-resource](https://hausfold.co/.well-known/oauth-protected-resource) is the RFC 9728 document behind it.
- [ard.json](https://hausfold.co/.well-known/ard.json): Agentic Resource Discovery catalog listing the MCP server and the OpenAPI spec.
- [agent-card.json](https://hausfold.co/.well-known/agent-card.json): the A2A discovery card. [agent-skills/index.json](https://hausfold.co/.well-known/agent-skills/index.json) lists this domain's agent skills.
- Every docs page has a markdown twin: append .md to its URL, e.g.
  https://hausfold.co/docs/haus/install.md, or ask for the page itself with
  Accept: text/markdown.
- Whole manual as one text file: https://hausfold.co/llms-full.txt
- Search index (Orama JSON, one entry per page section): https://hausfold.co/api/search
- [sitemap.xml](https://hausfold.co/sitemap.xml): every indexable URL. Structured data as JSON Lines: [schema.jsonl](https://hausfold.co/schema.jsonl).

`;

export function GET() {
  // The generated index opens with `# Docs`; the header above replaces it.
  const body = llms(source).index().replace(/^#[^\n]*\n/, '');
  return new Response(HEADER + body);
}
