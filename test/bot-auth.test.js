// Web Bot Auth (worker-sign.js): the key directory and the signature on every
// request the Worker sends out. The signatures are verified for real here,
// with WebCrypto against a key pair minted per run, over the RFC 9421 base
// rebuilt from the headers the way a receiver would rebuild it, so a change to
// the base string, the parameter order or the covered components fails loudly
// rather than shipping a signature nobody can check.
//
// Same stubbing discipline as the other suites: `caches` and `fetch` are
// stubbed, and the fetch stub records what it was handed.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import worker from '../worker.js';
import { resetRateLimits } from '../worker-api.js';
import {
  KEY_VAR,
  SIGNATURE_AGENT,
  DIRECTORY_PATH,
  DIRECTORY_CONTENT_TYPE,
  jwkThumbprint,
  signatureBase,
} from '../worker-sign.js';

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

// A fresh Ed25519 pair per file, exported the way the generator script writes
// the secret (nbf/exp included) so the directory has a validity window to show.
let secret;
let publicKey;
let kid;
const NBF = 1_756_000_000;
const EXP = NBF + 365 * 86400;

const keyPair = async () => {
  const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  secret = JSON.stringify({ kty: jwk.kty, crv: jwk.crv, x: jwk.x, d: jwk.d, nbf: NBF, exp: EXP });
  publicKey = pair.publicKey;
  kid = await jwkThumbprint(jwk);
};

const ENV = () => ({ [KEY_VAR]: secret });

// Parse `sig1=(...);alg=...` into the component list and the params string
// exactly as signed. A receiver does the same thing: the params are the
// header's own text after the label.
const parseSignatureInput = (header) => {
  const m = header.match(/^sig1=(\((.*?)\);.*)$/);
  expect(m, header).not.toBeNull();
  const params = m[1];
  const ids = m[2].split(' ');
  const get = (name) => {
    const q = params.match(new RegExp(`;${name}="([^"]*)"`));
    const n = params.match(new RegExp(`;${name}=(\\d+)`));
    return q ? q[1] : n ? Number(n[1]) : undefined;
  };
  return { params, ids, get };
};

const parseSignature = (header) => {
  const m = header.match(/^sig1=:([A-Za-z0-9+/=]+):$/);
  expect(m, header).not.toBeNull();
  return Uint8Array.from(atob(m[1]), (c) => c.charCodeAt(0));
};

const verify = async (base, sig) =>
  crypto.subtle.verify('Ed25519', publicKey, sig, new TextEncoder().encode(base));

const release = {
  tag_name: 'v2026.09.01',
  published_at: '2026-09-01T00:00:00Z',
  assets: [{ name: 'perch-macos.dmg', size: 1, browser_download_url: 'https://github.com/hausfold/perch/releases/download/v2026.09.01/perch-macos.dmg' }],
};

beforeEach(async () => {
  await keyPair();
  globalThis.caches = makeCaches();
  globalThis.fetch = vi.fn(async (input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url.includes('api.github.com')) return new Response(JSON.stringify(release), { status: 200 });
    if (url.includes('raw.githubusercontent.com')) return new Response('#!/bin/sh\necho hi\n', { status: 200 });
    throw new Error(`unexpected fetch: ${url} ${JSON.stringify(init)}`);
  });
  resetRateLimits();
});

// The headers the stubbed fetch was handed, as a Headers object whichever
// shape worker-sign.js passed them in.
const sentHeaders = (call = 0) => new Headers(globalThis.fetch.mock.calls[call][1]?.headers);

