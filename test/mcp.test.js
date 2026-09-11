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
  // Shaped the way a built index actually is, which is what this fixture got
  // wrong for as long as it existed: ONLY a `type: 'page'` row carries
  // `breadcrumbs`. Every row carries a `page_id`; a section row's own `url` is
  // its page's url plus the `#fragment` of the heading it sits under, and a
  // page row's `id` is its url. worker.js's withBreadcrumbs() is the join.
  // Inventing breadcrumbs on the section rows here is what let every assertion
  // below pass while production answered `breadcrumbs: []`.
  //
  // A page row's `content` is the page TITLE, and these titles deliberately
  // avoid the words the queries below search for, so a page never competes
  // with its own sections for the top result.
  {
    id: '/docs/haus',
    page_id: '/docs/haus',
    type: 'page',
    content: 'What haus is',
    breadcrumbs: ['Docs', 'haus', 'Start'],
    tags: [],
    url: '/docs/haus',
  },
  {
    // The competitor in the ranking test below: it says `scruff` twice where
    // the scruff-tree row says it once, so without the breadcrumb boost this
    // row wins. It is in the haus tree, so the boost cannot reach it.
    id: '/docs/haus-7',
    page_id: '/docs/haus',
    type: 'text',
    content: 'A lane made by scruff is a worktree, and scruff reaps it once the branch lands.',
    tags: [],
    url: '/docs/haus#agents',
  },
  {
    id: '/docs/trill/rules',
    page_id: '/docs/trill/rules',
    type: 'page',
    content: 'Composing',
    breadcrumbs: ['Docs', 'trill', 'Rules'],
    tags: [],
    url: '/docs/trill/rules',
  },
  {
    id: '/docs/trill/rules-3',
    page_id: '/docs/trill/rules',
    type: 'text',
    content:
      'Quiet banners are composed by the trill daemon. A rule can silence a single app\nby name, and rules.json is the only dial.',
    tags: [],
    url: '/docs/trill/rules#the-dial',
  },
  {
    id: '/docs/scruff',
    page_id: '/docs/scruff',
    type: 'page',
    content: 'Parking work',
    breadcrumbs: ['Docs', 'scruff', 'Start'],
    tags: [],
    url: '/docs/scruff',
  },
  {
    id: '/docs/scruff-1',
    page_id: '/docs/scruff',
    type: 'text',
    content: 'Set work aside with scruff park, never git stash.',
    tags: [],
    url: '/docs/scruff#park',
  },
  {
    id: '/docs/perch/shelf',
    page_id: '/docs/perch/shelf',
    type: 'page',
    content: 'Holding things',
    breadcrumbs: ['Docs', 'perch', 'Start'],
    tags: [],
    url: '/docs/perch/shelf',
  },
  // The three rows below share one `url`, which is what a built index is
  // really like: fumadocs gives every text row under a heading that heading's
  // url, so one anchor is as many rows as it has paragraphs. Every fixture
  // here gave each row a url of its own, so nothing could see the collapse.
  {
    id: '/docs/perch/shelf-1',
    page_id: '/docs/perch/shelf',
    type: 'heading',
    content: 'Keybinding',
    tags: [],
    url: '/docs/perch/shelf#keybinding',
  },
  {
    id: '/docs/perch/shelf-2',
    page_id: '/docs/perch/shelf',
    type: 'text',
    content: 'The keybinding that opens the notch is the one you already press.',
    tags: [],
    url: '/docs/perch/shelf#keybinding',
  },
  {
    id: '/docs/perch/shelf-3',
    page_id: '/docs/perch/shelf',
    type: 'text',
    content: 'A drag onto the notch is the other way in, and the notch is where it waits.',
    tags: [],
    url: '/docs/perch/shelf#keybinding',
  },
  // A long section whose only query word is past the 200th character, which is
  // as far as excerpt() reads when it has no anchor.
  {
    id: '/docs/perch/shelf-4',
    page_id: '/docs/perch/shelf',
    type: 'text',
    content:
      'Padding, and only padding, standing between the head of this section and ' +
      'the one word below that a query could be looking for. It is here because ' +
      'a short section cannot tell a good anchor from no anchor at all: both ' +
      'answer with the whole of it. The lanyard is at the end.',
    tags: [],
    url: '/docs/perch/shelf#lanyard',
  },
  // Three rows on two anchors, all scoring on 'tray': the first and third
  // share one, the second holds the other and outscores both. Sorted, the
  // pair collapses behind the single. Unsorted, the Map would keep the
  // displaced row's position and put the pair first.
  {
    id: '/docs/perch/shelf-5',
    page_id: '/docs/perch/shelf',
    type: 'text',
    content: 'A tray holds it.',
    tags: [],
    url: '/docs/perch/shelf#tray-a',
  },
  {
    id: '/docs/perch/shelf-6',
    page_id: '/docs/perch/shelf',
    type: 'text',
    content: 'The tray, and the tray beside it.',
    tags: [],
    url: '/docs/perch/shelf#tray-b',
  },
  {
    id: '/docs/perch/shelf-7',
    page_id: '/docs/perch/shelf',
    type: 'text',
    content: 'The first tray again, at much greater length than the row already held for it.',
    tags: [],
    url: '/docs/perch/shelf#tray-a',
  },
  // `pkgs` and `pkg` sit on separate anchors so a query for the longer one
  // can prove it never widened to the shorter.
  {
    id: '/docs/haus-8',
    page_id: '/docs/haus',
    type: 'text',
    content: 'An option taking a package has a pkgs sibling beside it.',
    tags: [],
    url: '/docs/haus#packages',
  },
  {
    id: '/docs/haus-9',
    page_id: '/docs/haus',
    type: 'text',
    content: 'The pkg name is read off the formula, never typed twice.',
    tags: [],
    url: '/docs/haus#naming',
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
    expect(parsed.results[0].url).toBe('/docs/trill/rules#the-dial');
    expect(parsed.results[0].breadcrumbs).toEqual(['Docs', 'trill', 'Rules']);
    expect(parsed.results[0].excerpt).toContain('rules.json');
  });

  it('gives a section the breadcrumbs of the page it sits on', async () => {
    // The section rows in the index carry none of their own. Before the join
    // this came back [], while the tool's description and outputSchema both
    // said a result carries a trail.
    const env = { ASSETS: assetsWithDocs() };
    const res = await post(rpc('tools/call', { name: 'search_docs', arguments: { query: 'stash' } }), env);
    const parsed = JSON.parse((await res.json()).result.content[0].text);
    expect(parsed.results[0].url).toBe('/docs/scruff#park');
    expect(parsed.results[0].breadcrumbs).toEqual(['Docs', 'scruff', 'Start']);
  });

  it('caches the parsed index per assets binding', async () => {
    const env = { ASSETS: assetsWithDocs() };
    await post(rpc('tools/call', { name: 'search_docs', arguments: { query: 'trill' } }), env);
    await post(rpc('tools/call', { name: 'search_docs', arguments: { query: 'stash' } }), env);
    expect(env.ASSETS.fetch).toHaveBeenCalledTimes(1); // once, not once per call
  });

  it('ranks a breadcrumb match above a deeper body mention', async () => {
    // /docs/haus#agents says `scruff` twice, /docs/scruff#park says it once —
    // so on term count alone the haus row wins, and only the +3 for the term
    // appearing in the scruff row's inherited trail puts it on top. The scores
    // are pinned because the assertion above them passed for years with one
    // candidate in the set and would have passed with the boost deleted.
    const env = { ASSETS: assetsWithDocs() };
    const res = await post(rpc('tools/call', { name: 'search_docs', arguments: { query: 'scruff' } }), env);
    const body = await res.json();
    const parsed = JSON.parse(body.result.content[0].text);
    expect(parsed.results.map((hit) => [hit.url, hit.score])).toEqual([
      ['/docs/scruff#park', 4],
      ['/docs/haus#agents', 2],
    ]);
  });

  it('collapses the rows of one anchor into a single hit', async () => {
    // Three rows in the fixture carry '/docs/perch/shelf#keybinding'. Two of
    // them say 'notch', so before the collapse a search returned that one
    // place twice, differing only in excerpt.
    const env = { ASSETS: assetsWithDocs() };
    const res = await post(rpc('tools/call', { name: 'search_docs', arguments: { query: 'notch' } }), env);
    const parsed = JSON.parse((await res.json()).result.content[0].text);
    expect(parsed.results.map((hit) => hit.url)).toEqual(['/docs/perch/shelf#keybinding']);
    expect(parsed.results[0].score).toBe(2); // the higher-scoring of the two rows
    expect(parsed.results[0].excerpt).toContain('A drag onto the notch');
  });

  it('keeps the paragraph over the heading when the two tie', async () => {
    // The heading row's content is the heading, which the url's fragment
    // already says. Both rows score 1 for 'keybinding'; the longer one is the
    // more useful excerpt.
    const env = { ASSETS: assetsWithDocs() };
    const res = await post(rpc('tools/call', { name: 'search_docs', arguments: { query: 'keybinding' } }), env);
    const parsed = JSON.parse((await res.json()).result.content[0].text);
    expect(parsed.results).toHaveLength(1);
    expect(parsed.results[0].excerpt).toBe('The keybinding that opens the notch is the one you already press.');
  });

  it('retries a term no section says in the singular', async () => {
    // Matching is substring, so 'keybinding' already found 'keybindings'. The
    // gap was one-way: the plural matched nothing at all, and it is the
    // example query the tool's own inputSchema offers.
    const env = { ASSETS: assetsWithDocs() };
    const res = await post(rpc('tools/call', { name: 'search_docs', arguments: { query: 'keybindings' } }), env);
    const parsed = JSON.parse((await res.json()).result.content[0].text);
    expect(parsed.results.map((hit) => hit.url)).toEqual(['/docs/perch/shelf#keybinding']);
  });

  it('leaves a term the docs do say alone', async () => {
    // The fallback fires only for a term the whole corpus is silent on. Were
    // it a blanket stem instead, 'pkgs' would widen to 'pkg' and drag in the
    // other anchor — and so would 'macos', 'nixpkgs' and 'does'.
    const env = { ASSETS: assetsWithDocs() };
    const res = await post(rpc('tools/call', { name: 'search_docs', arguments: { query: 'pkgs' } }), env);
    const parsed = JSON.parse((await res.json()).result.content[0].text);
    expect(parsed.results.map((hit) => hit.url)).toEqual(['/docs/haus#packages']);
  });

  it('anchors the excerpt on the first term that matched, not the first typed', async () => {
    // 'hopscotch' is in no section, so anchoring on it left the excerpt at the
    // head of a section that does answer the query. A question is the common
    // shape of this: it opens on a word the docs never use.
    const env = { ASSETS: assetsWithDocs() };
    const res = await post(
      rpc('tools/call', { name: 'search_docs', arguments: { query: 'hopscotch lanyard' } }),
      env,
    );
    const parsed = JSON.parse((await res.json()).result.content[0].text);
    expect(parsed.results.map((hit) => hit.url)).toEqual(['/docs/perch/shelf#lanyard']);
    expect(parsed.results[0].excerpt).toContain('lanyard');
  });

  it('collapses without reordering what it collapsed', async () => {
    // The third row displaces the first on its anchor. The anchor has to keep
    // the place its best row won, behind the single row that outscores it.
    const env = { ASSETS: assetsWithDocs() };
    const res = await post(rpc('tools/call', { name: 'search_docs', arguments: { query: 'tray' } }), env);
    const parsed = JSON.parse((await res.json()).result.content[0].text);
    expect(parsed.results.map((hit) => [hit.url, hit.score])).toEqual([
      ['/docs/perch/shelf#tray-b', 2],
      ['/docs/perch/shelf#tray-a', 1],
    ]);
    expect(parsed.results[1].excerpt).toContain('at much greater length');
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
