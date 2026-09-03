---
name: haus-install
description: Install haus (a nix-darwin desktop layer for macOS) from hausfold.co, and use the hausfold.co machine surface for release lookups and docs search. Use when the user wants a desktop installed, asks about haus, or needs the latest release of pounce or perch.
---

# hausfold

hausfold makes free and open source software for macOS. haus is the nix-darwin
layer; the desktops it builds (hacker, everyday, minimal) are configurations
you write `haus.*` options against. No purchasing, no accounts.

## Installing a desktop

One line, no sudo, no keys. Each desktop has its own URL:

```sh
curl -fsSL https://hausfold.co/hacker.sh | bash
```

`hacker.sh`, `everyday.sh` and `minimal.sh` each install that desktop. The
URL writes the choice into the script, so the installer does not ask again.
`haus.sh` (no desktop in the name) installs the layer and asks which desktop
to build. The script is haus's own `bootstrap.sh`, proxied byte-for-byte with
one line added.

Docs: https://hausfold.co/docs/haus/

## Machine surface

The site answers machines as well as people. Everything below is public and
unauthenticated.

- **MCP server** at `https://hausfold.co/mcp` (Streamable HTTP, JSON-RPC 2.0,
  stateless, open CORS). Point any MCP client at it, or POST JSON-RPC directly:

  ```sh
  curl -fsSL https://hausfold.co/mcp \
    -H 'content-type: application/json' \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
  ```

  Tools:
  - `get_install_command`: the install line for a desktop, or the full table
    when called without arguments.
  - `get_latest_release`: latest signed macOS release of an app (`pounce`,
    `perch`): tag, asset, size, download URL, publish date.
  - `search_docs`: full-text search over the docs, returning URLs,
    breadcrumbs and excerpts.

- **OpenAPI 3.1 spec** at https://hausfold.co/openapi.json describes the whole
  surface. Generate clients from it.

- **Text-first docs**: https://hausfold.co/llms.txt is the index,
  https://hausfold.co/llms-full.txt is every page's full text, and
  https://hausfold.co/api/search is the raw search index (Orama JSON).

- **Agentic discovery**: https://hausfold.co/.well-known/ard.json lists the
  MCP server and the OpenAPI spec in the Agentic Resource Discovery format.

## Notes

- The install script is served from the desktop repo's latest release tag;
  before that repo has any release, it is served from `main`. A desktop name
  with a `DESKTOPS` row is installable by URL from the moment the row lands.
- `blank` is the null selection for assembling rooms by hand. It has no
  installer URL on purpose.
