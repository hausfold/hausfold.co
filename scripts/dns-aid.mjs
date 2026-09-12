// The DNS-AID records for hausfold.co, and the one command that publishes them.
//
// DNS-AID (draft-mozleywilliams-dnsop-dnsaid-02) is agent discovery through
// DNS: SVCB records under `_agents.<domain>` name the endpoints an agent can
// talk to, so a client that knows only the domain finds the MCP server without
// reading a page first. Two records:
//
//   _index._agents.hausfold.co   the organization index: a ServiceMode pointer
//                                at the ARD catalog, /.well-known/ard.json
//   _mcp._agents.hausfold.co     the MCP server: alpn=mcp on hausfold.co:443,
//                                capability document = the MCP server card
//
// The records are DATA, derived from the same table worker.js serves from: the
// MCP record's target is the hostname of MCP_TRANSPORTS.hausfold.url and its
// capability document is the server card that Worker answers, so a transport
// that moves in worker-config.js moves in DNS on the next push.
// test/dns-aid.test.js holds every path a record names to a document the site
// actually serves.
//
// Modes:
//   node scripts/dns-aid.mjs            converge the zone on the table: create,
//                                       update, delete under _agents.<zone>.
//                                       Needs CLOUDFLARE_API_TOKEN and
//                                       CLOUDFLARE_ZONE_ID.
//   node scripts/dns-aid.mjs --dnssec   the same, then turn DNSSEC on. A zone
//                                       setting, not a record, so it is asked
//                                       for by name: dns.yml passes it, and a
//                                       registrar transfer removes it there.
//   node scripts/dns-aid.mjs --check    read-only; exit 1 if the zone drifted
//   node scripts/dns-aid.mjs --print    the records in zone-file form, offline
//   node scripts/dns-aid.mjs --verify   ask 1.1.1.1 over DoH, the way
//                                       isitagentready.com does: every record
//                                       answered, and whether the AD flag
//                                       (DNSSEC-validated) is set. No token.
//
// 🚨 The delete half only ever touches names under `_agents.<zone>`. inScope()
// is the fence: every delete goes through it, and the test pins that a record
// outside it never appears in a plan. Under that name the table is the whole
// truth, so a record added by hand in the dashboard is removed on the next
// push. That is the point, not a hazard: the zone can't disagree with the repo.
//
// SvcParamKeys: the draft names `cap` (capability descriptor locator) and
// `well-known` (RFC 8615 path) but assigns no code points, so they go on the
// wire as keyNNNNN in RFC 9460's private-use range (65280 to 65534), numbered
// as dns-aid-core, the draft's reference implementation, numbers them. When
// IANA assigns real numbers, KEY below is the one place to change.
//
// No ARD row, on purpose. ARD (agenticresourcediscovery.org/spec/, read at
// v0.91) lists DNS among its discovery mechanisms — "Service Binding records
// that point to either a static entry source (e.g. _entries._agents.example.com)
// or a dynamic Agent Registry search endpoint (e.g. _search._agents.example.com)"
// — and stops there: no record type beyond "service binding", no SvcParamKeys,
// nothing a consumer is told to do with one. Its normative resolution is HTTP
// alone (fetch /.well-known/ard.json, honour rel="ard"), and the only DNS wire
// format it cites is DNS-AID's, in §5.3.2.1's federated routing. So
// `_entries._agents` would be `_index._agents` pointing at the same file in a
// format we invented, and `_search._agents` would advertise an ARD Agent
// Registry — the §5.3 POST /search and POST /explore query model — that this
// domain does not run (/v1/search is docs search). Revisit when ARD specifies
// the record: a type, the keys, and what a consumer does with them. Until then
// this table is DNS-AID's alone, held there by the test that asserts the name
// set exactly rather than only the _agents suffix.
//
// The deploy token cannot flip DNSSEC (that needs Zone Settings:Edit); the
// script says so and moves on. docs/deploying.md has the one-click alternative.

