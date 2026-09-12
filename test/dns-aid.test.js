// The DNS-AID records (scripts/dns-aid.mjs) against what the site serves.
//
// DNS is the one part of the machine-facing surface that lives outside this
// repo's deploy: dns.yml converges the zone on the table in that script. What
// these tests hold is that the table names documents the Worker and the export
// actually answer, that the records are well-formed service bindings, and that
// the plan the script computes can never reach a record outside
// `_agents.hausfold.co`. Offline: the Cloudflare and DoH halves are not
// exercised here, only the pure functions they are built from.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import worker from '../worker.js';
import { MCP_TRANSPORTS, A2A_ENDPOINT } from '../worker-config.js';
import {
  ZONE,
  KEY,
  COMMENT,
  desiredRecords,
  presentation,
  parseSvcParams,
  parseRdata,
  svcParamsText,
  keyNumber,
  sameData,
  same,
  inScope,
  fromApi,
  toApi,
  plan,
  drift,
  wellKnownUrl,
} from '../scripts/dns-aid.mjs';

const req = (path, init) => new Request(`https://hausfold.co${path}`, init);

beforeEach(() => {
  const store = new Map();
  globalThis.caches = {
    default: {
      async match(r) {
        const url = typeof r === 'string' ? r : r.url;
        return store.has(url) ? new Response(store.get(url)) : undefined;
      },
      async put(r, res) {
        const url = typeof r === 'string' ? r : r.url;
        store.set(url, await res.text());
      },
    },
  };
  globalThis.fetch = vi.fn(async (input) => {
    throw new Error(`unexpected fetch: ${typeof input === 'string' ? input : input.url}`);
  });
});

const byName = () => Object.fromEntries(desiredRecords().map((r) => [r.name, r]));

describe('the record table', () => {
  it('publishes the index and one record per protocol served, and only under _agents', () => {
    const names = desiredRecords().map((r) => r.name);
    expect(names).toEqual([`_index._agents.${ZONE}`, `_mcp._agents.${ZONE}`, `_a2a._agents.${ZONE}`]);
    for (const n of names) expect(inScope(n)).toBe(true);
  });

  it('every record is a ServiceMode SVCB with a certificate-bearing target', () => {
    for (const r of desiredRecords()) {
      expect(r.type).toBe('SVCB');
      expect(r.priority).toBeGreaterThanOrEqual(1); // 0 would be AliasMode
      // draft-02 §3.2: the TargetName carries a public x.509 certificate, so
      // it is a real hostname, never a DNS-SD label.
      expect(r.target).not.toContain('_');
      expect(r.target.endsWith('.')).toBe(false);
      expect(r.params.port).toBe('443');
    }
  });

  it('every key listed in mandatory= is present, and mandatory never lists itself', () => {
    for (const r of desiredRecords()) {
      const mandatory = r.params.mandatory.split(',');
      expect(mandatory).not.toContain('mandatory');
      for (const k of mandatory) expect(r.params, `${r.name} mandatory=${k}`).toHaveProperty(k);
    }
  });

  it('carries one agent protocol per record (draft §3.1.1)', () => {
    for (const r of desiredRecords()) expect(r.params.alpn).not.toContain(',');
    expect(byName()[`_mcp._agents.${ZONE}`].params.alpn).toBe('mcp');
    expect(byName()[`_a2a._agents.${ZONE}`].params.alpn).toBe('a2a');
  });

  it("spells DNS-AID's unregistered keys as keyNNNNN in the private-use range", () => {
    for (const k of Object.values(KEY)) {
      expect(k).toMatch(/^key\d{5}$/);
      expect(keyNumber(k)).toBeGreaterThanOrEqual(65280);
      expect(keyNumber(k)).toBeLessThanOrEqual(65534);
    }
    // A key the wire format cannot carry is refused rather than published.
    expect(() => svcParamsText({ cap: 'x' })).toThrow(/keyNNNNN/);
  });

  it('the dashboard comment fits the 100 characters Cloudflare allows', () => {
    expect(COMMENT.length).toBeLessThanOrEqual(100);
  });
});

