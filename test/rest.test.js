// Unit tests for the /v1 REST surface, /ask, the MCP server card and the
// agent-friendly fallbacks: pagination, batch, idempotent replay, async
// jobs, problem+json errors, RateLimit headers, and the markdown 404. Same
// stubbing discipline as worker.test.js and mcp.test.js (fetch, caches, and
// an ASSETS stub whose fetch answers /api/search), with one addition: the
// rate limiter is module-global, so it resets per test.
//
// The rate limit is 600/min and the whole suite stays far under it; the one
// case that crosses the line does so deliberately with its own hammering.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import worker from '../worker.js';
import { resetRateLimits, RATE_LIMIT } from '../worker-api.js';
import { MCP_TOOLS } from '../worker-config.js';

const req = (path, init) => new Request(`https://hausfold.co${path}`, init);

const makeCaches = () => {
  const store = new Map();
  return {
    _store: store,
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

const DOCS_INDEX = {
  docs: {
    docs: {
      a: {
        id: 'a',
        content: 'The notifications room wires trill banners and rules.json is the dial.',
        breadcrumbs: ['Docs', 'trill', 'Rules'],
        url: '/docs/trill/rules',
      },
      b: {
        id: 'b',
        content: 'The bar draws pills and row kinds; popup_item opens a dropdown.',
        breadcrumbs: ['Docs', 'haus', 'Bar'],
        url: '/docs/haus/bar',
      },
      c: {
        id: 'c',
        content: 'Notifications can also be quiet banners composed by the daemon.',
        breadcrumbs: ['Docs', 'trill', 'Start'],
        url: '/docs/trill',
      },
    },
  },
};

// An ASSETS stub that answers the search index for /api/search and
// `status`/`body` for everything else (the 404 and 405 fallback cases).
const assetsWith = (status = 200, body = 'PAGE') => ({
  fetch: async (request) =>
    new URL(request.url).pathname === '/api/search'
      ? new Response(JSON.stringify(DOCS_INDEX))
      : new Response(body, { status }),
});

beforeEach(() => {
  globalThis.caches = makeCaches();
  globalThis.fetch = vi.fn(async (input) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url.includes('api.github.com')) {
      return new Response(
        JSON.stringify({
          tag_name: 'v2026.08.14',
          assets: [
            { name: 'pounce-2026.08.14-macos.dmg', size: 123, browser_download_url: 'https://github.com/hausfold/pounce/releases/download/v2026.08.14/pounce-2026.08.14-macos.dmg' },
          ],
          published_at: '2026-08-14T00:00:00Z',
        }),
        { status: 200 },
      );
    }
    throw new Error(`unexpected fetch: ${url}`);
  });
  resetRateLimits();
});

const getV1 = (path, env = {}) => worker.fetch(req(path), { ASSETS: assetsWith(), ...env }, {});

describe('/v1/search', () => {
  it('ranks the docs index and carries the RateLimit trio', async () => {
    const res = await getV1('/v1/search?q=notifications');
    expect(res.status).toBe(200);
    expect(res.headers.get('ratelimit-limit')).toBe(String(RATE_LIMIT.limit));
    expect(res.headers.get('ratelimit-remaining')).toBeTruthy();
    expect(res.headers.get('ratelimit-reset')).toBeTruthy();
    const body = await res.json();
    expect(body.query).toBe('notifications');
    expect(body.total).toBe(2);
    expect(body.results[0].url).toBe('/docs/trill/rules');
    expect(body.next_cursor).toBeNull();
  });

  it('400s with problem+json when q is missing', async () => {
    const res = await getV1('/v1/search');
    expect(res.status).toBe(400);
    expect(res.headers.get('content-type')).toBe('application/problem+json');
    const problem = await res.json();
    expect(problem.code).toBe('missing_query');
    expect(problem.status).toBe(400);
  });

  it('rejects a cursor it did not issue', async () => {
    const res = await getV1('/v1/search?q=x&cursor=!!!');
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe('invalid_cursor');
  });

  it('pages with the cursor it issued', async () => {
    const one = await (await getV1('/v1/search?q=notifications&limit=1')).json();
    expect(one.results).toHaveLength(1);
    expect(one.next_cursor).toBeTruthy();
    const two = await (await getV1(`/v1/search?q=notifications&limit=1&cursor=${one.next_cursor}`)).json();
    expect(two.results).toHaveLength(1);
    expect(two.results[0].url).not.toBe(one.results[0].url);
    expect(two.next_cursor).toBeNull();
  });
});

