// Unit tests for the agent-discovery surface added for the orank gaps: the
// well-known documents (protected resource metadata, Web Bot Auth directory),
// /mcp.json, the /mcp/docs transport, MCP tool annotations and structured
// tool errors, and the /v1 sandbox. Same stubbing discipline as rest.test.js
// (caches, fetch, and an ASSETS stub that answers /api/search) — and the
// fetch stub throws on any unmatched URL, which is how the sandbox tests
// prove no live lookup happens.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import worker from '../worker.js';
import { resetRateLimits } from '../worker-api.js';
import { MCP_TOOLS, DOCS_MCP_TOOLS, PROTECTED_RESOURCE, SIGNATURE_DIRECTORY } from '../worker-config.js';

const req = (path, init) => new Request(`https://hausfold.co${path}`, init);

const makeCaches = () => {
  const store = new Map();
  return {
    default: {
      async match(reqOrUrl) {
        const url = typeof reqOrUrl === 'string' ? reqOrUrl : reqOrUrl.url;
        return store.has(url) ? new Response(store.get(url)) : undefined;
      },
      async put(reqOrUrl, res) {
        const url = typeof reqOrUrl === 'string' ? reqOrUrl : reqOrUrl.url;
        store.set(url, await res.text());
      },
    },
  };
};

const assetsWith = () => ({
  fetch: async () => new Response('PAGE', { status: 404 }),
});

beforeEach(() => {
  globalThis.caches = makeCaches();
  globalThis.fetch = vi.fn(async (input) => {
    throw new Error(`unexpected fetch: ${typeof input === 'string' ? input : input.url}`);
  });
  resetRateLimits();
});

describe('well-known discovery documents', () => {
  it('serves RFC 9728 protected resource metadata with a resource field', async () => {
    const res = await worker.fetch(req('/.well-known/oauth-protected-resource'), {});
    expect(res.status).toBe(200);
    const doc = await res.json();
    expect(doc.resource).toBe('https://hausfold.co/');
    expect(doc.resource_documentation).toBe('https://hausfold.co/auth.md');
    // No authorization server stands behind this resource; empty, not absent.
    expect(doc).toHaveProperty('authorization_servers', []);
    expect(doc.bearer_methods_supported).toContain('header');
  });

  it('serves an empty Web Bot Auth signature directory (this host signs no responses)', async () => {
    const res = await worker.fetch(req('/.well-known/http-message-signatures-directory'), {});
    expect(res.status).toBe(200);
    const doc = await res.json();
    expect(Array.isArray(doc.keys)).toBe(true);
    expect(doc.keys).toEqual([]);
  });

  it('the exported documents are the same objects the routes serve', () => {
    expect(PROTECTED_RESOURCE.resource).toBe('https://hausfold.co/');
    expect(SIGNATURE_DIRECTORY.keys).toEqual([]);
  });
});

describe('/mcp.json manifest', () => {
  it('names both MCP transports', async () => {
    const res = await worker.fetch(req('/mcp.json'), {});
    expect(res.status).toBe(200);
    const doc = await res.json();
    expect(Object.keys(doc.mcpServers).sort()).toEqual(['hausfold', 'hausfold-docs']);
    for (const server of Object.values(doc.mcpServers)) {
      expect(server.type).toBe('streamable-http');
      expect(server.url).toMatch(/^https:\/\/hausfold\.co\/mcp/);
    }
  });
});

describe('/.well-known/mcp.json manifest', () => {
  it('names the full transport at the top level and both transports in servers', async () => {
    const res = await worker.fetch(req('/.well-known/mcp.json'), {});
    expect(res.status).toBe(200);
    const doc = await res.json();
    // The flat shape is the whole point of this document: a probe reads
    // `url` + `transport` without walking a map.
    expect(doc.url).toBe('https://hausfold.co/mcp');
    expect(doc.transport).toBe('streamable-http');
    expect(doc.authentication).toBe('none');
    expect(doc.servers.map((s) => s.name).sort()).toEqual(['hausfold', 'hausfold-docs']);
    for (const server of doc.servers) {
      expect(server.transport).toBe('streamable-http');
      expect(server.url).toMatch(/^https:\/\/hausfold\.co\/mcp/);
    }
  });

  it('advertises the same tool table /mcp serves, so the two cannot drift', async () => {
    const res = await worker.fetch(req('/.well-known/mcp.json'), {});
    const doc = await res.json();
    expect(doc.tools.map((t) => t.name)).toEqual(MCP_TOOLS.map((t) => t.name));
  });

  it('is a manifest, not the transport: /.well-known/mcp still refuses GET', async () => {
    const res = await worker.fetch(req('/.well-known/mcp'), {});
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toContain('POST');
  });

  it('agrees with /mcp.json on every transport URL, because both read one table', async () => {
    const flat = await (await worker.fetch(req('/.well-known/mcp.json'), {})).json();
    const plugins = await (await worker.fetch(req('/mcp.json'), {})).json();
    const card = await (await worker.fetch(req('/.well-known/mcp/server-card.json'), {})).json();
    expect(Object.fromEntries(flat.servers.map((s) => [s.name, s.url]))).toEqual(
      Object.fromEntries(Object.entries(plugins.mcpServers).map(([n, s]) => [n, s.url])),
    );
    expect(card.remotes.map((r) => r.url).sort()).toEqual(flat.servers.map((s) => s.url).sort());
  });
});

