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
import { readFileSync } from 'node:fs';
import { MCP_TOOLS, DOCS_MCP_TOOLS, A2A_SKILLS, PROTECTED_RESOURCE, AUTHORIZATION_SERVER, JWKS } from '../worker-config.js';

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

// llms.txt is a Next route, so the Worker tests can't reach it. What is
// pinned here is the part a readiness scanner greps for and a person would
// rename without thinking: the when-to-use heading, and the developer
// resources named with the product in the name so a name-based search finds
// them. The body under the header is fumadocs' generated page index.
describe('llms.txt: the agent instruction half', () => {
  const route = readFileSync(new URL('../src/app/llms.txt/route.ts', import.meta.url), 'utf8');
  // The HEADER template literal alone. The em-dash rule is about COPY, and
  // AGENTS.md exempts code comments by name, so a whole-file match would fail
  // the build for a comment the rulebook allows.
  const header = route.slice(route.indexOf('const HEADER = `'), route.lastIndexOf('`;'));

  it('carries a when-to-use section under that name', () => {
    expect(route).toContain('## When to use this');
  });

  it('points at the short form of itself', () => {
    expect(route).toContain('https://hausfold.co/agent.txt');
  });

  it('names the developer resources with the product in the name', () => {
    for (const name of [
      'hausfold MCP server',
      'hausfold OpenAPI spec',
      'hausfold REST API',
      'hausfold ask endpoint',
      'hausfold auth guide',
    ]) {
      expect(route, name).toContain(name);
    }
  });

  it('lists the sitemap, which is how a crawler is meant to find every URL', () => {
    expect(route).toContain('https://hausfold.co/sitemap.xml');
  });

  it('has no em dashes in the copy: it is text an agent reads', () => {
    expect(header.length).toBeGreaterThan(500); // the slice actually found it
    expect(header).not.toMatch(/—|–/);
  });

  it('the two search links carry a query, because a bare one answers 400', () => {
    expect(header).toContain('https://hausfold.co/v1/search?q=');
    expect(header).toContain('https://hausfold.co/ask?q=');
  });
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

  // The keyed case, and the signatures themselves, are test/bot-auth.test.js.
  it('serves an empty Web Bot Auth signature directory when no key secret is set', async () => {
    const res = await worker.fetch(req('/.well-known/http-message-signatures-directory'), {});
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/http-message-signatures-directory+json');
    const doc = await res.json();
    expect(Array.isArray(doc.keys)).toBe(true);
    expect(doc.keys).toEqual([]);
  });

  it('the exported document is the same object the route serves', () => {
    expect(PROTECTED_RESOURCE.resource).toBe('https://hausfold.co/');
  });

  it('a HEAD of a discovery document answers 200, not the site 404', async () => {
    for (const path of ['/.well-known/oauth-protected-resource', '/.well-known/oauth-authorization-server', '/.well-known/mcp.json']) {
      const res = await worker.fetch(req(path, { method: 'HEAD' }), {});
      expect(res.status, path).toBe(200);
      expect(res.headers.get('content-type'), path).toContain('application/json');
    }
  });
});