describe('the key directory', () => {
  it('serves the public key as a signed JWK Set under the directory media type', async () => {
    const res = await worker.fetch(req(DIRECTORY_PATH), ENV());
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe(DIRECTORY_CONTENT_TYPE);
    expect(res.headers.get('cache-control')).toBe('public, max-age=86400');
    const doc = await res.json();
    expect(doc.keys).toHaveLength(1);
    const [key] = doc.keys;
    expect(key).toMatchObject({ kty: 'OKP', crv: 'Ed25519', kid, use: 'sig', nbf: NBF, exp: EXP });
    expect(key.x).toBe(JSON.parse(secret).x);
    // The private half never leaves the secret.
    expect(key).not.toHaveProperty('d');
    expect(JSON.stringify(doc)).not.toContain(JSON.parse(secret).d);
  });

  it('signs the directory response with the key it serves, over the request authority', async () => {
    const res = await worker.fetch(req(DIRECTORY_PATH), ENV());
    const input = parseSignatureInput(res.headers.get('signature-input'));
    expect(input.ids).toEqual(['"@authority";req']);
    expect(input.get('tag')).toBe('http-message-signatures-directory');
    expect(input.get('alg')).toBe('ed25519');
    expect(input.get('keyid')).toBe(kid);
    expect(input.get('nonce')).toBeTruthy();
    const now = Math.floor(Date.now() / 1000);
    expect(input.get('created')).toBeLessThanOrEqual(now);
    expect(input.get('expires')).toBeGreaterThan(now);
    const base = signatureBase([['"@authority";req', 'hausfold.co']], input.params);
    expect(await verify(base, parseSignature(res.headers.get('signature')))).toBe(true);
  });

  it('is empty, unsigned and briefly cached with no secret in the environment', async () => {
    const res = await worker.fetch(req(DIRECTORY_PATH), {});
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe(DIRECTORY_CONTENT_TYPE);
    expect(res.headers.get('cache-control')).toBe('public, max-age=300');
    expect(res.headers.get('signature-input')).toBeNull();
    expect(res.headers.get('signature')).toBeNull();
    expect(await res.json()).toEqual({ keys: [] });
  });

  it('treats a malformed secret as no secret, and says so once', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const env = { [KEY_VAR]: '{"kty":"RSA"}' };
    expect(await (await worker.fetch(req(DIRECTORY_PATH), env)).json()).toEqual({ keys: [] });
    expect(await (await worker.fetch(req(DIRECTORY_PATH), env)).json()).toEqual({ keys: [] });
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0][0]).toContain(KEY_VAR);
    // And an installer still installs: the raw fetch goes out, unsigned.
    const res = await worker.fetch(req('/hacker.sh?ref=v2026.09.01'), env);
    expect(res.status).toBe(200);
    expect(sentHeaders().get('signature-input')).toBeNull();
    error.mockRestore();
  });
});

