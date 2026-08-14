// Unit tests for worker.js — the hausfold.co Worker, which carries the
// `curl | bash` install front door. The security-critical surface is ref
// validation (no path traversal into raw.githubusercontent.com) and the
// latestRef() fallback chain, so those get the most attention here.
//
// The worker only touches two globals we don't get for free in Node: `fetch`
// (GitHub API + raw content) and `caches` (the ~1h latest-release cache). We
// stub both per-test so the suite is fast and offline.
//
// Ported from the workshop's web/test/worker.test.js with the route rename —
// `/init.sh` is `/nebelhaus.sh` here, resolved through a table rather than
// hardcoded, so the table itself is now part of what these tests protect.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import worker from '../worker.js';

const RELEASE_KEY = 'https://hausfold.co/__latest_release/hausfold/haus';

// A minimal stand-in for Cloudflare's `caches.default`. Stores the cached ref
// as a string and hands back a fresh Response each match (Response bodies are
// single-use, so we can't stash the Response object itself).
function makeCaches() {
  const store = new Map();
  return {
    _store: store,
    default: {
      async match(req) {
        const url = typeof req === 'string' ? req : req.url;
        return store.has(url) ? new Response(store.get(url)) : undefined;
      },
      async put(req, res) {
        const url = typeof req === 'string' ? req : req.url;
        store.set(url, await res.text());
      },
    },
  };
}

// Build a fetch stub from a list of { match, ... } routes. First substring hit
// wins; an unmatched URL throws so tests can't silently pass on a stray fetch.
function makeFetch(routes) {
  return vi.fn(async (input) => {
    const url = typeof input === 'string' ? input : input.url;
    const route = routes.find((r) => url.includes(r.match));
    if (!route) throw new Error(`unexpected fetch: ${url}`);
    if (route.throws) throw new Error('network down');
    const body = route.json !== undefined ? JSON.stringify(route.json) : route.body ?? '';
    return new Response(body, { status: route.status ?? 200 });
  });
}

const req = (path) => new Request(`https://hausfold.co${path}`);

beforeEach(() => {
  globalThis.caches = makeCaches();
  vi.restoreAllMocks();
});