import { pathToFileURL } from 'node:url';
import { MCP_TRANSPORTS } from '../worker-config.js';

export const ZONE = 'hausfold.co';
export const TTL = 3600;
export const KEY = { cap: 'key65400', wellKnown: 'key65409' };

const API = 'https://api.cloudflare.com/client/v4';
const DOH = 'https://cloudflare-dns.com/dns-query';
const SVCB_TYPE = 64;
const HTTPS_TYPE = 65;

// Shown in the dashboard beside each record. Cloudflare caps comments at 100
// characters; the test counts.
export const COMMENT = 'DNS-AID. Managed by hausfold/hausfold.co scripts/dns-aid.mjs; a hand edit is reverted on push.';

export function desiredRecords() {
  const mcp = new URL(MCP_TRANSPORTS.hausfold.url);
  const card = `${mcp.origin}/.well-known/mcp/server-card.json`;
  return [
    {
      name: `_index._agents.${ZONE}`,
      type: 'SVCB',
      ttl: TTL,
      priority: 1,
      target: ZONE,
      // The index is fetched over plain HTTPS, so the alpn is the transport,
      // not an agent protocol.
      params: { mandatory: 'alpn,port', alpn: 'h2', port: '443', [KEY.wellKnown]: 'ard.json' },
    },
    {
      name: `_mcp._agents.${ZONE}`,
      type: 'SVCB',
      ttl: TTL,
      priority: 1,
      target: mcp.hostname,
      // One agent protocol per record (draft §3.1.1), spelled bare the way the
      // reference implementation and the scanners read it. `cap` carries the
      // capability document as a full URL for consumers that read only the
      // locator; `well-known` is the same document as a suffix.
      params: {
        mandatory: 'alpn,port',
        alpn: 'mcp',
        port: '443',
        [KEY.cap]: card,
        [KEY.wellKnown]: wellKnownSuffix(card),
      },
    },
  ];
}

// Every `well-known` value is a suffix under /.well-known/ on the record's
// target (draft Figure 1: `well-known=agent-card.json`), never a full path, so
// the two records read the same way and dns-aid-core's catalog pointer, which
// fetches https://<target>/.well-known/<value>, resolves the index.
export const wellKnownUrl = (r) => `https://${r.target}/.well-known/${r.params[KEY.wellKnown]}`;
function wellKnownSuffix(url) {
  const path = new URL(url).pathname;
  if (!path.startsWith('/.well-known/')) throw new Error(`${url} is not under /.well-known/`);
  return path.slice('/.well-known/'.length);
}

// RFC 9460 §14.3.2 registered keys, so a record prints in wire order.
const KEY_NUMBERS = {
  mandatory: 0,
  alpn: 1,
  'no-default-alpn': 2,
  port: 3,
  ipv4hint: 4,
  ech: 5,
  ipv6hint: 6,
  dohpath: 7,
  ohttp: 8,
};

export function keyNumber(key) {
  if (key in KEY_NUMBERS) return KEY_NUMBERS[key];
  const m = /^key(\d{1,5})$/.exec(key);
  if (!m) throw new Error(`unknown SvcParamKey '${key}': an unregistered key is spelled keyNNNNN`);
  return Number(m[1]);
}