describe('outbound requests', () => {
  it('carry Signature-Agent, Signature-Input and a Signature a receiver can verify', async () => {
    const res = await worker.fetch(req('/api/release/perch'), ENV());
    expect(res.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch.mock.calls[0][0]).toBe('https://api.github.com/repos/hausfold/perch/releases/latest');
    const sent = sentHeaders();
    // The headers the route always sent are still there.
    expect(sent.get('user-agent')).toBe('hausfold-download');
    expect(sent.get('accept')).toBe('application/vnd.github+json');
    // The agent header is a Structured Field String: quotes included.
    expect(sent.get('signature-agent')).toBe(`"${SIGNATURE_AGENT}"`);
    expect(SIGNATURE_AGENT).toBe('https://hausfold.co');
    const input = parseSignatureInput(sent.get('signature-input'));
    expect(input.ids).toEqual(['"@authority"', '"signature-agent"']);
    expect(input.get('tag')).toBe('web-bot-auth');
    expect(input.get('alg')).toBe('ed25519');
    expect(input.get('keyid')).toBe(kid);
    expect(input.get('nonce')).toBeTruthy();
    const now = Math.floor(Date.now() / 1000);
    expect(input.get('created')).toBeLessThanOrEqual(now);
    expect(input.get('expires')).toBeGreaterThan(now);
    expect(input.get('expires') - input.get('created')).toBeLessThanOrEqual(24 * 3600);
    const base = signatureBase(
      [
        ['"@authority"', 'api.github.com'],
        ['"signature-agent"', `"${SIGNATURE_AGENT}"`],
      ],
      input.params,
    );
    expect(await verify(base, parseSignature(sent.get('signature')))).toBe(true);
  });

  it('sign every host the Worker reaches, each over its own authority', async () => {
    const res = await worker.fetch(req('/hacker.sh'), ENV());
    expect(res.status).toBe(200);
    // Two fetches: the release-tag lookup, then the script itself.
    const hosts = globalThis.fetch.mock.calls.map(([url]) => new URL(url).host);
    expect(hosts).toEqual(['api.github.com', 'raw.githubusercontent.com']);
    for (const [i, host] of hosts.entries()) {
      const sent = sentHeaders(i);
      const input = parseSignatureInput(sent.get('signature-input'));
      const base = signatureBase(
        [
          ['"@authority"', host],
          ['"signature-agent"', sent.get('signature-agent')],
        ],
        input.params,
      );
      expect(await verify(base, parseSignature(sent.get('signature'))), host).toBe(true);
    }
    // /design.md is the fourth outbound site.
    globalThis.fetch.mockClear();
    globalThis.fetch.mockImplementation(async () => new Response('# design\n'));
    expect((await worker.fetch(req('/design.md'), ENV())).status).toBe(200);
    expect(sentHeaders().get('signature-input')).toContain('tag="web-bot-auth"');
  });

  it('use a fresh nonce per request', async () => {
    await worker.fetch(req('/api/release/perch'), ENV());
    globalThis.caches = makeCaches();
    await worker.fetch(req('/api/release/perch'), ENV());
    const [a, b] = [0, 1].map((i) => parseSignatureInput(sentHeaders(i).get('signature-input')).get('nonce'));
    expect(a).not.toBe(b);
  });

  it('still go out, unsigned, when signing itself throws', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const sign = vi.spyOn(crypto.subtle, 'sign').mockRejectedValue(new Error('hsm on fire'));
    const res = await worker.fetch(req('/hacker.sh?ref=v2026.09.01'), ENV());
    expect(res.status).toBe(200);
    expect(sentHeaders().get('signature-input')).toBeNull();
    expect(sentHeaders().get('signature-agent')).toBeNull();
    expect(error).toHaveBeenCalledTimes(1);
    sign.mockRestore();
    error.mockRestore();
  });

  it('are the only kind worker.js makes: no bare fetch() to the outside', () => {
    // The rule AGENTS.md states, pinned: every outbound call goes through
    // signedFetch, so a new route cannot quietly send an unsigned request.
    // The assets binding is the one legitimate `.fetch(` and is not outbound.
    const src = readFileSync(new URL('../worker.js', import.meta.url), 'utf8');
    const bare = src
      .split('\n')
      .map((line, i) => [i + 1, line])
      .filter(([, line]) => /(^|[^.\w])fetch\(/.test(line) && !/^\s*\/\//.test(line))
      .filter(([, line]) => !/async fetch\(request, env, ctx\)/.test(line));
    expect(bare).toEqual([]);
  });

  it('go out unsigned, and otherwise unchanged, with no secret', async () => {
    const res = await worker.fetch(req('/api/release/perch'), {});
    expect(res.status).toBe(200);
    const sent = sentHeaders();
    expect(sent.get('user-agent')).toBe('hausfold-download');
    for (const name of ['signature-agent', 'signature-input', 'signature']) {
      expect(sent.get(name), name).toBeNull();
    }
  });
});

describe('the thumbprint', () => {
  it('is the RFC 8037 A.3 vector', async () => {
    // RFC 8037 Appendix A.3: the Ed25519 test key and its published thumbprint.
    const jwk = { kty: 'OKP', crv: 'Ed25519', x: '11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo' };
    expect(await jwkThumbprint(jwk)).toBe('kPrK_qmxVWaYVA9wwBF6Iuo3vVzz7TxHCTwXBygrS4k');
  });
});