describe('/<desktop>.sh ref validation (path-traversal guard)', () => {
  // These are the guards that keep a curl|bash endpoint from being pointed at
  // an arbitrary path. Each must yield a 400 and must NOT fetch bootstrap.sh.
  const BAD_REFS = [
    ['dot-dot traversal', '..'],
    ['embedded traversal', 'v1..2'],
    ['slash / nested path', 'a/b'],
    ['leading slash', '/etc/passwd'],
    ['space', 'v1 0'],
    ['shell metachars', 'v1;rm'],
  ];

  for (const [label, ref] of BAD_REFS) {
    it(`rejects ${label} with 400`, async () => {
      globalThis.fetch = makeFetch([{ match: 'raw.githubusercontent.com', body: 'BOOT' }]);
      const res = await worker.fetch(req(`/nebelhaus.sh?ref=${encodeURIComponent(ref)}`), {});
      expect(res.status).toBe(400);
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  }

  it('accepts a well-formed tag and proxies bootstrap.sh', async () => {
    globalThis.fetch = makeFetch([
      { match: 'raw.githubusercontent.com/hausfold/haus/v1.2.3/bootstrap.sh', body: '#!/bin/bash\n' },
    ]);
    const res = await worker.fetch(req('/nebelhaus.sh?ref=v1.2.3'), {});
    expect(res.status).toBe(200);
    expect(res.headers.get('x-hausfold-ref')).toBe('v1.2.3');
    expect(await res.text()).toBe('#!/bin/bash\n');
  });
});

describe('the desktop table', () => {
  // The table is the whole routing decision: a name in it is a promise that
  // hausfold.co/<name>.sh keeps resolving, and a name outside it must never
  // become a fetch.
  it('does not serve an unknown desktop', async () => {
    globalThis.fetch = makeFetch([]);
    const res = await worker.fetch(req('/haus.sh'), {});
    expect(res.status).toBe(404); // falls through to the assets/404 path
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('does not serve nebelung.sh — nebelung is the palette, not the desktop', async () => {
    globalThis.fetch = makeFetch([]);
    const res = await worker.fetch(req('/nebelung.sh'), {});
    expect(res.status).toBe(404);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('has no /init.sh — that URL lives on nebelhaus.com and redirects here', async () => {
    globalThis.fetch = makeFetch([]);
    const res = await worker.fetch(req('/init.sh'), {});
    expect(res.status).toBe(404);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

describe('latestRef() fallback chain', () => {
  it('env.REF hard-pin wins without any fetch or cache read', async () => {
    globalThis.fetch = makeFetch([
      { match: 'raw.githubusercontent.com/hausfold/haus/v9.9.9/bootstrap.sh', body: 'PINNED' },
    ]);
    const res = await worker.fetch(req('/nebelhaus.sh'), { REF: 'v9.9.9' });
    expect(res.headers.get('x-hausfold-ref')).toBe('v9.9.9');
    // API was never consulted.
    expect(globalThis.fetch.mock.calls.every(([u]) => !String(u).includes('api.github.com'))).toBe(true);
  });

  it('resolves and caches the latest release tag from the GitHub API', async () => {
    globalThis.fetch = makeFetch([
      { match: 'api.github.com', json: { tag_name: 'v2.0.0' } },
      { match: 'raw.githubusercontent.com/hausfold/haus/v2.0.0/bootstrap.sh', body: 'LATEST' },
    ]);
    const res = await worker.fetch(req('/nebelhaus.sh'), {});
    expect(res.headers.get('x-hausfold-ref')).toBe('v2.0.0');
    expect(globalThis.caches._store.get(RELEASE_KEY)).toBe('v2.0.0');
  });

  it('serves a cached ref without hitting the API', async () => {
    globalThis.caches._store.set(RELEASE_KEY, 'v1.5.0');
    globalThis.fetch = makeFetch([
      { match: 'raw.githubusercontent.com/hausfold/haus/v1.5.0/bootstrap.sh', body: 'CACHED' },
    ]);
    const res = await worker.fetch(req('/nebelhaus.sh'), {});
    expect(res.headers.get('x-hausfold-ref')).toBe('v1.5.0');
    expect(globalThis.fetch.mock.calls.some(([u]) => String(u).includes('api.github.com'))).toBe(false);
  });

  it('falls back to main when the API returns a non-2xx', async () => {
    globalThis.fetch = makeFetch([
      { match: 'api.github.com', status: 403, body: 'rate limited' },
      { match: 'raw.githubusercontent.com/hausfold/haus/main/bootstrap.sh', body: 'MAIN' },
    ]);
    const res = await worker.fetch(req('/nebelhaus.sh'), {});
    expect(res.headers.get('x-hausfold-ref')).toBe('main');
  });

  it('falls back to main when the API throws (network hiccup)', async () => {
    globalThis.fetch = makeFetch([
      { match: 'api.github.com', throws: true },
      { match: 'raw.githubusercontent.com/hausfold/haus/main/bootstrap.sh', body: 'MAIN' },
    ]);
    const res = await worker.fetch(req('/nebelhaus.sh'), {});
    expect(res.headers.get('x-hausfold-ref')).toBe('main');
  });

  it('falls back to main when the API returns an unsafe tag_name', async () => {
    // A compromised/garbage release tag must not become a fetch path.
    globalThis.fetch = makeFetch([
      { match: 'api.github.com', json: { tag_name: '../../evil' } },
      { match: 'raw.githubusercontent.com/hausfold/haus/main/bootstrap.sh', body: 'MAIN' },
    ]);
    const res = await worker.fetch(req('/nebelhaus.sh'), {});
    expect(res.headers.get('x-hausfold-ref')).toBe('main');
    expect(globalThis.caches._store.has(RELEASE_KEY)).toBe(false);
  });
});

describe('serveInstaller upstream handling', () => {
  it('returns 502 when bootstrap.sh cannot be fetched', async () => {
    globalThis.fetch = makeFetch([
      { match: 'raw.githubusercontent.com', status: 404, body: 'not found' },
    ]);
    const res = await worker.fetch(req('/nebelhaus.sh?ref=v1.0.0'), {});
    expect(res.status).toBe(502);
    expect(await res.text()).toContain('v1.0.0');
  });

  it('sets caching headers on a successful proxy', async () => {
    globalThis.fetch = makeFetch([{ match: 'raw.githubusercontent.com', body: 'OK' }]);
    const res = await worker.fetch(req('/nebelhaus.sh?ref=v1.0.0'), {});
    expect(res.headers.get('cache-control')).toBe('public, max-age=300');
    expect(res.headers.get('content-type')).toContain('text/plain');
  });
});

describe('/download and /api/release', () => {
  const PONCE_RELEASE = {
    tag_name: 'v2026.07.29',
    published_at: '2026-07-29T00:00:00Z',
    assets: [
      { name: 'pounce-v2026.07.29-macos.tar.gz', size: 701478, browser_download_url: 'https://github.com/hausfold/pounce/releases/download/v2026.07.29/pounce-v2026.07.29-macos.tar.gz' },
    ],
  };

  it('302s /download/<app> to the latest macOS asset', async () => {
    globalThis.fetch = makeFetch([
      { match: 'api.github.com/repos/hausfold/pounce/releases/latest', json: PONCE_RELEASE },
    ]);
    const res = await worker.fetch(req('/download/pounce'), {});
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe(PONCE_RELEASE.assets[0].browser_download_url);
  });

  it('picks the -macos asset over other assets', async () => {
    globalThis.fetch = makeFetch([
      {
        match: 'api.github.com/repos/hausfold/perch/releases/latest',
        json: {
          tag_name: 'v1',
          assets: [
            { name: 'checksums.txt', size: 10, browser_download_url: 'https://example.com/checksums.txt' },
            { name: 'perch-v1-macos.zip', size: 99, browser_download_url: 'https://example.com/perch-v1-macos.zip' },
          ],
        },
      },
    ]);
    const res = await worker.fetch(req('/download/perch'), {});
    expect(res.headers.get('location')).toBe('https://example.com/perch-v1-macos.zip');
  });

  it('prefers the DMG over the tarball when a release ships both', async () => {
    // Pounce releases ship both: the tarball is the Homebrew formula's artifact
    // (app + CLI scripts, brew wires the daemon), the DMG is the human's
    // drag-to-Applications one. A human clicking Download must get the DMG —
    // handing them the tarball strands them with a half-installed palette.
    globalThis.fetch = makeFetch([
      {
        match: 'api.github.com/repos/hausfold/pounce/releases/latest',
        json: {
          tag_name: 'v2026.07.31',
          assets: [
            { name: 'pounce-v2026.07.31-macos.tar.gz', size: 701478, browser_download_url: 'https://example.com/pounce.tar.gz' },
            { name: 'pounce-v2026.07.31-macos.dmg', size: 812345, browser_download_url: 'https://example.com/pounce.dmg' },
          ],
        },
      },
    ]);
    const res = await worker.fetch(req('/download/pounce'), {});
    expect(res.headers.get('location')).toBe('https://example.com/pounce.dmg');
  });

  it('falls back to the releases page when the API is down', async () => {
    globalThis.fetch = makeFetch([{ match: 'api.github.com', throws: true }]);
    const res = await worker.fetch(req('/download/perch'), {});
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://github.com/hausfold/perch/releases/latest');
  });

  it('serves release metadata as JSON and caches it', async () => {
    globalThis.fetch = makeFetch([
      { match: 'api.github.com/repos/hausfold/pounce/releases/latest', json: PONCE_RELEASE },
    ]);
    const res = await worker.fetch(req('/api/release/pounce'), {});
    expect(res.status).toBe(200);
    const meta = await res.json();
    expect(meta.tag).toBe('v2026.07.29');
    expect(meta.size).toBe(701478);
    expect(globalThis.caches._store.has('https://hausfold.co/__release/pounce')).toBe(true);

    // Second hit is served from cache — no API call.
    globalThis.fetch = makeFetch([]);
    const cached = await worker.fetch(req('/api/release/pounce'), {});
    expect((await cached.json()).tag).toBe('v2026.07.29');
  });

  it('returns 502 JSON when metadata is unavailable', async () => {
    globalThis.fetch = makeFetch([{ match: 'api.github.com', status: 403, body: 'rate limited' }]);
    const res = await worker.fetch(req('/api/release/pounce'), {});
    expect(res.status).toBe(502);
  });

  it('does not treat unknown apps as downloadable', async () => {
    globalThis.fetch = makeFetch([]);
    const res = await worker.fetch(req('/download/nebelhaus'), {});
    expect(res.status).toBe(404); // falls through to the assets/404 path
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

describe('router', () => {
  it('delegates everything else to the ASSETS binding', async () => {
    const assets = { fetch: vi.fn(async () => new Response('site', { status: 200 })) };
    const res = await worker.fetch(req('/docs/haus/rooms/bar/'), { ASSETS: assets });
    expect(assets.fetch).toHaveBeenCalledOnce();
    expect(await res.text()).toBe('site');
  });

  it('leaves the docs search index to the assets binding', async () => {
    // /api/search is a built asset, and /api/release/* is the Worker's. The
    // route pattern has to tell them apart or the docs lose their search.
    const assets = { fetch: vi.fn(async () => new Response('[]', { status: 200 })) };
    const res = await worker.fetch(req('/api/search'), { ASSETS: assets });
    expect(assets.fetch).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
  });

  it('returns a 404 text fallback when ASSETS is absent', async () => {
    const res = await worker.fetch(req('/whatever'), {});
    expect(res.status).toBe(404);
    expect(await res.text()).toContain('hausfold.co');
  });
});