describe('/v1/desktops and /v1/apps', () => {
  it('lists every desktop with its install command', async () => {
    const { results, total } = await (await getV1('/v1/desktops')).json();
    expect(total).toBe(4);
    const hacker = results.find((r) => r.desktop === 'hacker');
    expect(hacker.command).toBe('curl -fsSL https://hausfold.co/hacker.sh | bash');
    expect(hacker.pins).toBe('hacker');
  });

  it('lists the downloadable apps with their URLs', async () => {
    const { results } = await (await getV1('/v1/apps')).json();
    expect(results.map((r) => r.app).sort()).toEqual(['perch', 'pounce']);
    expect(results[0].release_metadata).toContain('/api/release/');
  });
});

describe('/v1/releases/{app}', () => {
  it('serves typed release metadata', async () => {
    const res = await getV1('/v1/releases/pounce');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tag).toBe('v2026.08.14');
    expect(body.url).toContain('github.com');
  });

  it('404s with problem+json for an unknown app', async () => {
    const res = await getV1('/v1/releases/trll');
    expect(res.status).toBe(404);
    expect((await res.json()).code).toBe('unknown_app');
  });
});

describe('/v1/batch', () => {
  const postBatch = (body, headers = {}, env = {}) =>
    worker.fetch(
      req('/v1/batch', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'content-type': 'application/json', ...headers },
      }),
      { ASSETS: assetsWith(), ...env },
      {},
    );

  it('answers one result per operation, in order', async () => {
    const res = await postBatch({
      operations: [
        { op: 'search', query: 'notifications' },
        { op: 'install', desktop: 'minimal' },
        { op: 'install', desktop: 'nope' },
        { op: 'nonsense' },
      ],
    });
    expect(res.status).toBe(200);
    const { results } = await res.json();
    expect(results).toHaveLength(4);
    expect(results[0]).toMatchObject({ op: 'search', ok: true });
    expect(results[1]).toMatchObject({ op: 'install', ok: true });
    expect(results[2]).toMatchObject({ op: 'install', ok: false, error: { code: 'unknown_desktop' } });
    expect(results[3]).toMatchObject({ op: 'nonsense', ok: false, error: { code: 'unknown_op' } });
  });

  it('replays the first response for the same Idempotency-Key', async () => {
    const key = { 'idempotency-key': 'agent-retry-1' };
    const first = await postBatch({ operations: [{ op: 'install', desktop: 'hacker' }] }, key);
    expect(first.headers.get('idempotency-replayed')).toBeNull();
    const firstBody = await first.text();
    const replay = await postBatch({ operations: [{ op: 'install', desktop: 'hacker' }] }, key);
    expect(replay.headers.get('idempotency-replayed')).toBe('true');
    expect(await replay.text()).toBe(firstBody);
  });

  it('400s a body without operations and one over the size cap', async () => {
    const empty = await postBatch({ operations: [] });
    expect(empty.status).toBe(400);
    expect((await empty.json()).code).toBe('invalid_batch');
    const big = await postBatch({ operations: Array.from({ length: 21 }, () => ({ op: 'nonsense' })) });
    expect(big.status).toBe(400);
    const bigBody = await big.text();
    expect(bigBody).toContain('batch_too_large');
    expect(bigBody).toContain('/v1/jobs');
  });
});

describe('/v1/jobs', () => {
  const post = (body, env = {}) =>
    worker.fetch(
      req('/v1/jobs', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'content-type': 'application/json' },
      }),
      { ASSETS: assetsWith(), ...env },
      ctx,
    );

  let ctx;
  beforeEach(() => {
    ctx = { promises: [], waitUntil(p) { this.promises.push(p); } };
  });

  it('answers 202 with a Location, then the result is pollable once the job ran', async () => {
    const res = await post({ operations: [{ op: 'search', query: 'notifications' }] });
    expect(res.status).toBe(202);
    expect(res.headers.get('location')).toMatch(/^\/v1\/jobs\//);
    const queued = await res.json();
    expect(queued.status).toBe('queued');
    expect(queued.url).toContain(queued.id);
    await Promise.all(ctx.promises);
    const poll = await getV1(`/v1/jobs/${queued.id}`);
    expect(poll.status).toBe(200);
    const done = await poll.json();
    expect(done.status).toBe('done');
    expect(done.result.results[0].ok).toBe(true);
  });

  it('404s an unknown job id', async () => {
    const res = await getV1('/v1/jobs/no-such-job');
    expect(res.status).toBe(404);
    expect((await res.json()).code).toBe('unknown_job');
  });
});

