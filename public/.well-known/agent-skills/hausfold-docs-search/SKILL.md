---
name: hausfold-docs-search
description: Search and read the hausfold manuals (haus, pounce, perch, scruff, trill) as text. Use when a question about a haus.* option, a keyboard shortcut, an install step, or any behaviour of these Mac tools needs an authoritative answer.
---

# hausfold docs search

The manuals for haus (the macOS layer) and its apps live at hausfold.co. They
are readable as plain text, so no browser or HTML scraping is needed.

## Fastest: search over MCP

POST JSON-RPC 2.0 to `https://hausfold.co/mcp` (Streamable HTTP, stateless, no
auth). Three tools:

- `search_docs` — full-text search. Returns page URLs, breadcrumbs, and an
  excerpt per match. `{ "query": "touch id sudo", "limit": 5 }`
- `get_install_command` — the install one-liner for a desktop.
- `get_latest_release` — latest version of pounce or perch.

Handshake first (`initialize`), then `tools/call`. Or skip MCP entirely:

## Plain text, no protocol

- `https://hausfold.co/llms.txt` — the index: every page, one line each.
- `https://hausfold.co/llms-full.txt` — every page's full text in one file.
  Best when you will ask several questions across a topic.
- A markdown twin of any page: its URL plus `.md`, e.g.
  `https://hausfold.co/docs/haus/install.md`
- `https://hausfold.co/api/search` — the raw Orama search index (JSON, one
  entry per page section with URL and breadcrumbs).

## Choosing a page

Option questions are answered by `/docs/haus/reference/options` (every option,
type and default). Command questions by `/docs/haus/reference/haus`. If you
don't know which app a question is about, `search_docs` sorts that out faster
than guessing.
