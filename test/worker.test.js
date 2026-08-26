// Unit tests for worker.js — the hausfold.co Worker, which carries the
// `curl | bash` install front door. The security-critical surface is ref
// validation (no path traversal into raw.githubusercontent.com) and the
// latestRef() fallback chain, so those get the most attention here.
//
// The worker only touches two globals we don't get for free in Node: `fetch`
// (GitHub API + raw content) and `caches` (the ~1h latest-release cache). We
// stub both per-test so the suite is fast and offline.
//
// The route is table-driven —
// `/init.sh` is `/hacker.sh` here, resolved through a table rather than
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
      const res = await worker.fetch(req(`/hacker.sh?ref=${encodeURIComponent(ref)}`), {});
      expect(res.status).toBe(400);
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  }

  it('accepts a well-formed release tag and proxies bootstrap.sh', async () => {
    globalThis.fetch = makeFetch([
      { match: 'raw.githubusercontent.com/hausfold/haus/v2026.07.18/bootstrap.sh', body: '#!/bin/bash\n' },
    ]);
    const res = await worker.fetch(req('/hacker.sh?ref=v2026.07.18'), {});
    expect(res.status).toBe(200);
    expect(res.headers.get('x-hausfold-ref')).toBe('v2026.07.18');
    // The body is the upstream script with the desktop pinned into it — see
    // the pin suite below for the shape. Everything else is pass-through.
    expect(await res.text()).toContain('#!/bin/bash');
  });

  it('accepts a same-day repeat tag (v<date>-N)', async () => {
    globalThis.fetch = makeFetch([
      { match: 'raw.githubusercontent.com/hausfold/haus/v2026.08.14-1/bootstrap.sh', body: 'OK' },
    ]);
    const res = await worker.fetch(req('/hacker.sh?ref=v2026.08.14-1'), {});
    expect(res.status).toBe(200);
  });
});