describe('/v1 routing', () => {
  it('404s unknown /v1 paths with problem+json naming the spec', async () => {
    const res = await getV1('/v1/nope');
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toBe('application/problem+json');
    expect(await res.text()).toContain('openapi.json');
  });

  it('accepts a trailing slash like every other Worker route', async () => {
    const res = await getV1('/v1/desktops/');
    expect(res.status).toBe(200);
  });

  it('serves the server card derived from the MCP tool table', async () => {
    const res = await getV1('/.well-known/mcp/server-card.json');
    expect(res.status).toBe(200);
    const card = await res.json();
    expect(card.serverUrl).toBe('https://hausfold.co/mcp');
    expect(card.tools.map((t) => t.name)).toEqual(MCP_TOOLS.map((t) => t.name));
  });
});

describe('/ask (NLWeb)', () => {
  it('answers POST JSON with the _meta envelope and results', async () => {
    const res = await worker.fetch(
      req('/ask', {
        method: 'POST',
        body: JSON.stringify({ query: 'notifications' }),
        headers: { 'content-type': 'application/json' },
      }),
      { ASSETS: assetsWith() },
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/json');
    const body = await res.json();
    expect(body._meta.response_type).toBe('search_results');
    expect(body._meta.version).toBe('1.0');
    expect(body.results[0].url).toBe('/docs/trill/rules');
  });

  it('streams SSE with start, result and complete events', async () => {
    const res = await worker.fetch(
      req('/ask', {
        method: 'POST',
        body: JSON.stringify({ query: 'notifications', prefer: { streaming: true } }),
        headers: { 'content-type': 'application/json' },
      }),
      { ASSETS: assetsWith() },
    );
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    const text = await res.text();
    expect(text).toMatch(/event: start\ndata: /);
    expect(text).toMatch(/event: result\ndata: /);
    expect(text).toMatch(/event: complete\ndata: /);
    expect(text).toContain('"count":2');
  });

  it('takes GET with a q parameter too', async () => {
    const res = await getV1('/ask?q=notifications');
    expect(res.status).toBe(200);
    expect((await res.json())._meta.endpoint).toBe('/ask');
  });

  it('400s a missing query and 405s other methods', async () => {
    const missing = await getV1('/ask');
    expect(missing.status).toBe(400);
    expect((await missing.json()).code).toBe('missing_query');
    const wrong = await worker.fetch(req('/ask', { method: 'PUT' }), { ASSETS: assetsWith() });
    expect(wrong.status).toBe(405);
    expect(wrong.headers.get('allow')).toBe('GET, POST');
  });
});

describe('the machine-friendly fallbacks', () => {
  it('a non-HTML 404 is answered as markdown pointing at the index', async () => {
    const res = await worker.fetch(req('/definitely/not/a/page'), { ASSETS: assetsWith(404, '<html>404</html>') });
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
    const body = await res.text();
    expect(body).toContain('# 404');
    expect(body).toContain('llms.txt');
  });

  it('a browser-shaped request keeps the human 404 page', async () => {
    const res = await worker.fetch(
      req('/definitely/not/a/page', { headers: { accept: 'text/html' } }),
      { ASSETS: assetsWith(404, '<html>human 404</html>') },
    );
    expect(res.status).toBe(404);
    expect(await res.text()).toBe('<html>human 404</html>');
  });

  it('a POST to a non-API path gets problem+json, not the asset server 405', async () => {
    const res = await worker.fetch(req('/nope', { method: 'POST' }), { ASSETS: assetsWith(405) });
    expect(res.status).toBe(405);
    expect(res.headers.get('content-type')).toBe('application/problem+json');
    expect((await res.json()).code).toBe('method_not_allowed');
  });

  it('an unknown app on the legacy release endpoint 404s as JSON too', async () => {
    const res = await getV1('/api/release/trll');
    expect(res.status).toBe(404);
    expect((await res.json()).code).toBe('unknown_app');
  });

  it('the legacy release endpoint carries the RateLimit trio', async () => {
    const res = await getV1('/api/release/pounce');
    expect(res.status).toBe(200);
    expect(res.headers.get('ratelimit-limit')).toBe(String(RATE_LIMIT.limit));
  });
});

describe('rate limiting', () => {
  it('429s with Retry-After once the window is exhausted', async () => {
    resetRateLimits();
    let last;
    for (let i = 0; i < RATE_LIMIT.limit + 1; i++) {
      last = await worker.fetch(req('/v1/desktops'), { ASSETS: assetsWith() }, {});
    }
    expect(last.status).toBe(429);
    expect(last.headers.get('retry-after')).toBeTruthy();
    expect((await last.json()).code).toBe('rate_limited');
  });
});