describe('RFC 8414 authorization server metadata (an issuer that grants nothing)', () => {
  it('serves the document, and it says up front that no token can be had', async () => {
    const res = await worker.fetch(req('/.well-known/oauth-authorization-server'), {});
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    const doc = await res.json();
    expect(doc.issuer).toBe('https://hausfold.co');
    // Empty, not absent: absent grant types default to authorization_code
    // and implicit, which would be a claim.
    expect(doc).toHaveProperty('grant_types_supported', []);
    expect(doc).toHaveProperty('response_types_supported', []);
    expect(doc).toHaveProperty('token_endpoint_auth_methods_supported', []);
    expect(doc.service_documentation).toBe('https://hausfold.co/auth.md');
    expect(doc.agent_auth).toEqual({
      skill: 'https://hausfold.co/auth.md',
      identity_types_supported: ['anonymous'],
    });
    expect(doc).toEqual(AUTHORIZATION_SERVER);
  });

  it('issuer has no trailing slash and is the origin the well-known URL hangs off', () => {
    // RFC 8414 §3: the well-known URL is built from the issuer, and a client
    // compares the two strings byte for byte.
    expect(AUTHORIZATION_SERVER.issuer.endsWith('/')).toBe(false);
    expect(new URL(AUTHORIZATION_SERVER.issuer).origin).toBe('https://hausfold.co');
    expect(AUTHORIZATION_SERVER.issuer).not.toMatch(/[?#]/);
  });

  it('names no endpoint that 404s on this host', async () => {
    // auth.md's rule: a discovery document pointing at a dead URL is worse
    // than none. Every URL the metadata names on this origin must be
    // answered by the Worker itself (the assets stub answers 404 to
    // everything, so a route that fell through would fail here).
    for (const field of ['authorization_endpoint', 'token_endpoint', 'jwks_uri']) {
      const url = new URL(AUTHORIZATION_SERVER[field]);
      expect(url.origin, field).toBe('https://hausfold.co');
      const res = await worker.fetch(req(url.pathname, { method: field === 'token_endpoint' ? 'POST' : 'GET' }), {});
      expect(res.status, field).not.toBe(404);
    }
  });

  it('/oauth/authorize refuses in problem+json and never redirects', async () => {
    for (const method of ['GET', 'POST']) {
      const res = await worker.fetch(
        req('/oauth/authorize?response_type=code&client_id=x&redirect_uri=https%3A%2F%2Fevil.example%2Fcb', { method }),
        {},
      );
      expect(res.status, method).toBe(400);
      expect(res.headers.get('location'), method).toBeNull();
      expect(res.headers.get('content-type'), method).toBe('application/problem+json');
      expect(res.headers.get('ratelimit-limit'), method).toBeTruthy();
      const body = await res.json();
      expect(body.code, method).toBe('no_grant_types');
      expect(body.detail, method).toContain('auth.md');
    }
    const res = await worker.fetch(req('/oauth/authorize', { method: 'DELETE' }), {});
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('GET, POST');
  });

  it('/oauth/token answers RFC 6749 §5.2 errors, POST only', async () => {
    const get = await worker.fetch(req('/oauth/token'), {});
    expect(get.status).toBe(405);
    expect(get.headers.get('allow')).toBe('POST');

    const form = await worker.fetch(
      req('/oauth/token', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=client_credentials&client_id=x&client_secret=y',
      }),
      {},
    );
    expect(form.status).toBe(400);
    expect(form.headers.get('content-type')).toBe('application/json');
    expect(form.headers.get('cache-control')).toBe('no-store');
    const formBody = await form.json();
    expect(formBody.error).toBe('unsupported_grant_type');
    expect(formBody.error_description).toContain('client_credentials');
    expect(formBody.error_uri).toBe('https://hausfold.co/auth.md');

    const json = await worker.fetch(
      req('/oauth/token', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ grant_type: 'authorization_code', code: 'abc' }),
      }),
      {},
    );
    expect((await json.json()).error).toBe('unsupported_grant_type');

    const empty = await worker.fetch(req('/oauth/token', { method: 'POST' }), {});
    expect(empty.status).toBe(400);
    expect((await empty.json()).error).toBe('invalid_request');

    const garbage = await worker.fetch(
      req('/oauth/token', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{not json' }),
      {},
    );
    expect((await garbage.json()).error).toBe('invalid_request');
  });

  it('/oauth/token does not echo an unbounded grant_type back', async () => {
    const res = await worker.fetch(
      req('/oauth/token', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: `grant_type=${'a'.repeat(5000)}`,
      }),
      {},
    );
    const body = await res.json();
    expect(body.error).toBe('unsupported_grant_type');
    expect(body.error_description.length).toBeLessThan(400);
  });

  it('/.well-known/jwks.json is an empty key set (nothing is signed)', async () => {
    const res = await worker.fetch(req('/.well-known/jwks.json'), {});
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(await res.json()).toEqual({ keys: [] });
    expect(JWKS.keys).toEqual([]);
    const post = await worker.fetch(req('/.well-known/jwks.json', { method: 'POST' }), {});
    expect(post.status).toBe(405);
    expect(post.headers.get('allow')).toBe('GET, HEAD');
  });

  it('there is no openid-configuration: this host is not an OpenID Provider', async () => {
    const res = await worker.fetch(req('/.well-known/openid-configuration'), {});
    expect(res.status).toBe(404);
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

  it("hands the same docs-transport URL to a connecting client as the manifests do", async () => {
    // initialize's `instructions` is what every MCP client reads on connect,
    // so a stale path in it fails silently. It reads MCP_TRANSPORTS; this is
    // the check that it keeps doing so.
    const flat = await (await worker.fetch(req('/.well-known/mcp.json'), {})).json();
    const docsUrl = flat.servers.find((s) => s.name === 'hausfold-docs').url;
    const res = await worker.fetch(
      req('/mcp', {
        method: 'POST',
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }),
      }),
      {},
    );
    const { result } = await res.json();
    expect(result.instructions).toContain(docsUrl);
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
// The A2A surface: the agent card the Worker generates and the /a2a JSON-RPC
// binding it names. What is pinned is the contract a stranger's A2A client
// reads off the card — the interface, the version, the skills — and that the
// interface then answers the way the card says.
const DOCS_INDEX = {
  docs: {
    docs: {
      a: {
        id: 'a',
        content: 'The notifications room wires trill banners and rules.json is the dial.',
        breadcrumbs: ['Docs', 'trill', 'Rules'],
        url: '/docs/trill/rules',
      },
    },
  },
};
const assetsWithIndex = () => ({
  fetch: async (request) =>
    new URL(request.url).pathname === '/api/search'
      ? new Response(JSON.stringify(DOCS_INDEX))
      : new Response('PAGE', { status: 404 }),
});
const rpc = (method, params, init = {}) =>
  worker.fetch(
    req('/a2a', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    }),
    { ASSETS: assetsWithIndex() },
  );
const send = (parts, extra = {}, init) =>
  rpc('SendMessage', { message: { messageId: 'm1', role: 'ROLE_USER', parts, ...extra } }, init);

describe('/.well-known/agent-card.json (A2A)', () => {
  it('is an A2A 1.0 card whose one interface is the JSON-RPC binding at /a2a', async () => {
    const res = await worker.fetch(req('/.well-known/agent-card.json'), {});
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/json');
    const card = await res.json();
    for (const field of ['name', 'description', 'version', 'supportedInterfaces', 'capabilities', 'skills', 'defaultInputModes', 'defaultOutputModes']) {
      expect(card[field], field).toBeDefined();
    }
    expect(card.supportedInterfaces).toEqual([
      { url: 'https://hausfold.co/a2a', protocolBinding: 'JSONRPC', protocolVersion: '1.0' },
    ]);
    expect(card.capabilities).toEqual({ streaming: false, pushNotifications: false, extendedAgentCard: false });
    // The old 0.3 shape must not linger beside the new one.
    for (const gone of ['url', 'protocolVersion', 'preferredTransport', 'additionalInterfaces']) {
      expect(card[gone], gone).toBeUndefined();
    }
  });

  it('names one skill per MCP tool, and nothing that is not a tool', async () => {
    const card = await (await worker.fetch(req('/.well-known/agent-card.json'), {})).json();
    expect(card.skills.map((s) => s.id).sort()).toEqual(['install-command', 'latest-release', 'search-docs']);
    expect(A2A_SKILLS.map((s) => s.tool).sort()).toEqual(MCP_TOOLS.map((t) => t.name).sort());
    for (const skill of card.skills) {
      for (const field of ['id', 'name', 'description', 'tags']) expect(skill[field], `${skill.id}.${field}`).toBeTruthy();
      expect(skill.tool, `${skill.id} leaks its tool`).toBeUndefined();
    }
  });

  it('carries the identity the MCP server card carries', async () => {
    const card = await (await worker.fetch(req('/.well-known/agent-card.json'), {})).json();
    const mcp = await (await worker.fetch(req('/.well-known/mcp/server-card.json'), {})).json();
    expect(card.name).toBe(mcp.title);
    expect(card.version).toBe(mcp.version);
  });

  it('caches by ETag and answers HEAD', async () => {
    const first = await worker.fetch(req('/.well-known/agent-card.json'), {});
    const etag = first.headers.get('etag');
    expect(etag).toMatch(/^"[0-9a-f]{32}"$/);
    expect(first.headers.get('cache-control')).toContain('max-age=');
    const again = await worker.fetch(req('/.well-known/agent-card.json', { headers: { 'if-none-match': etag } }), {});
    expect(again.status).toBe(304);
    const head = await worker.fetch(req('/.well-known/agent-card.json', { method: 'HEAD' }), {});
    expect(head.status).toBe(200);
    expect(head.headers.get('etag')).toBe(etag);
    const any = await worker.fetch(req('/.well-known/agent-card.json', { headers: { 'if-none-match': '*' } }), {});
    expect(any.status).toBe(304);
  });

  it('is listed where the other service descriptions are', async () => {
    const catalog = await (await worker.fetch(req('/.well-known/api-catalog'), {})).json();
    expect(catalog.linkset[0].item).toContainEqual({
      href: 'https://hausfold.co/.well-known/agent-card.json',
      rel: 'service-desc',
      type: 'application/json',
    });
  });
});

describe('/a2a (A2A JSON-RPC binding)', () => {
  it('answers a text message with a Message: a text part and a data part of docs hits', async () => {
    const res = await send([{ text: 'notifications' }], { contextId: 'ctx-1' });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/json');
    expect(res.headers.get('ratelimit-limit') ?? res.headers.get('ratelimit')).toBeTruthy();
    const { result, error } = await res.json();
    expect(error).toBeUndefined();
    expect(result.task).toBeUndefined();
    const { message } = result;
    expect(message.role).toBe('ROLE_AGENT');
    expect(message.contextId).toBe('ctx-1');
    expect(message.messageId).toMatch(/^[0-9a-f-]{36}$/);
    expect(message.parts[0].text).toContain('https://hausfold.co/docs/trill/rules');
    expect(message.parts[1].data.results[0].url).toBe('/docs/trill/rules');
    expect(message.metadata).toEqual({ skill: 'search-docs', tool: 'search_docs' });
  });

  it('runs a skill named in a data part, and infers one from its keys', async () => {
    globalThis.fetch = vi.fn(async (input) => {
      const url = typeof input === 'string' ? input : input.url;
      if (!url.includes('api.github.com')) throw new Error(`unexpected fetch: ${url}`);
      return new Response(
        JSON.stringify({
          tag_name: 'v2026.08.14',
          assets: [{ name: 'pounce-2026.08.14-macos.dmg', size: 123, browser_download_url: 'https://github.com/hausfold/pounce/releases/download/v2026.08.14/pounce-2026.08.14-macos.dmg' }],
          published_at: '2026-08-14T00:00:00Z',
        }),
      );
    });
    const named = await (await send([{ data: { skill: 'install-command', desktop: 'hacker' } }])).json();
    expect(named.result.message.parts[1].data.desktops).toEqual([
      expect.objectContaining({ desktop: 'hacker', command: 'curl -fsSL https://hausfold.co/hacker.sh | bash' }),
    ]);
    expect(named.result.message.parts[0].text).toContain('hacker.sh');
    const inferred = await (await send([{ data: { app: 'pounce' } }])).json();
    expect(inferred.result.message.metadata.skill).toBe('latest-release');
    expect(inferred.result.message.parts[1].data.tag).toBe('v2026.08.14');
  });

  it('reports a tool failure as the agent speaking, not as a protocol error', async () => {
    const { result } = await (await send([{ data: { skill: 'latest-release', app: 'trll' } }])).json();
    expect(result.message.metadata.error).toBe('unknown_app');
    expect(result.message.parts[0].text).toContain('unknown app');
  });

  it('refuses with the spec codes: no usable part, unknown skill, a task to continue', async () => {
    expect((await (await send([{ url: 'https://example.com/x.png' }])).json()).error.code).toBe(-32005);
    expect((await (await send([{ data: { skill: 'make-coffee' } }])).json()).error.code).toBe(-32602);
    const task = (await (await send([{ text: 'hi' }], { taskId: 't-1' })).json()).error;
    expect(task.code).toBe(-32001);
    expect(task.data[0].reason).toBe('TASK_NOT_FOUND');
  });

  it('declines what the card declares off: streaming, push, tasks, the extended card', async () => {
    const codes = {};
    for (const [method, params] of [
      ['SendStreamingMessage', { message: { parts: [{ text: 'x' }] } }],
      ['GetTask', { id: 't-1' }],
      ['ListTasks', {}],
      ['CreateTaskPushNotificationConfig', { taskId: 't-1' }],
      ['GetExtendedAgentCard', {}],
      ['Frobnicate', {}],
      ['message/send', {}],
    ]) {
      const body = await (await rpc(method, params)).json();
      codes[method] = body.error?.code ?? body.result;
    }
    expect(codes).toEqual({
      SendStreamingMessage: -32004,
      GetTask: -32001,
      ListTasks: { tasks: [], nextPageToken: '', pageSize: 0, totalSize: 0 },
      CreateTaskPushNotificationConfig: -32003,
      GetExtendedAgentCard: -32007,
      Frobnicate: -32601,
      'message/send': -32009,
    });
  });

  it('honours the A2A-Version header: 1.x passes, anything else is -32009', async () => {
    expect((await (await send([{ text: 'x' }], {}, { headers: { 'a2a-version': '1.0' } })).json()).result).toBeDefined();
    expect((await (await send([{ text: 'x' }], {}, { headers: { 'a2a-version': '0.3' } })).json()).error.code).toBe(-32009);
  });

  it('is POST only, with CORS for a browser agent', async () => {
    const get = await worker.fetch(req('/a2a'), {});
    expect(get.status).toBe(405);
    expect(get.headers.get('allow')).toBe('POST, OPTIONS');
    expect((await get.json()).detail).toContain('/.well-known/agent-card.json');
    const options = await worker.fetch(req('/a2a', { method: 'OPTIONS' }), {});
    expect(options.status).toBe(204);
    expect(options.headers.get('access-control-allow-origin')).toBe('*');
    const bad = await worker.fetch(req('/a2a', { method: 'POST', body: '{' }), {});
    expect(bad.status).toBe(400);
    expect((await bad.json()).error.code).toBe(-32700);
  });

  it('answers an empty batch with one Invalid Request, on /a2a and /mcp alike', async () => {
    for (const path of ['/a2a', '/mcp']) {
      const res = await worker.fetch(req(path, { method: 'POST', body: '[]', headers: { 'content-type': 'application/json' } }), {});
      const body = await res.json();
      expect(Array.isArray(body), path).toBe(false);
      expect(body.error.code, path).toBe(-32600);
    }
  });
});