describe('?ref= is a release tag, not any ref (fork-network guard)', () => {
  // The traversal guard above is not what stops this one. A commit SHA passes
  // SAFE_REF, and raw.githubusercontent.com serves any object in a public
  // repo's FORK NETWORK — including commits on no branch — so a SHA anyone can
  // get in there via a fork PR would otherwise be servable as
  // `hausfold.co/hacker.sh?ref=<sha>`: our domain, our TLS, their script.
  // Only the repo's own maintainers can create a tag.
  const NOT_TAGS = [
    ['a commit SHA', '0a3f9c1d2e4b5a6f7089abcdef0123456789abcd'],
    ['a branch', 'main'],
    ['a fork branch name', 'attacker-patch-1'],
    ['a tag-ish prefix', 'v2026.07.18-evil-branch'],
    ['a bare semver tag', 'v1.2.3'],
  ];

  for (const [label, ref] of NOT_TAGS) {
    it(`refuses ${label} with 400 and no fetch`, async () => {
      globalThis.fetch = makeFetch([{ match: 'raw.githubusercontent.com', body: 'BOOT' }]);
      const res = await worker.fetch(req(`/hacker.sh?ref=${encodeURIComponent(ref)}`), {});
      expect(res.status).toBe(400);
      expect(await res.text()).toContain('release tag');
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  }

  it('still lets the deploy-time REF var pin a branch', async () => {
    // That one is set by whoever deploys the Worker, not by whoever clicks a
    // link — pinning a branch during an incident is what it exists for.
    globalThis.fetch = makeFetch([
      { match: 'raw.githubusercontent.com/hausfold/haus/main/bootstrap.sh', body: 'MAIN' },
    ]);
    const res = await worker.fetch(req('/hacker.sh'), { REF: 'main' });
    expect(res.status).toBe(200);
    expect(res.headers.get('x-hausfold-ref')).toBe('main');
  });
});

describe('the desktop table', () => {
  // The table is the whole routing decision: a name in it is a promise that
  // hausfold.co/<name>.sh keeps resolving, and a name outside it must never
  // become a fetch.
  it('does not serve an unknown desktop', async () => {
    globalThis.fetch = makeFetch([]);
    const res = await worker.fetch(req('/gnome.sh'), {});
    expect(res.status).toBe(404); // falls through to the assets/404 path
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  // `blank` is a real desktop in hausfold/haus — the null selection, for
  // someone assembling rooms by hand — and it is deliberately not in the
  // table, because a key here is a promise to keep serving that URL and this
  // site does not present it. If a page for it ever lands, this test is the
  // one to change, not to delete.
  it('does not serve blank.sh — a real desktop the site does not present', async () => {
    globalThis.fetch = makeFetch([]);
    const res = await worker.fetch(req('/blank.sh'), {});
    expect(res.status).toBe(404);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('does not serve nebelung.sh — nebelung is the palette, not the desktop', async () => {
    globalThis.fetch = makeFetch([]);
    const res = await worker.fetch(req('/nebelung.sh'), {});
    expect(res.status).toBe(404);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('has no /init.sh — the installer is named after the desktop', async () => {
    globalThis.fetch = makeFetch([]);
    const res = await worker.fetch(req('/init.sh'), {});
    expect(res.status).toBe(404);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

describe('the desktop pin — what /<desktop>.sh writes into the script', () => {
  // The one place this Worker modifies what it proxies. `curl | bash` passes
  // no arguments, so a URL that means "install minimal" can only mean it by
  // putting something in the script itself.
  const withShebang = (body) => [
    { match: 'raw.githubusercontent.com/hausfold/haus/main/bootstrap.sh', body },
  ];

  it('exports the desktop, and answers with it in a header', async () => {
    globalThis.fetch = makeFetch(withShebang('#!/usr/bin/env bash\nset -eu\n'));
    const res = await worker.fetch(req('/minimal.sh'), { REF: 'main' });
    expect(res.status).toBe(200);
    expect(res.headers.get('x-hausfold-desktop')).toBe('minimal');
    expect(await res.text()).toContain('export HAUS_DESKTOP=minimal\n');
  });

  // One variable, and only one. A bootstrap old enough not to read it asks the
  // question the URL already answered — a degradation, not a break.
  it('exports the desktop under exactly one name', async () => {
    globalThis.fetch = makeFetch(withShebang('#!/usr/bin/env bash\n'));
    const body = await (await worker.fetch(req('/everyday.sh'), { REF: 'main' })).text();
    expect(body).toContain('HAUS_DESKTOP=everyday');
    expect(body).not.toMatch(/DESKTOP=\S+ /);
  });

  // The shebang has to stay on line 1. Under `curl | bash` it is an inert
  // comment and this would not matter, but people save the script and run it
  // directly, and a file whose first line is an `export` has no interpreter.
  it('keeps the shebang on the first line', async () => {
    globalThis.fetch = makeFetch(withShebang('#!/usr/bin/env bash\nset -eu\n'));
    const body = await (await worker.fetch(req('/minimal.sh'), { REF: 'main' })).text();
    expect(body.split('\n')[0]).toBe('#!/usr/bin/env bash');
    // and the rest of the script survives the surgery
    expect(body).toContain('set -eu');
  });

  // The edge the first draft got wrong: a `#!` line with no trailing newline
  // fell through to the prepend branch and put the export ABOVE the shebang —
  // the one outcome pinDesktop must never produce.
  it('keeps the shebang first even when it is the only line', async () => {
    globalThis.fetch = makeFetch(withShebang('#!/usr/bin/env bash'));
    const body = await (await worker.fetch(req('/minimal.sh'), { REF: 'main' })).text();
    expect(body.startsWith('#!/usr/bin/env bash')).toBe(true);
    expect(body).toContain('HAUS_DESKTOP=minimal');
  });

  it('still pins a script that has no shebang at all', async () => {
    globalThis.fetch = makeFetch(withShebang('set -eu\n'));
    const body = await (await worker.fetch(req('/minimal.sh'), { REF: 'main' })).text();
    expect(body).toContain('HAUS_DESKTOP=minimal');
    expect(body).toContain('set -eu');
  });

  // /haus.sh is the door for someone who has not chosen. It must reach the
  // interview, which means it must NOT arrive with an answer already in it.
  it('/haus.sh pins nothing and passes the script through byte for byte', async () => {
    const script = '#!/usr/bin/env bash\nset -eu\necho hi\n';
    globalThis.fetch = makeFetch(withShebang(script));
    const res = await worker.fetch(req('/haus.sh'), { REF: 'main' });
    expect(res.status).toBe(200);
    expect(res.headers.get('x-hausfold-desktop')).toBe(null);
    expect(await res.text()).toBe(script);
  });

  // The desktop's route, and the pin it hands the served script.
  //
  // 🚨 The pin names what the SERVED script understands. This Worker serves
  // bootstrap.sh from the latest RELEASE TAG, not from main, so
  // `/hacker.sh?ref=<pre-2026-08-16 tag>` hands `hacker` to a release that
  // predates the name and dies with "unknown desktop". That is a real hole,
  // accepted on purpose — `?ref=` is a tag-level escape hatch we don't publish
  // — and the case to remember is a yanked release dragging `releases/latest`
  // back behind it.
  it('/hacker.sh resolves and pins the desktop', async () => {
    globalThis.fetch = makeFetch(withShebang('#!/usr/bin/env bash\n'));
    const res = await worker.fetch(req('/hacker.sh'), { REF: 'main' });
    expect(res.status).toBe(200);
    expect(res.headers.get('x-hausfold-desktop')).toBe('hacker');
  });
});

describe('latestRef() fallback chain', () => {
  it('env.REF hard-pin wins without any fetch or cache read', async () => {
    globalThis.fetch = makeFetch([
      { match: 'raw.githubusercontent.com/hausfold/haus/v9.9.9/bootstrap.sh', body: 'PINNED' },
    ]);
    const res = await worker.fetch(req('/hacker.sh'), { REF: 'v9.9.9' });
    expect(res.headers.get('x-hausfold-ref')).toBe('v9.9.9');
    // API was never consulted.
    expect(globalThis.fetch.mock.calls.every(([u]) => !String(u).includes('api.github.com'))).toBe(true);
  });

  it('resolves and caches the latest release tag from the GitHub API', async () => {
    globalThis.fetch = makeFetch([
      { match: 'api.github.com', json: { tag_name: 'v2.0.0' } },
      { match: 'raw.githubusercontent.com/hausfold/haus/v2.0.0/bootstrap.sh', body: 'LATEST' },
    ]);
    const res = await worker.fetch(req('/hacker.sh'), {});
    expect(res.headers.get('x-hausfold-ref')).toBe('v2.0.0');
    expect(globalThis.caches._store.get(RELEASE_KEY)).toBe('v2.0.0');
  });

  it('serves a cached ref without hitting the API', async () => {
    globalThis.caches._store.set(RELEASE_KEY, 'v1.5.0');
    globalThis.fetch = makeFetch([
      { match: 'raw.githubusercontent.com/hausfold/haus/v1.5.0/bootstrap.sh', body: 'CACHED' },
    ]);
    const res = await worker.fetch(req('/hacker.sh'), {});
    expect(res.headers.get('x-hausfold-ref')).toBe('v1.5.0');
    expect(globalThis.fetch.mock.calls.some(([u]) => String(u).includes('api.github.com'))).toBe(false);
  });

  it('falls back to main when the API returns a non-2xx', async () => {
    globalThis.fetch = makeFetch([
      { match: 'api.github.com', status: 403, body: 'rate limited' },
      { match: 'raw.githubusercontent.com/hausfold/haus/main/bootstrap.sh', body: 'MAIN' },
    ]);
    const res = await worker.fetch(req('/hacker.sh'), {});
    expect(res.headers.get('x-hausfold-ref')).toBe('main');
  });

  it('falls back to main when the API throws (network hiccup)', async () => {
    globalThis.fetch = makeFetch([
      { match: 'api.github.com', throws: true },
      { match: 'raw.githubusercontent.com/hausfold/haus/main/bootstrap.sh', body: 'MAIN' },
    ]);
    const res = await worker.fetch(req('/hacker.sh'), {});
    expect(res.headers.get('x-hausfold-ref')).toBe('main');
  });

  it('falls back to main when the API returns an unsafe tag_name', async () => {
    // A compromised/garbage release tag must not become a fetch path.
    globalThis.fetch = makeFetch([
      { match: 'api.github.com', json: { tag_name: '../../evil' } },
      { match: 'raw.githubusercontent.com/hausfold/haus/main/bootstrap.sh', body: 'MAIN' },
    ]);
    const res = await worker.fetch(req('/hacker.sh'), {});
    expect(res.headers.get('x-hausfold-ref')).toBe('main');
    expect(globalThis.caches._store.has(RELEASE_KEY)).toBe(false);
  });
});

describe('serveInstaller upstream handling', () => {
  it('returns 502 when bootstrap.sh cannot be fetched', async () => {
    globalThis.fetch = makeFetch([
      { match: 'raw.githubusercontent.com', status: 404, body: 'not found' },
    ]);
    const res = await worker.fetch(req('/hacker.sh?ref=v2026.01.02'), {});
    expect(res.status).toBe(502);
    expect(await res.text()).toContain('v2026.01.02');
  });

  it('sets caching headers on a successful proxy', async () => {
    globalThis.fetch = makeFetch([{ match: 'raw.githubusercontent.com', body: 'OK' }]);
    const res = await worker.fetch(req('/hacker.sh?ref=v2026.01.02'), {});
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

  it('falls back to the releases page rather than handing over a non-macOS asset', async () => {
    globalThis.fetch = makeFetch([
      {
        match: 'api.github.com/repos/hausfold/perch/releases/latest',
        json: {
          tag_name: 'v2026.01.02',
          assets: [
            { name: 'checksums.txt', size: 10, browser_download_url: 'https://example.com/checksums.txt' },
          ],
        },
      },
    ]);
    const res = await worker.fetch(req('/download/perch'), {});
    expect(res.headers.get('location')).toBe('https://github.com/hausfold/perch/releases/latest');
  });

  it('answers the same with a trailing slash', async () => {
    // Every page URL on this site canonicalizes to a trailing slash
    // (`trailingSlash: true`), so a hand-typed /download/pounce/ that 404s is a
    // trap the site's own convention lays.
    globalThis.fetch = makeFetch([
      { match: 'api.github.com/repos/hausfold/pounce/releases/latest', json: PONCE_RELEASE },
    ]);
    const res = await worker.fetch(req('/download/pounce/'), {});
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe(PONCE_RELEASE.assets[0].browser_download_url);
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
    const res = await worker.fetch(req('/download/desktop'), {});
    expect(res.status).toBe(404); // falls through to the assets/404 path
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

describe('short domains (perch.hausfold.co)', () => {
  const on = (host, path) => new Request(`https://${host}${path}`);

  it('301s the root to the install page rather than serving one', async () => {
    // The whole point: a short URL to hand someone, not a second account of
    // /docs/perch/install. If this ever answers 200, the page came back.
    const res = await worker.fetch(on('perch.hausfold.co', '/'), {});
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('https://hausfold.co/docs/perch/install/');
  });

  it('never reaches the ASSETS binding, even though / is a real asset', async () => {
    const assets = { fetch: vi.fn(async () => new Response('landing page')) };
    await worker.fetch(on('perch.hausfold.co', '/'), { ASSETS: assets });
    expect(assets.fetch).not.toHaveBeenCalled();
  });

  it('sends every other path to the same path on hausfold.co', async () => {
    // So the subdomain can never quietly become a second copy of the site.
    const res = await worker.fetch(on('perch.hausfold.co', '/perch/privacy/'), {});
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('https://hausfold.co/perch/privacy/');
  });

  it('keeps the query string', async () => {
    const res = await worker.fetch(on('perch.hausfold.co', '/docs/perch/?q=notch'), {});
    expect(res.headers.get('location')).toBe('https://hausfold.co/docs/perch/?q=notch');
  });

  it('does not claim a Worker route on the short domain', async () => {
    // /download/perch is a Worker route on hausfold.co. On the short domain it
    // is a redirect like anything else — one host, one job, no second door that
    // has to be kept in step.
    const res = await worker.fetch(on('perch.hausfold.co', '/download/perch'), {});
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('https://hausfold.co/download/perch');
  });

  it('leaves hausfold.co itself alone', async () => {
    const assets = { fetch: vi.fn(async () => new Response('landing page')) };
    const res = await worker.fetch(req('/'), { ASSETS: assets });
    expect(assets.fetch).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
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
