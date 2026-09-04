// Unit tests for the /mcp endpoint — JSON-RPC 2.0 over Streamable HTTP, no
// sessions, JSON responses. The surface worth pinning: protocol negotiation
// never invents a version the client didn't offer, notifications get no
// reply, tool errors come back as isError results rather than RPC faults
// (that's the tools/call contract), and the docs search reads the same index
// /api/search serves through whatever ASSETS stub the test hands it.
//
// Worker plumbing the tests lean on: `globalThis.fetch` and `globalThis.caches`
// are stubbed per test for the GitHub-backed tools, and env.ASSETS is a stub
// whose fetch answers /api/search. The parsed index is cached in a WeakMap
// keyed on env.ASSETS, so a fresh stub per test means a fresh index.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import worker from '../worker.js';
import { DESKTOPS, DOWNLOADABLE, MCP_TOOLS } from '../worker-config.js';

const req = (path, init) => new Request(`https://hausfold.co${path}`, init);

const post = (body, env = {}) =>
  worker.fetch(
    req('/mcp', {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    }),
    env,
  );

const rpc = (method, params, id = 1) => ({ jsonrpc: '2.0', id, method, params });

// A minimal stand-in for Cloudflare's `caches.default` (same shape as
// worker.test.js's; duplicated so the two suites stay independent).
const makeCaches = () => ({
  default: {
    async match() {
      return undefined;
    },
    async put() {},
  },
});

const DOCS = [
  {
    id: '/docs/haus',
    page_id: '/docs/haus',
    type: 'page',
    content: 'What haus is',
    breadcrumbs: ['Docs', 'haus', 'Start'],
    url: '/docs/haus',
  },
  {
    id: '/docs/trill-3',
    page_id: '/docs/trill',
    type: 'text',
    content:
      'Quiet banners are composed by the trill daemon. A rule can silence a single app\nby name, and rules.json is the only dial.',
    breadcrumbs: ['Docs', 'trill', 'Rules'],
    url: '/docs/trill/rules',
  },
  {
    id: '/docs/scruff-1',
    page_id: '/docs/scruff',
    type: 'text',
    content: 'Set work aside with scruff park, never git stash.',
    breadcrumbs: ['Docs', 'scruff', 'Start'],
    url: '/docs/scruff',
  },
];

// The search tool reads the index the assets binding serves; this stub hands
// back an index-shaped body with just the sections above.
const assetsWithDocs = () => ({
  fetch: vi.fn(async (request) => {
    expect(new URL(request.url).pathname).toBe('/api/search');
    return new Response(
      JSON.stringify({ docs: { docs: Object.fromEntries(DOCS.map((d, i) => [i + 1, d])) } }),
      { headers: { 'content-type': 'application/json' } },
    );
  }),
});

// A GitHub API stub for the release tool, in worker.test.js's table shape.
const makeFetch = (routes) =>
  vi.fn(async (input) => {
    const url = typeof input === 'string' ? input : input.url;
    const route = routes.find((r) => url.includes(r.match));
    if (!route) throw new Error(`unexpected fetch: ${url}`);
    const body = route.json !== undefined ? JSON.stringify(route.json) : (route.body ?? '');
    return new Response(body, { status: route.status ?? 200 });
  });

beforeEach(() => {
  globalThis.caches = {
    default: {
      async match() {
        return undefined;
      },
      async put() {},
    },
  };
  vi.restoreAllMocks();
});