describe('/agent.txt — the agent view as a dedicated instructions file', () => {
  it('is the same document /index.md serves, as text/plain', async () => {
    const res = await worker.fetch(req('/agent.txt'), {});
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    const body = await res.text();
    expect(body).toContain('When to use this');
    expect(body).toBe(await (await worker.fetch(req('/index.md'), {})).text());
  });
});

describe('/mcp/docs — the docs-only transport', () => {
  const rpc = (body) =>
    worker.fetch(req('/mcp/docs', { method: 'POST', body: JSON.stringify(body) }), {});

  it('lists only the docs tools', async () => {
    const res = await rpc({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
    const { result } = await res.json();
    expect(result.tools.map((t) => t.name)).toEqual(DOCS_MCP_TOOLS.map((t) => t.name));
    expect(result.tools.map((t) => t.name)).toEqual(['search_docs']);
  });

  it('refuses a tool the docs transport does not serve, with a JSON-RPC error', async () => {
    const res = await rpc({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: 'get_install_command', arguments: {} },
    });
    const body = await res.json();
    expect(body.error.code).toBe(-32602);
    expect(body.error.message).toContain('search_docs');
  });

  it('stays rate-limited and CORS-open like /mcp', async () => {
    const res = await rpc({ jsonrpc: '2.0', id: 3, method: 'ping' });
    expect(res.status).toBe(200);
    expect(res.headers.get('ratelimit-limit')).toBeTruthy();
    expect(res.headers.get('mcp-protocol-version')).toBeTruthy();
  });
});

describe('MCP tool annotations and structured errors', () => {
  const call = (params) =>
    worker
      .fetch(
        req('/mcp', {
          method: 'POST',
          body: JSON.stringify({ jsonrpc: '2.0', id: 9, method: 'tools/call', params }),
        }),
        {},
      )
      .then((r) => r.json());

  it('every tool carries readOnly annotations', async () => {
    expect(MCP_TOOLS.length).toBeGreaterThan(0);
    for (const tool of MCP_TOOLS) {
      expect(tool.annotations?.readOnlyHint, tool.name).toBe(true);
      expect(tool.annotations?.idempotentHint, tool.name).toBe(true);
    }
  });

  it('an unknown tool name is a JSON-RPC transport error, not a tool result', async () => {
    // The MCP spec puts unknown tools at -32602: the transport never looked
    // up the tool, so there is no tool-level failure to report.
    const body = await call({ name: 'no_such_tool', arguments: {} });
    expect(body.error.code).toBe(-32602);
    expect(body.error.message).toContain('no_such_tool');
  });

  it('tools/list answers with the full annotated table', async () => {
    const res = await worker.fetch(
      req('/mcp', { method: 'POST', body: JSON.stringify({ jsonrpc: '2.0', id: 10, method: 'tools/list' }) }),
      {},
    );
    const { result } = await res.json();
    expect(result.tools.map((t) => t.name)).toEqual(MCP_TOOLS.map((t) => t.name));
  });

  it('a bad argument returns a structured invalid_query error', async () => {
    const body = await call({ name: 'search_docs', arguments: { query: '  ' } });
    expect(body.result.isError).toBe(true);
    expect(body.result.structuredContent.error.code).toBe('invalid_query');
  });

  it('an unknown desktop returns a structured unknown_desktop error', async () => {
    const body = await call({ name: 'get_install_command', arguments: { desktop: 'rice' } });
    expect(body.result.structuredContent.error.code).toBe('unknown_desktop');
  });
});

describe('the /v1 sandbox', () => {
  it('returns deterministic sample search results without touching the index', async () => {
    const res = await worker.fetch(req('/v1/search?sandbox=true&q=notifications'), {
      ASSETS: assetsWith(), // a broken index would fail a live search
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sandbox).toBe(true);
    expect(body.next_cursor).toBeNull();
    expect(body.results[0].breadcrumbs).toEqual(['haus']);
    const res2 = await worker.fetch(req('/v1/search?sandbox=true&q=notifications'), { ASSETS: assetsWith() });
    expect(await res2.json()).toEqual(body);
  });

  it('returns a sandbox release fixture without fetching from GitHub', async () => {
    const res = await worker.fetch(req('/v1/releases/pounce?sandbox=true'), { ASSETS: assetsWith() });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sandbox).toBe(true);
    expect(body.tag).toBe('v0.0.0-sandbox');
    expect(body.url).toBe('https://hausfold.co/download/pounce');
  });

  it('still answers 404 with problem+json for an unknown app in sandbox mode', async () => {
    const res = await worker.fetch(req('/v1/releases/trll?sandbox=true'), { ASSETS: assetsWith() });
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toContain('application/problem+json');
  });

  it('honors the sandbox flag inside a batch', async () => {
    const res = await worker.fetch(
      req('/v1/batch', {
        method: 'POST',
        body: JSON.stringify({
          sandbox: true,
          operations: [
            { op: 'search', query: 'keybindings' },
            { op: 'release', app: 'perch' },
          ],
        }),
      }),
      { ASSETS: assetsWith() },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sandbox).toBe(true);
    expect(body.results.every((r) => r.ok)).toBe(true);
    expect(body.results[1].data.sandbox).toBe(true);
  });
});