const host = (name) => String(name ?? '').toLowerCase().replace(/\.$/, '');
const escapeValue = (v) => v.replace(/(["\\])/g, '\\$1');

// Entries in wire order (RFC 9460 §2.2). Publishing is strict: a key name the
// wire format cannot carry is refused here rather than sent. Comparing is not:
// a record already in the zone may carry a name this table never learned, and
// that is a record to report, not a plan to crash.
const wireOrder = (params, { strict = true } = {}) =>
  Object.entries(params)
    .map(([k, v]) => {
      try {
        return [k, v, keyNumber(k)];
      } catch (e) {
        if (strict) throw e;
        return [k, v, Infinity];
      }
    })
    .sort((a, b) => a[2] - b[2])
    .map(([k, v]) => [k, v]);

// Every value quoted: the form dns-aid-core verified against the Cloudflare API.
export function svcParamsText(params) {
  return wireOrder(params)
    .map(([k, v]) => (v === '' ? k : `${k}="${escapeValue(v)}"`))
    .join(' ');
}

export function parseSvcParams(text) {
  const params = {};
  const re = /([A-Za-z0-9-]+)(?:=("(?:[^"\\]|\\.)*"|[^\s"]*))?/g;
  let m;
  while ((m = re.exec(text ?? ''))) {
    let v = m[2] ?? '';
    if (v.startsWith('"')) v = v.slice(1, -1).replace(/\\(.)/g, '$1');
    params[m[1]] = v;
  }
  return params;
}

export function presentation(r) {
  return `${r.name}. ${r.ttl} IN ${r.type} ${r.priority} ${r.target}. ${svcParamsText(r.params)}`;
}

// The comparable shape of a record's params: wire order, `mandatory` as a
// sorted set (its order carries nothing), everything else verbatim.
export function canonical(params) {
  return Object.fromEntries(
    wireOrder(params, { strict: false }).map(([k, v]) => [
      k,
      k === 'mandatory' ? v.split(',').map((s) => s.trim()).sort().join(',') : v,
    ]),
  );
}

export function sameData(want, have) {
  return (
    want.type === have.type &&
    host(want.name) === host(have.name) &&
    Number(want.priority) === Number(have.priority) &&
    host(want.target) === host(have.target) &&
    JSON.stringify(canonical(want.params)) === JSON.stringify(canonical(have.params))
  );
}

export const same = (want, have) => sameData(want, have) && Number(want.ttl) === Number(have.ttl);

export const inScope = (name) => host(name) === `_agents.${ZONE}` || host(name).endsWith(`._agents.${ZONE}`);

// "1 hausfold.co. alpn=mcp port=443 ..." → the parts, as DoH and Cloudflare's
// formatted `content` both print a service binding.
export function parseRdata(text) {
  const m = /^\s*(\d+)\s+(\S+)\s*(.*)$/s.exec(text ?? '');
  if (!m) throw new Error(`not a service binding: ${text}`);
  return { priority: Number(m[1]), target: m[2], params: parseSvcParams(m[3]) };
}

// A Cloudflare API record → the shape plan() compares. A record of any other
// type under _agents (a TXT, say) is carried with its content so the plan can
// name what it deletes.
export function fromApi(rec) {
  const base = { id: rec.id, type: rec.type, name: rec.name, ttl: rec.ttl, content: rec.content };
  if (rec.type !== 'SVCB' && rec.type !== 'HTTPS') return { ...base, priority: 0, target: '', params: {} };
  if (rec.data && rec.data.target !== undefined) {
    return {
      ...base,
      priority: Number(rec.data.priority),
      target: rec.data.target,
      params: parseSvcParams(rec.data.value ?? ''),
    };
  }
  return { ...base, ...parseRdata(rec.content) };
}

export function toApi(r) {
  return {
    type: r.type,
    name: r.name,
    ttl: r.ttl,
    comment: COMMENT,
    data: { priority: r.priority, target: `${r.target}.`, value: svcParamsText(r.params) },
  };
}

export function plan(existing, desired = desiredRecords()) {
  const scoped = existing.filter((r) => inScope(r.name));
  const out = { create: [], update: [], delete: [], keep: [] };
  const claimed = new Set();
  for (const want of desired) {
    if (!inScope(want.name)) throw new Error(`${want.name} is outside _agents.${ZONE}`);
    const candidates = scoped.filter((r) => r.type === want.type && host(r.name) === host(want.name));
    const match = candidates.find((r) => same(want, r));
    if (match) {
      claimed.add(match.id);
      out.keep.push({ record: want, id: match.id });
      continue;
    }
    if (candidates.length) {
      claimed.add(candidates[0].id);
      out.update.push({ record: want, id: candidates[0].id, was: candidates[0] });
    } else {
      out.create.push({ record: want });
    }
  }
  for (const r of scoped) if (!claimed.has(r.id)) out.delete.push({ id: r.id, was: r });
  for (const d of out.delete) {
    if (!inScope(d.was.name)) throw new Error(`refusing to delete ${d.was.name}: outside _agents.${ZONE}`);
  }
  return out;
}