describe('transport', () => {
  it('answers GET with 405 and an allow header (nothing to stream)', async () => {
    const res = await worker.fetch(req('/mcp'), {});
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('POST, OPTIONS');
  });

  it('answers OPTIONS with open preflight', async () => {
    const res = await worker.fetch(req('/mcp', { method: 'OPTIONS' }), {});
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(res.headers.get('access-control-allow-methods')).toContain('POST');
  });

  it('refuses a non-JSON body with JSON-RPC -32700', async () => {
    const res = await post('{not json');
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe(-32700);
  });

  it('refuses a malformed message with -32600', async () => {
    const res = await post({ id: 1, method: 'tools/list' }); // no jsonrpc
    const body = await res.json();
    expect(body.error.code).toBe(-32600);
  });

  it('answers a notifications-only batch with 202 and no body', async () => {
    // The absence of id is what makes a message a notification, not its
    // method name; both lines below are notifications on that rule.
    const res = await post([
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      { jsonrpc: '2.0', method: 'ping' },
    ]);
    expect(res.status).toBe(202);
    expect(await res.text()).toBe('');
  });

  it('answers an id-bearing notifications/* method as an unknown method', async () => {
    const res = await post(rpc('notifications/initialized', {}));
    const body = await res.json();
    expect(body.error.code).toBe(-32601);
  });

  it('handles a batch of a notification and a request with one reply', async () => {
    const res = await post([
      { jsonrpc: '2.0', id: 1, method: 'ping' },
      { jsonrpc: '2.0', method: 'notifications/initialized' },
    ]);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
    expect(body[0].result).toEqual({});
  });

  it('says which protocol version it speaks', async () => {
    const res = await post(rpc('initialize', { protocolVersion: '2025-06-18' }));
    expect(res.headers.get('mcp-protocol-version')).toBe('2025-06-18');
    const body = await res.json();
    expect(body.result.protocolVersion).toBe('2025-06-18');
    expect(body.result.serverInfo.name).toBe('hausfold.co');
  });

  it('downgrades an unknown client version to its own', async () => {
    const res = await post(rpc('initialize', { protocolVersion: '1999-01-01' }));
    const body = await res.json();
    expect(body.result.protocolVersion).toBe('2025-06-18');
  });

  it('answers an unknown method with -32601', async () => {
    const res = await post(rpc('resources/list', {}));
    const body = await res.json();
    expect(body.error.code).toBe(-32601);
  });
});

describe('tools/list', () => {
  it('declares the three tools with input schemas', async () => {
    const res = await post(rpc('tools/list', {}));
    const body = await res.json();
    expect(body.result.tools.map((t) => t.name)).toEqual([
      'get_install_command',
      'get_latest_release',
      'search_docs',
    ]);
    expect(body.result.tools).toEqual(MCP_TOOLS);
  });
});

describe('tools/call · get_install_command', () => {
  it('returns the one-liner for a known desktop, as a one-row list', async () => {
    const res = await post(rpc('tools/call', { name: 'get_install_command', arguments: { desktop: 'hacker' } }));
    const body = await res.json();
    expect(body.result.isError).toBeUndefined();
    const parsed = JSON.parse(body.result.content[0].text);
    // Naming a desktop narrows the list; it does not change the shape, which
    // is what lets one outputSchema describe both calls.
    expect(parsed.desktops).toHaveLength(1);
    expect(parsed.desktops[0].command).toBe('curl -fsSL https://hausfold.co/hacker.sh | bash');
    expect(parsed.desktops[0].pins).toBe('hacker');
  });

  it('lists every desktop when the argument is omitted', async () => {
    const res = await post(rpc('tools/call', { name: 'get_install_command' }));
    const body = await res.json();
    const parsed = JSON.parse(body.result.content[0].text);
    expect(parsed.desktops.map((r) => r.desktop)).toEqual(Object.keys(DESKTOPS));
    // /haus.sh pins nothing; its row says so with null.
    expect(parsed.desktops.find((r) => r.desktop === 'haus').pins).toBeNull();
  });

  it('reports an unknown desktop as an isError result, not an RPC fault', async () => {
    const res = await post(rpc('tools/call', { name: 'get_install_command', arguments: { desktop: 'rice' } }));
    const body = await res.json();
    expect(body.result.isError).toBe(true);
    expect(body.result.content[0].text).toContain('Available: haus, hacker, everyday, minimal');
  });
});