describe('what the records point at is what the site serves', () => {
  it('every well-known value is one suffix under /.well-known/ on its own target', () => {
    for (const r of desiredRecords()) {
      const suffix = r.params[KEY.wellKnown];
      expect(suffix, r.name).toMatch(/^[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/);
      expect(wellKnownUrl(r)).toBe(`https://${r.target}/.well-known/${suffix}`);
    }
  });

  it('the MCP record targets the host of the MCP transport and names its server card', async () => {
    const r = byName()[`_mcp._agents.${ZONE}`];
    const transport = new URL(MCP_TRANSPORTS.hausfold.url);
    expect(r.target).toBe(transport.hostname);

    // The locator and the well-known suffix are the same document, and it is
    // the server card the Worker answers.
    const cap = new URL(r.params[KEY.cap]);
    expect(cap.origin).toBe(transport.origin);
    expect(wellKnownUrl(r)).toBe(cap.href);
    const res = await worker.fetch(req(cap.pathname), {});
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/mcp-server-card+json');
    const card = await res.json();
    expect(card.serverUrl).toBe(MCP_TRANSPORTS.hausfold.url);
  });

  it('the A2A record targets the agent card, which names the interface it is published for', async () => {
    const r = byName()[`_a2a._agents.${ZONE}`];
    const cap = new URL(r.params[KEY.cap]);
    expect(r.target).toBe(cap.hostname);
    expect(wellKnownUrl(r)).toBe(cap.href);
    // draft Figure 1 spells the A2A record's capability document exactly this
    // way, so the suffix is the one a consumer that reads only `well-known`
    // already looks for.
    expect(r.params[KEY.wellKnown]).toBe('agent-card.json');

    const res = await worker.fetch(req(cap.pathname), {});
    expect(res.status).toBe(200);
    const card = await res.json();
    // The record names the card; the card names /a2a. A client that arrives
    // through DNS reaches the same JSON-RPC binding as one that arrives
    // through HTTP.
    expect(card.supportedInterfaces.map((i) => i.url)).toContain(A2A_ENDPOINT.url);
    expect(new URL(A2A_ENDPOINT.url).hostname).toBe(r.target);
  });

  it('the index record names the ARD catalog in public/.well-known', () => {
    const r = byName()[`_index._agents.${ZONE}`];
    expect(r.target).toBe(ZONE);
    // dns-aid-core's catalog pointer reads one bare filename and fetches
    // https://<target>/.well-known/<filename>: a path with a slash in it
    // would fall back to its default name, which this site does not serve.
    const filename = r.params[KEY.wellKnown];
    expect(filename).not.toContain('/');
    const catalog = JSON.parse(
      readFileSync(new URL(`../public/.well-known/${filename}`, import.meta.url), 'utf8'),
    );
    expect(catalog.entries.some((e) => e.url === MCP_TRANSPORTS.hausfold.url)).toBe(true);
  });

  it('the prose that names the records names these ones, and these keys', async () => {
    const developers = readFileSync(new URL('../src/app/developers/page.tsx', import.meta.url), 'utf8');
    const agentView = await (await worker.fetch(req('/index.md'), {})).text();
    for (const r of desiredRecords()) {
      expect(developers, `/developers should name ${r.name}`).toContain(r.name);
      expect(agentView, `the agent view should name ${r.name}`).toContain(r.name);
    }
    // The page hand-types the key numbers; KEY is where they change.
    for (const k of Object.values(KEY)) expect(developers, `/developers should name ${k}`).toContain(k);
  });
});

describe('presentation and parsing', () => {
  it('round-trips every record through the quoted zone-file form', () => {
    for (const r of desiredRecords()) {
      expect(parseSvcParams(svcParamsText(r.params))).toEqual(r.params);
      const line = presentation(r);
      expect(line.startsWith(`${r.name}. ${r.ttl} IN SVCB ${r.priority} ${r.target}. `)).toBe(true);
    }
  });

  it('prints SvcParams in wire order, mandatory first', () => {
    const text = svcParamsText({ key65409: 'a', port: '443', alpn: 'mcp', mandatory: 'alpn,port' });
    expect(text).toBe('mandatory="alpn,port" alpn="mcp" port="443" key65409="a"');
  });

  it('reads the unquoted form a resolver prints and compares it equal', () => {
    const r = byName()[`_mcp._agents.${ZONE}`];
    const rdata = `1 hausfold.co. mandatory=port,alpn alpn=mcp port=443 key65400=${r.params[KEY.cap]} key65409=${r.params[KEY.wellKnown]}`;
    const have = { ...parseRdata(rdata), type: 'SVCB', name: `${r.name}.` };
    expect(sameData(r, have)).toBe(true);
    expect(same(r, { ...have, ttl: 300 })).toBe(false); // ttl is part of the published record
  });

  it('escapes and unescapes a quote inside a value', () => {
    const params = { alpn: 'x', key65400: 'say "hi" \\ bye' };
    expect(parseSvcParams(svcParamsText(params))).toEqual(params);
  });
});

describe('the plan', () => {
  const api = (over) => ({
    id: 'id-' + Math.random().toString(36).slice(2, 8),
    type: 'SVCB',
    ttl: 3600,
    ...over,
  });

  it('is empty when the zone already matches, whatever the target and quoting look like', () => {
    const existing = desiredRecords().map((r) =>
      fromApi(
        api({
          name: r.name,
          data: { priority: r.priority, target: `${r.target}.`, value: svcParamsText(r.params) },
        }),
      ),
    );
    const p = plan(existing);
    expect(drift(p)).toBe(0);
    expect(p.keep).toHaveLength(3);
  });

  it('creates what is missing, updates what drifted, deletes what the table does not name', () => {
    const [index, mcp, a2a] = desiredRecords();
    const existing = [
      // the index record as published
      fromApi(api({ name: index.name, data: { priority: 1, target: 'hausfold.co.', value: svcParamsText(index.params) } })),
      // the MCP record with a stale target
      fromApi(api({ id: 'stale', name: mcp.name, data: { priority: 1, target: 'old.example.', value: svcParamsText(mcp.params) } })),
      // the A2A record as published
      fromApi(api({ name: a2a.name, data: { priority: 1, target: 'hausfold.co.', value: svcParamsText(a2a.params) } })),
      // a protocol record under _agents nobody asked for, added by hand in the
      // dashboard (Cloudflare's content form)
      fromApi(api({ id: 'extra', name: `_acp._agents.${ZONE}`, content: '1 hausfold.co. alpn=acp port=443' })),
      // a TXT at the index name: also not in the table, also removed
      { id: 'txt', type: 'TXT', name: index.name, ttl: 3600, priority: 0, target: '', params: {} },
    ];
    const p = plan(existing);
    expect(p.create).toHaveLength(0);
    expect(p.update.map((u) => u.id)).toEqual(['stale']);
    expect(p.delete.map((d) => d.id).sort()).toEqual(['extra', 'txt']);
    expect(p.keep).toHaveLength(2);
  });

  it('never touches a record outside _agents, even one the zone lists beside them', () => {
    const outside = [
      { id: 'apex', type: 'A', name: ZONE, ttl: 1, priority: 0, target: '', params: {} },
      { id: 'lookalike', type: 'SVCB', name: `x_agents.${ZONE}`, ttl: 3600, priority: 1, target: ZONE, params: {} },
      { id: 'challenge', type: 'TXT', name: `_agents-challenge.${ZONE}`, ttl: 60, priority: 0, target: '', params: {} },
    ];
    const p = plan(outside);
    expect(p.delete).toHaveLength(0);
    expect(p.create).toHaveLength(3);
  });

  it('sends Cloudflare a dotted target, a quoted value and the comment', () => {
    const body = toApi(byName()[`_mcp._agents.${ZONE}`]);
    expect(body.data.target).toBe('hausfold.co.');
    expect(body.data.value).toContain('alpn="mcp"');
    expect(body.comment).toBe(COMMENT);
    expect(body.ttl).toBe(3600);
  });
});

describe('a zone record this table never learned', () => {
  it('is compared and reported rather than crashing the plan', () => {
    const [index] = desiredRecords();
    const odd = {
      id: 'odd',
      type: 'SVCB',
      name: index.name,
      ttl: 3600,
      priority: 1,
      target: ZONE,
      params: { ...index.params, 'tls-supported-groups': '29,23' },
    };
    const p = plan([odd]);
    expect(p.update.map((u) => u.id)).toEqual(['odd']);
    expect(p.create.map((c) => c.record.name)).toEqual([`_mcp._agents.${ZONE}`, `_a2a._agents.${ZONE}`]);
    expect(drift(p)).toBe(3);
  });
});

describe('the Cloudflare client', () => {
  const env = { CLOUDFLARE_API_TOKEN: 'tok', CLOUDFLARE_ZONE_ID: 'zone1' };
  const calls = [];
  const respond = (status, body) => new Response(JSON.stringify(body), { status });

  beforeEach(() => {
    calls.length = 0;
    globalThis.fetch = vi.fn(async (url, init = {}) => {
      calls.push({ url: String(url), method: init.method ?? 'GET', body: init.body && JSON.parse(init.body), auth: init.headers?.authorization });
      const u = String(url);
      if (u.includes('/dns_records?')) {
        return respond(200, {
          success: true,
          result: [
            { id: 'r1', type: 'SVCB', name: `_index._agents.${ZONE}`, ttl: 3600, data: { priority: 1, target: 'hausfold.co.', value: 'alpn="h2" port="443"' } },
            { id: 'r2', type: 'TXT', name: `_index._agents.${ZONE}`, ttl: 3600, content: '"agents=x:mcp"', data: {} },
            { id: 'apex', type: 'A', name: ZONE, ttl: 1, content: '192.0.2.1', data: {} },
          ],
        });
      }
      if (u.endsWith('/dnssec') && init.method === undefined) return respond(200, { success: true, result: { status: 'disabled' } });
      if (u.endsWith('/dnssec')) return respond(403, { success: false, errors: [{ code: 10000, message: 'Authentication error' }] });
      return respond(200, { success: true, result: {} });
    });
  });

  it('lists only under _agents, then creates, updates and deletes exactly the plan', async () => {
    const { listExisting, apply } = await import('../scripts/dns-aid.mjs');
    const existing = await listExisting(env);
    expect(calls[0].url).toContain(`/zones/zone1/dns_records?per_page=500&name.endswith=${encodeURIComponent(`_agents.${ZONE}`)}`);
    expect(calls[0].auth).toBe('Bearer tok');
    expect(existing.map((r) => r.id)).toEqual(['r1', 'r2']); // the apex record is outside the fence

    const p = plan(existing);
    await apply(p, env);
    const writes = calls.slice(1).map((c) => `${c.method} ${c.url.split('/zones/zone1')[1]}`);
    expect(writes).toEqual([
      'POST /dns_records',
      'POST /dns_records',
      'PUT /dns_records/r1',
      'DELETE /dns_records/r2',
    ]);
    expect(calls[1].body.name).toBe(`_mcp._agents.${ZONE}`);
    expect(calls[2].body.name).toBe(`_a2a._agents.${ZONE}`);
    expect(calls[3].body.data.value).toContain('key65409="ard.json"');
  });

  it('reports a DNSSEC the token may not flip instead of failing the records', async () => {
    const { ensureDnssec, NEEDS_ZONE_SETTINGS } = await import('../scripts/dns-aid.mjs');
    const d = await ensureDnssec(env);
    expect(d.status).toBe('disabled');
    expect(d.note).toBe(NEEDS_ZONE_SETTINGS);
    expect(calls.map((c) => c.method)).toEqual(['GET', 'PATCH']);
    expect(calls[1].body).toEqual({ status: 'active' });
  });
});
