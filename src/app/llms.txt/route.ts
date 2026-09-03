import { source } from '@/lib/source';
import { llms } from 'fumadocs-core/source';

export const revalidate = false;

// The docs index plus a Developer surface section. The docs tree is what
// llms() can generate; the machine-facing surface (installers, MCP, the spec,
// the discovery files) lives outside it and would be invisible to an agent
// that stopped reading at the generated half. Links here are absolute: the
// llms.txt convention is a directory of resolvable URLs, not relative paths.
export function GET() {
  const docs = llms(source).index();
  const developerSurface = `

## Developer surface

- [developers](https://hausfold.co/developers/): the machine-facing surface of hausfold.co written down. No keys, no accounts.
- [MCP server](https://hausfold.co/mcp): JSON-RPC 2.0 over Streamable HTTP. Tools: get_install_command, get_latest_release, search_docs.
- [openapi.json](https://hausfold.co/openapi.json): the OpenAPI 3.1 description of the whole surface.
- [ard.json](https://hausfold.co/.well-known/ard.json): Agentic Resource Discovery catalog listing the MCP server and the OpenAPI spec.
`;
  return new Response(docs + developerSurface);
}