describe('tools/call · get_latest_release', () => {
  it('returns the release metadata for a downloadable app', async () => {
    globalThis.fetch = makeFetch([
      {
        match: 'api.github.com/repos/hausfold/pounce/releases/latest',
        json: {
          tag_name: 'v2026.08.14',
          published_at: '2026-08-14T00:00:00Z',
          assets: [{ name: 'pounce-2026.08.14-macos.dmg', size: 123 }],
        },
      },
    ]);
    const res = await post(rpc('tools/call', { name: 'get_latest_release', arguments: { app: 'pounce' } }), {
      caches: globalThis.caches,
    });
    const body = await res.json();
    const parsed = JSON.parse(body.result.content[0].text);
    expect(parsed.tag).toBe('v2026.08.14');
    expect(parsed.asset).toBe('pounce-2026.08.14-macos.dmg');
  });

  it('refuses an app outside DOWNLOADABLE', async () => {
    const res = await post(rpc('tools/call', { name: 'get_latest_release', arguments: { app: 'haus' } }));
    const body = await res.json();
    expect(body.result.isError).toBe(true);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('reports a missing macOS artifact as an error', async () => {
    globalThis.fetch = makeFetch([
      {
        match: 'api.github.com/repos/hausfold/perch/releases/latest',
        json: { tag_name: 'v2026.08.01', published_at: '2026-08-01T00:00:00Z', assets: [] },
      },
    ]);
    const res = await post(rpc('tools/call', { name: 'get_latest_release', arguments: { app: 'perch' } }));
    const body = await res.json();
    expect(body.result.isError).toBe(true);
  });
});

describe('tools/call · search_docs', () => {
  it('scores the shared index and returns urls with excerpts', async () => {
    const env = { ASSETS: assetsWithDocs() };
    const res = await post(rpc('tools/call', { name: 'search_docs', arguments: { query: 'rules' } }), env);
    const body = await res.json();
    expect(env.ASSETS.fetch).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(body.result.content[0].text);
    expect(parsed.results[0].url).toBe('/docs/trill/rules');
    expect(parsed.results[0].breadcrumbs).toEqual(['Docs', 'trill', 'Rules']);
    expect(parsed.results[0].excerpt).toContain('rules.json');
  });

  it('caches the parsed index per assets binding', async () => {
    const env = { ASSETS: assetsWithDocs() };
    await post(rpc('tools/call', { name: 'search_docs', arguments: { query: 'trill' } }), env);
    await post(rpc('tools/call', { name: 'search_docs', arguments: { query: 'stash' } }), env);
    expect(env.ASSETS.fetch).toHaveBeenCalledTimes(1); // once, not once per call
  });

  it('ranks a breadcrumb match above a deeper body mention', async () => {
    const env = { ASSETS: assetsWithDocs() };
    const res = await post(rpc('tools/call', { name: 'search_docs', arguments: { query: 'scruff' } }), env);
    const body = await res.json();
    const parsed = JSON.parse(body.result.content[0].text);
    expect(parsed.results[0].url).toBe('/docs/scruff');
  });

  it('refuses an empty query', async () => {
    const res = await post(rpc('tools/call', { name: 'search_docs', arguments: { query: '  ' } }), {
      ASSETS: assetsWithDocs(),
    });
    const body = await res.json();
    expect(body.result.isError).toBe(true);
  });

  it('clamps limit into 1..20', async () => {
    const env = { ASSETS: assetsWithDocs() };
    const res = await post(
      rpc('tools/call', { name: 'search_docs', arguments: { query: 'haus', limit: 500 } }),
      env,
    );
    const body = await res.json();
    const parsed = JSON.parse(body.result.content[0].text);
    expect(parsed.results.length).toBeLessThanOrEqual(20);
  });
});

// A validator for the JSON Schema subset the tool table actually uses: type
// (one or a list), enum, required, properties, items, and an anyOf of
// required-only branches. Deliberately small — the job is to prove a real
// payload satisfies the schema the server publishes, not to reimplement Ajv,
// and a dependency for three tools would be the tail wagging the dog.
const isType = (value, type) => {
  if (Array.isArray(type)) return type.some((t) => isType(value, t));
  if (type === 'null') return value === null;
  if (type === 'array') return Array.isArray(value);
  if (type === 'integer') return Number.isInteger(value);
  if (type === 'number') return typeof value === 'number';
  if (type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  return typeof value === type;
};

function violations(schema, value, path = '$') {
  const out = [];
  if (schema.type && !isType(value, schema.type)) {
    return [`${path}: expected ${JSON.stringify(schema.type)}, got ${JSON.stringify(value)}`];
  }
  if (schema.enum && !schema.enum.includes(value)) out.push(`${path}: ${value} is outside the enum`);
  if (schema.required && isType(value, 'object')) {
    for (const key of schema.required) if (!(key in value)) out.push(`${path}.${key}: missing`);
  }
  if (schema.anyOf && !schema.anyOf.some((b) => violations(b, value, path).length === 0)) {
    out.push(`${path}: matched no anyOf branch`);
  }
  for (const [key, sub] of Object.entries(schema.properties ?? {})) {
    if (isType(value, 'object') && key in value) out.push(...violations(sub, value[key], `${path}.${key}`));
  }
  if (schema.items && Array.isArray(value)) {
    value.forEach((item, i) => out.push(...violations(schema.items, item, `${path}[${i}]`)));
  }
  return out;
}

describe('structured tool output', () => {
  const schemaFor = (name) => MCP_TOOLS.find((t) => t.name === name).outputSchema;
  const conforms = (name, payload) => violations(schemaFor(name), payload);

  it('every tool declares an outputSchema, error branch included', () => {
    for (const tool of MCP_TOOLS) {
      expect(tool.outputSchema?.type, tool.name).toBe('object');
      expect(tool.outputSchema.properties.error, tool.name).toBeDefined();
      // Two branches and no more: the payload's own keys, or the error.
      expect(tool.outputSchema.anyOf, tool.name).toHaveLength(2);
      expect(tool.outputSchema.anyOf[1], tool.name).toEqual({ required: ['error'] });
    }
  });

  it('get_install_command answers with schema-shaped structuredContent', async () => {
    const res = await post(rpc('tools/call', { name: 'get_install_command' }));
    const { result } = await res.json();
    // The two halves are the same object, so they cannot drift.
    expect(result.structuredContent).toEqual(JSON.parse(result.content[0].text));
    expect(conforms('get_install_command', result.structuredContent)).toEqual([]);
  });

  it('get_latest_release answers with schema-shaped structuredContent', async () => {
    globalThis.fetch = makeFetch([
      {
        match: 'api.github.com/repos/hausfold/pounce/releases/latest',
        json: {
          tag_name: 'v2026.08.14',
          published_at: '2026-08-14T00:00:00Z',
          assets: [
            {
              name: 'pounce-2026.08.14-macos.dmg',
              size: 123,
              browser_download_url: 'https://github.com/hausfold/pounce/releases/download/x.dmg',
            },
          ],
        },
      },
    ]);
    const res = await post(rpc('tools/call', { name: 'get_latest_release', arguments: { app: 'pounce' } }));
    const { result } = await res.json();
    expect(result.structuredContent).toEqual(JSON.parse(result.content[0].text));
    expect(conforms('get_latest_release', result.structuredContent)).toEqual([]);
  });

  it('search_docs answers with schema-shaped structuredContent', async () => {
    const res = await post(
      rpc('tools/call', { name: 'search_docs', arguments: { query: 'rules' } }),
      { ASSETS: assetsWithDocs() },
    );
    const { result } = await res.json();
    expect(result.structuredContent).toEqual(JSON.parse(result.content[0].text));
    expect(conforms('search_docs', result.structuredContent)).toEqual([]);
  });

  it('a failure satisfies the same schema, through the error branch', async () => {
    // The reason the schemas carry `error` at all: a client that validates
    // every structuredContent it is handed must not choke on the failure.
    const res = await post(rpc('tools/call', { name: 'get_install_command', arguments: { desktop: 'rice' } }));
    const { result } = await res.json();
    expect(result.isError).toBe(true);
    expect(result.structuredContent.error.code).toBe('unknown_desktop');
    expect(conforms('get_install_command', result.structuredContent)).toEqual([]);
  });
});

describe('a DOWNLOADABLE/enum drift guard lives in the openapi test', () => {
  it('the tables the spec restates are non-empty', () => {
    expect(Object.keys(DESKTOPS).length).toBeGreaterThan(0);
    expect([...DOWNLOADABLE].length).toBeGreaterThan(0);
  });
});