export const drift = (p) => p.create.length + p.update.length + p.delete.length;

// ---------------------------------------------------------------- Cloudflare

async function cf(path, init = {}, env = process.env) {
  const token = env.CLOUDFLARE_API_TOKEN;
  const zone = env.CLOUDFLARE_ZONE_ID;
  if (!token || !zone) throw new Error('CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID are required');
  const res = await fetch(`${API}/zones/${zone}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...(init.headers ?? {}) },
  });
  let body = {};
  try {
    body = await res.json();
  } catch {
    // a non-JSON body is described by the status alone
  }
  const errors = (body.errors ?? []).map((e) => `${e.code}: ${e.message}`).join('; ') || `HTTP ${res.status}`;
  const summary = `${init.method ?? 'GET'} ${path} → ${errors}`;
  if (res.status === 401 || res.status === 403) throw Object.assign(new Error(summary), { forbidden: true });
  if (!res.ok || body.success === false) throw new Error(summary);
  return body;
}

export async function listExisting(env) {
  const suffix = encodeURIComponent(`_agents.${ZONE}`);
  const body = await cf(`/dns_records?per_page=500&name.endswith=${suffix}`, {}, env);
  return body.result.map(fromApi).filter((r) => inScope(r.name));
}

export async function apply(p, env) {
  for (const { record } of p.create) {
    await cf('/dns_records', { method: 'POST', body: JSON.stringify(toApi(record)) }, env);
  }
  for (const { record, id } of p.update) {
    await cf(`/dns_records/${id}`, { method: 'PUT', body: JSON.stringify(toApi(record)) }, env);
  }
  for (const { id } of p.delete) {
    await cf(`/dns_records/${id}`, { method: 'DELETE' }, env);
  }
}

export const ENABLE_DNSSEC_HOWTO =
  'Enable it once by hand (dashboard → hausfold.co → DNS → Settings → Enable DNSSEC; ' +
  'Cloudflare Registrar adds the DS record itself), or give the deploy token ' +
  'Zone → Zone Settings → Edit and re-run dns.yml.';
export const NEEDS_ZONE_SETTINGS = `the token cannot manage DNSSEC. ${ENABLE_DNSSEC_HOWTO}`;

// Enable DNSSEC if the token may; otherwise say what would. Returns the zone's
// DNSSEC object (`status` is active | pending | disabled) or a note.
export async function ensureDnssec(env) {
  let current;
  try {
    current = (await cf('/dnssec', {}, env)).result;
  } catch (e) {
    if (e.forbidden) return { status: 'unknown', note: NEEDS_ZONE_SETTINGS };
    throw e;
  }
  if (current.status === 'active' || current.status === 'pending') return current;
  try {
    return (await cf('/dnssec', { method: 'PATCH', body: JSON.stringify({ status: 'active' }) }, env)).result;
  } catch (e) {
    if (e.forbidden) return { ...current, note: NEEDS_ZONE_SETTINGS };
    throw e;
  }
}

// ----------------------------------------------------------------------- DoH

export async function doh(name, type) {
  const res = await fetch(`${DOH}?name=${encodeURIComponent(name)}&type=${type}&do=1`, {
    headers: { accept: 'application/dns-json' },
  });
  if (!res.ok) throw new Error(`DoH ${type} ${name}: HTTP ${res.status}`);
  return res.json();
}

// What a validating resolver says: each record answered as published, the AD
// flag on the answer, and a DS at the parent (the zone is signed at all).
export async function verify(desired = desiredRecords()) {
  const records = [];
  for (const want of desired) {
    const answer = await doh(want.name, want.type);
    const bindings = (answer.Answer ?? [])
      .filter((a) => a.type === SVCB_TYPE || a.type === HTTPS_TYPE)
      .map((a) => ({ ...parseRdata(a.data), type: want.type, name: want.name }));
    records.push({
      record: want,
      found: bindings.length > 0,
      matches: bindings.some((b) => sameData(want, b)),
      ad: answer.AD === true,
      status: answer.Status,
    });
  }
  const ds = await doh(ZONE, 'DS');
  return { records, signed: (ds.Answer ?? []).some((a) => a.type === 43) };
}

// ----------------------------------------------------------------------- CLI

const warn = (m) => console.log(process.env.GITHUB_ACTIONS ? `::warning::${m}` : `warning: ${m}`);

function printPlan(p) {
  for (const { record } of p.keep) console.log(`= ${presentation(record)}`);
  for (const { record } of p.create) console.log(`+ ${presentation(record)}`);
  for (const { record, was } of p.update) {
    console.log(`~ ${presentation(record)}`);
    console.log(`  was ${was.priority} ${was.target} ${svcParamsText(was.params)} (ttl ${was.ttl})`);
  }
  for (const { was } of p.delete) {
    const rdata =
      was.type === 'SVCB' || was.type === 'HTTPS'
        ? `${was.priority} ${was.target} ${wireOrder(was.params, { strict: false })
            .map(([k, v]) => (v === '' ? k : `${k}=${JSON.stringify(v)}`))
            .join(' ')}`
        : (was.content ?? '');
    console.log(`- ${was.name}. ${was.ttl} IN ${was.type} ${rdata}`);
  }
}

function reportDnssec(d) {
  if (d.note) {
    console.log(`DNSSEC: ${d.status}`);
    warn(`DNSSEC is not managed by this run: ${d.note}`);
    return;
  }
  console.log(`DNSSEC: ${d.status}${d.ds ? ` (DS: ${d.ds})` : ''}`);
  if (d.status === 'pending') {
    console.log('  pending until the DS record is at the registry; Cloudflare Registrar adds it itself.');
  }
}

async function main(argv) {
  const flags = new Set(argv);
  const desired = desiredRecords();

  if (flags.has('--print')) {
    for (const r of desired) console.log(presentation(r));
    return 0;
  }

  if (flags.has('--verify')) {
    const v = await verify(desired);
    let missing = 0;
    for (const r of v.records) {
      const state = r.matches ? 'as published' : r.found ? 'DIFFERS from the table' : 'not answered';
      console.log(`${r.matches ? 'ok ' : 'MISSING'} ${r.record.name} ${r.record.type}: ${state}, AD=${r.ad}`);
      if (!r.matches) missing += 1;
    }
    console.log(`DS at the parent: ${v.signed ? 'yes' : 'no'}`);
    if (!v.signed) {
      warn(`${ZONE} is not DNSSEC-signed, so the records are not authenticated data yet. ${ENABLE_DNSSEC_HOWTO}`);
    } else if (v.records.some((r) => r.matches && !r.ad)) {
      warn('the zone has a DS but the answers came back without AD; a validating resolver has not caught up yet.');
    }
    return missing ? 1 : 0;
  }

  const existing = await listExisting();
  const p = plan(existing, desired);
  printPlan(p);
  const changes = drift(p);

  if (flags.has('--check')) {
    console.log(changes ? `${changes} change(s) between the table and the zone` : 'the zone matches the table');
    return changes ? 1 : 0;
  }

  await apply(p);
  console.log(changes ? `applied ${changes} change(s)` : 'nothing to change');
  if (flags.has('--dnssec')) reportDnssec(await ensureDnssec());
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e) => {
      console.error(process.env.GITHUB_ACTIONS ? `::error::${e.message}` : e.message);
      process.exit(2);
    },
  );
}
