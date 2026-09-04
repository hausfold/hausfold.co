// hausfold.co — one Worker in front of the static export.
//
//   /<desktop>.sh       → PROXIES haus's bootstrap.sh as text/plain with that
//                         desktop pinned, so the install one-liner is exactly:
//                             curl -fsSL https://hausfold.co/minimal.sh | bash
//                         `/haus.sh` is the same script with nothing pinned,
//                         for someone who hasn't chosen yet and wants asking
//   /download/<app>     → 302 to the latest GitHub release's macOS artifact,
//                         so the product pages (and curl) get a stable URL while
//                         GitHub keeps hosting bytes and counting downloads
//   /api/release/<app>  → tiny JSON (tag, asset, size, publishedAt) for
//                         labelling a download button with the real version
//                         instead of one hardcoded to go stale. ⚠️ Nothing on
//                         this site calls it yet — it is here so the landing
//                         pages have it when they become Next routes.
//   /mcp                → the Model Context Protocol endpoint (Streamable
//                         HTTP): search the docs, get release metadata, get
//                         an install command. See the block above serveMcp().
//   /mcp/docs           → the docs-only MCP transport: search_docs alone, so
//                         an agent that only reads can subscribe to a tool
//                         list that says so. Same implementation, one tool.
//   /mcp.json           → the agent-plugins.org manifest naming both MCP
//                         transports, so a manifest probe finds them without
//                         reading the docs first
//   /.well-known/mcp.json
//                       → the same pair in the flat well-known shape (a
//                         top-level url + transport, then `servers`), which
//                         is what a scanner probing that path parses. Note
//                         the suffix: /.well-known/mcp is the transport
//   /.well-known/oauth-protected-resource
//                       → RFC 9728 Protected Resource Metadata. The resource
//                         is public, so authorization_servers is empty and no
//                         scopes are required; the document exists so the URL
//                         auth.md names resolves instead of 404ing an agent
//                         mid-discovery
//   /.well-known/http-message-signatures-directory
//                       → the Web Bot Auth directory: the Ed25519 keys this
//                         host signs responses with. It signs none, so the
//                         keys array is empty — an honest directory, not a
//                         fabricated key
//   /.well-known/mcp/server-card.json
//                       → the MCP server card (SEP-2127 shape), derived from
//                         the same MCP_TOOLS table the /mcp endpoint serves,
//                         so the two cannot drift; /mcp/server-card serves
//                         the same document at the draft's recommended spot
//   /v1/*               → the versioned REST surface (search with cursor
//                         pagination, batch, async jobs, releases, desktops,
//                         apps): RFC 9457 problem+json errors, RateLimit
//                         headers, Idempotency-Key on the batch POST
//   /ask                → NLWeb-style natural-language endpoint over the
//                         docs search, JSON or SSE streaming
//   /design.md          → PROXIES the workshop's docs/design.md — the
//                         family's visual standard as one public URL any
//                         coding agent can load before drawing something
//                         that carries the brand
//   agent view          → one markdown page (endpoints, auth (none), when-to-use)
//                         for machines that ask for it by name: ?mode=agent on
//                         /, /index.md, /agent.txt (the spelling a discovery
//                         probe looks for agent instructions under),
//                         Accept: text/markdown, or an AI-bot User-Agent. /docs/<path>.md serves each docs page's
//                         markdown twin, and /.well-known/ carries the agent
//                         surfaces: agent-card.json (A2A), agent-skills/index.json,
//                         api-catalog (RFC 9727), and /mcp again.
//   everything else     → the static export in ./out (the [assets] binding)
//
// Two things about the shape, and both are decisions:
//
//   - The installer is named after the desktop you are installing —
//     `hausfold.co/minimal.sh`. hausfold.co is the platform's door, not one
//     desktop's, so there is deliberately no single `/init.sh`.
//   - The resolution table is data. A desktop is a row, not a route. What
//     happens when a desktop lives in a repo we don't own is deliberately
//     deferred, but the row already has a `repo` field for it.
//
// 🚨 **`?ref=` and a desktop name have to agree.** This Worker serves
// `bootstrap.sh` from the desktop repo's latest RELEASE TAG, not from main, so
// `/hacker.sh?ref=<pre-2026-08-16 tag>` hands `hacker` to a script released
// before that name existed and dies with "unknown desktop" — the worst shape
// of failure an install command has. `?ref=` is a tag-level escape hatch we
// don't publish, so this is accepted rather than overlooked. The one case to
// remember is a **yanked release** — if `v2026.08.16` were deleted,
// `releases/latest` falls back to a tag that doesn't know `hacker` and every
// `/hacker.sh` install breaks. Don't yank it; supersede it.
//
// `/haus.sh` is the front door, and it pins nothing on purpose: the name is
// the point when you know it, and the question is the point when you don't.
//
import {
  DESKTOPS,
  DOWNLOADABLE,
  MCP_TOOLS,
  DOCS_MCP_TOOLS,
  MCP_PROTOCOL_VERSION,
  PROTECTED_RESOURCE,
  SIGNATURE_DIRECTORY,
} from "./worker-config.js";
import { rateLimit, problemResponse, PROBLEM_CONTENT_TYPE } from "./worker-api.js";

// The desktops table and the downloadable-apps set live in worker-config.js,
// beside their comment blocks: workerd refuses named exports from worker.js
// that aren't handlers, and the tests need to import the same values.

// We PROXY (fetch), not redirect, so the pretty URL is what curl sees and
// there's no hop to a raw.githubusercontent.com link. By default the script is
// served from the latest GitHub *release* tag of the desktop's repo (cached
// ~1h to stay well under GitHub's unauthenticated API limit), falling back to
// `main` before the first release. `?ref=v2026.07.18` pins an exact ref; a REF
// wrangler var hard-pins one for everybody.

// 🚨 What a VISITOR may pin with `?ref=`, and it is deliberately much narrower
// than SAFE_REF: a release tag, `v<date>` or `v<date>-N`, which is the only
// form the docs have ever shown.
//
// SAFE_REF alone is not enough here, and the reason is not path traversal —
// that one it does stop. It is that a 40-hex commit SHA passes it, and
// raw.githubusercontent.com serves any object in a public repo's **fork
// network**, including commits on no branch at all (measured: the head commit
// of a merged PR whose branch GitHub deleted still returns 200). haus is
// public, so anyone can put an object in that network with a fork PR and then
// hand out `curl -fsSL 'https://hausfold.co/hacker.sh?ref=<sha>' | bash` —
// our domain, our TLS, no visible redirect, their script. A tag is the one
// ref shape only the repo's own maintainers can create.
//
// The deploy-time REF var stays on SAFE_REF on purpose: that one is set by
// whoever deploys the Worker, not by whoever clicks a link, and pinning a
// branch during an incident is exactly what it is for. A desktop repo that
// versions differently one day wants its own pattern in the table row, not a
// loosening of this.
const RELEASE_TAG = /^v\d{4}\.\d{2}\.\d{2}(-\d+)?$/;

// A desktop name we are willing to write into the served script. The values
// in DESKTOPS are ours, not a visitor's, so this is belt-and-braces rather
// than a boundary — but the one thing that must never happen here is a
// newline or a shell metacharacter reaching a line of bash we generate.
const SAFE_DESKTOP = /^[a-z][a-z0-9-]*$/;

const BOOTSTRAP = "bootstrap.sh";
const SAFE_REF = /^[A-Za-z0-9._-]+$/; // no slashes / dots-dots -> no path traversal

// The apps with signed + notarized release artifacts are DOWNLOADABLE in
// worker-config.js.

// Short domains: one hostname that stands for one page, and 301s to it.
//
// `perch.hausfold.co` is a URL to hand someone — the thing you text a friend
// who wants perch on their Mac and their phone — and it is deliberately a
// REDIRECT rather than a page of its own. AGENTS.md's rule is that a page a
// docs tree also covers does not stay in step with it, which is why /perch,
// /pounce, /haus and the three desktop sheets were all retired into docs
// trees. A subdomain SERVING its own setup sheet would be exactly that mistake
// wearing a nicer URL: /docs/perch/install already carries every fact such a
// page would state. A redirect is the same short URL with nothing to drift.
//
// Every other path on a short domain 301s to the same path on hausfold.co, so
// the subdomain can never quietly become a second copy of the site.
//
// ⚠️ This only runs because `run_worker_first = true` is set in wrangler.toml.
// Without it the assets binding short-circuits `perch.hausfold.co/` to
// `out/index.html` — the landing page under the wrong hostname — and the
// Worker never sees the request.
//
// 🚨 It must be `true` and never an array. An array is an ALLOWLIST: every path
// outside it is answered by the asset server, including its 404 page, so the
// Worker's OWN routes stop being reached. `["/"]` shipped for one deploy on
// 2026-08-26 and 404'd `/haus.sh`, `/hacker.sh`, `/minimal.sh`, `/everyday.sh`,
// `/download/*` and `/api/release/*` simultaneously. The full note is in
// wrangler.toml; the guard is worker.yml's grep for the literal
// `run_worker_first = true`, because the tests in this repo pass under either
// value and deploy.yml's live smoke check is answered with a Cloudflare
// challenge from a GitHub runner often enough not to be relied on.
const SHORT_DOMAINS = { "perch.hausfold.co": "/docs/perch/install/" };
// The human-facing artifact, most-preferred first. A DMG outranks the archive
// on purpose: pounce's release ships BOTH — the tarball is the Homebrew
// formula's artifact (app + CLI scripts, brew wires the daemon), the DMG is the
// drag-to-Applications one (self-contained app, login item self-registers on
// first open). Handing a human the tarball is how you strand them with a
// half-installed palette.
const MACOS_DMG = /-macos\.dmg$/;
const MACOS_ASSET = /-macos\.(zip|tar\.gz)$/;

const text = (body, status = 200, extra = {}) =>
  new Response(body, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", ...extra },
  });

async function latestRef(repo, env) {
  if (env.REF) return env.REF; // deploy-time hard pin wins
  const cache = caches.default;
  const key = new Request(`https://hausfold.co/__latest_release/${repo}`);
  const cached = await cache.match(key);
  if (cached) return (await cached.text()).trim();
  try {
    const r = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: { "user-agent": "hausfold-init", accept: "application/vnd.github+json" },
    });
    if (r.ok) {
      const tag = (await r.json()).tag_name;
      if (tag && SAFE_REF.test(tag)) {
        // Cache for an hour so we make ~1 API call per colo per hour.
        await cache.put(key, new Response(tag, { headers: { "cache-control": "max-age=3600" } }));
        return tag;
      }
    }
  } catch (_) {
    /* network / API hiccup — fall through to main */
  }
  return "main";
}

// Latest-release lookup for a family app, cached ~1h per colo like latestRef —
// one shape serves both the redirect and the JSON endpoint.
async function latestAppRelease(app) {
  const cache = caches.default;
  const key = new Request(`https://hausfold.co/__release/${app}`);
  const cached = await cache.match(key);
  if (cached) return cached.json();
  try {
    const r = await fetch(`https://api.github.com/repos/hausfold/${app}/releases/latest`, {
      headers: { "user-agent": "hausfold-download", accept: "application/vnd.github+json" },
    });
    if (r.ok) {
      const release = await r.json();
      // Only a macOS artifact counts. The port this came from fell back to
      // `assets[0]`, which on a release that shipped no `-macos.*` would hand
      // a human `checksums.txt` and call it the download. No release is shaped
      // that way today; falling through to the releases page is the answer
      // that stays right if one ever is.
      const asset =
        release.assets?.find((a) => MACOS_DMG.test(a.name)) ??
        release.assets?.find((a) => MACOS_ASSET.test(a.name));
      if (release.tag_name && asset) {
        const meta = {
          tag: release.tag_name,
          asset: asset.name,
          size: asset.size,
          url: asset.browser_download_url,
          publishedAt: release.published_at,
        };
        await cache.put(
          key,
          new Response(JSON.stringify(meta), {
            headers: { "content-type": "application/json", "cache-control": "max-age=3600" },
          }),
        );
        return meta;
      }
    }
  } catch (_) {
    /* network / API hiccup — caller falls back to the releases page */
  }
  return null;
}

async function serveDownload(app) {
  const release = await latestAppRelease(app);
  // Even on an API hiccup the user still lands somewhere useful.
  const target = release?.url ?? `https://github.com/hausfold/${app}/releases/latest`;
  return new Response(null, {
    status: 302,
    headers: { location: target, "cache-control": "public, max-age=300" },
  });
}

async function serveReleaseMeta(app, extraHeaders = {}) {
  const release = await latestAppRelease(app);
  if (!release) {
    // An upstream failure is a machine's problem too: it gets problem+json,
    // not a bare `{}` with a 502, so an agent can branch on `code`.
    return new Response(
      JSON.stringify({
        type: "https://hausfold.co/openapi.json#/components/schemas/problem",
        title: "Upstream release lookup failed",
        status: 502,
        detail: "GitHub's release API could not be reached. Retry later.",
        code: "upstream_unavailable",
      }),
      { status: 502, headers: { "content-type": PROBLEM_CONTENT_TYPE, ...extraHeaders } },
    );
  }
  return new Response(JSON.stringify(release), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=300",
      ...extraHeaders,
    },
  });
}

// ---------------------------------------------------------------------------
// /mcp — the Model Context Protocol endpoint, so coding agents can drive this
// site as tools instead of scraping HTML. Every tool reads public, already
// unauthenticated data: nothing here widens what a curl could get.
//
// Transport is Streamable HTTP: POST JSON-RPC 2.0, JSON back. Three decisions,
// each deliberate:
//
//   - Stateless. No `mcp-session-id` is issued, and GET opens no SSE stream
//     (it 405s, which the transport requires of a server with nothing to
//     push). Every request stands alone, so any client that can POST can
//     connect.
//   - CORS is open. The data behind every tool is public; the only callers
//     CORS actually enables are browser-resident agents (WebMCP, custom UIs),
//     which are exactly the callers we want. There is nothing to authorize.
//   - `search_docs` scores the same Orama index `/api/search` serves, by hand
//     rather than by importing Orama. The index's documents are plain text
//     sections with breadcrumbs, so a term count with a breadcrumb boost is
//     enough to rank them, and hand-rolling keeps the Worker bundle
//     dependency-free. The parsed index is cached per assets binding (a
//     WeakMap key), so an isolate fetches the ~2 MB index once, not per tool
//     call.
//
// The tool table is pinned against public/openapi.json by
// test/openapi.test.js: a tool added to one and not the other should be a
// red test, not a missing row in some agent's menu.

const MCP_SUPPORTED_PROTOCOLS = new Set(["2025-03-26", "2025-06-18"]);

// Who this server says it is, in one place. `initialize` returns it as
// serverInfo and the server card copies it whole, so a client reconciling
// the card against a live connection can never be shown two servers.
const MCP_SERVER_INFO = { name: "hausfold.co", title: "hausfold", version: "1.0.0" };

// The two transports, in one place. The server card, /mcp.json and
// /.well-known/mcp.json all read this, so a URL or a description can only be
// wrong in one spelling if it is wrong in every spelling. The keys are the
// names /mcp.json publishes, and `hausfold` is the full server: a client
// handed nothing else should open that one.
const MCP_TRANSPORTS = {
  hausfold: {
    url: "https://hausfold.co/mcp",
    description:
      "Install commands, release metadata and docs search for hausfold's Mac software.",
  },
  "hausfold-docs": {
    url: "https://hausfold.co/mcp/docs",
    description: "Full-text search of the hausfold documentation alone.",
  },
};

const MCP_CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers":
    "content-type, authorization, mcp-protocol-version, mcp-session-id, last-event-id",
  "access-control-expose-headers": "mcp-protocol-version",
};

// The tool table itself (MCP_TOOLS) lives in worker-config.js, derived from
// DESKTOPS/DOWNLOADABLE so a new row reaches agents without a second edit.

// Parsed sections of the search index, keyed by env.ASSETS so each isolate
// caches once and each test's stub cache stays separate.
const DOCS_CACHE = new WeakMap();

async function docsSections(env) {
  const assets = env?.ASSETS;
  if (!assets) return null;
  if (DOCS_CACHE.has(assets)) return DOCS_CACHE.get(assets);
  const res = await assets.fetch(new Request("https://hausfold.co/api/search"));
  if (!res.ok) return null;
  const index = await res.json();
  const sections = Object.values(index.docs?.docs ?? {});
  DOCS_CACHE.set(assets, sections);
  return sections;
}

// An excerpt around the first match. The `…` pairs and the 80-char lead-in
// are presentation for a model: enough context to know whether the hit is
// the paragraph it wants, short enough that eight results stay readable.
function excerpt(content, idx) {
  if (idx < 0) return content.slice(0, 200) + (content.length > 200 ? "…" : "");
  const start = Math.max(0, idx - 80);
  const slice = content.slice(start, start + 220).trim();
  return (start > 0 ? "…" : "") + slice + (start + 220 < content.length ? "…" : "");
}

function searchDocsScored(sections, query) {
  // Term count + a breadcrumb boost: crude next to Orama's BM25, but the
  // corpus is ~3800 short sections and the query is usually one or two
  // domain words, which is the case this is tuned for. Returns the whole
  // scored, sorted list; the excerpt (the only expensive half) is made
  // per result by whoever slices.
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
  const scored = [];
  if (!terms.length) return scored;
  for (const doc of sections) {
    const content = doc.content ?? "";
    const lower = content.toLowerCase();
    let score = 0;
    let first = -1;
    for (const term of terms) {
      let count = 0;
      let idx = lower.indexOf(term);
      if (idx === -1) continue;
      while (idx !== -1 && count < 20) {
        count++;
        idx = lower.indexOf(term, idx + term.length);
      }
      score += count;
      if ((doc.breadcrumbs ?? []).join(" ").toLowerCase().includes(term)) score += 3;
      if (first === -1) first = lower.indexOf(terms[0]);
    }
    if (score > 0) scored.push({ doc, score, idx: first });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

const toHit = ({ doc, score, idx }) => ({
  url: doc.url,
  breadcrumbs: doc.breadcrumbs ?? [],
  excerpt: excerpt(doc.content ?? "", idx),
  score,
});

function searchDocs(sections, query, limit) {
  return searchDocsScored(sections, query)
    .slice(0, limit)
    .map(toHit);
}

function toolResult(data, isError = false) {
  const result = {
    content: [
      {
        type: "text",
        text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
  if (isError) result.isError = true;
  return result;
}

// A tool-level failure returns a structured payload — a machine-readable
// code beside the message, in both the text block and structuredContent —
// so an agent can branch on `code` instead of pattern-matching prose. The
// isError flag stays set, which is what the MCP spec asks of tool errors;
// the JSON shape inside is what makes the failure actionable.
const toolError = (code, message) => ({
  content: [{ type: "text", text: JSON.stringify({ error: { code, message } }) }],
  structuredContent: { error: { code, message } },
  isError: true,
});

async function callTool(name, args, env) {
  switch (name) {
    case "get_install_command": {
      const desktop = args.desktop;
      if (desktop == null) {
        return toolResult(
          Object.entries(DESKTOPS).map(([key, { pin }]) => ({
            desktop: key,
            command: `curl -fsSL https://hausfold.co/${key}.sh | bash`,
            pins: pin ?? null,
            note: pin
              ? `installs the '${pin}' desktop by URL`
              : "installs the layer and asks which desktop to build",
          })),
        );
      }
      if (!Object.hasOwn(DESKTOPS, desktop)) {
        return toolError(
          "unknown_desktop",
          `unknown desktop '${desktop}'. Available: ${Object.keys(DESKTOPS).join(", ")}`,
        );
      }
      const { pin } = DESKTOPS[desktop];
      return toolResult({
        desktop,
        command: `curl -fsSL https://hausfold.co/${desktop}.sh | bash`,
        pins: pin ?? null,
      });
    }
    case "get_latest_release": {
      const app = args.app;
      if (!DOWNLOADABLE.has(app)) {
        return toolError(
          "unknown_app",
          `unknown app '${app}'. Available: ${[...DOWNLOADABLE].join(", ")}`,
        );
      }
      const release = await latestAppRelease(app);
      if (!release) {
        return toolError("release_unavailable", `no macOS release found for '${app}'`);
      }
      return toolResult(release);
    }
    case "search_docs": {
      const query = args.query;
      if (typeof query !== "string" || !query.trim()) {
        return toolError("invalid_query", "'query' must be a non-empty string");
      }
      const sections = await docsSections(env);
      if (!sections) {
        return toolError("index_unavailable", "docs index unavailable");
      }
      const limit = Number.isInteger(args.limit) ? Math.min(Math.max(args.limit, 1), 20) : 8;
      return toolResult({ query, results: searchDocs(sections, query, limit) });
    }
    default:
      return toolError("unknown_tool", `unknown tool '${name}'`);
  }
}

const jsonRpc = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "mcp-protocol-version": MCP_PROTOCOL_VERSION,
      ...MCP_CORS,
    },
  });

const rpcResult = (id, result) => ({ jsonrpc: "2.0", id, result });
const rpcError = (id, code, message) => ({
  jsonrpc: "2.0",
  id: id ?? null,
  error: { code, message },
});
const rpcErrorResponse = (id, code, message, status = 200) =>
  jsonRpc(rpcError(id, code, message), status);

async function handleRpc(msg, env, table) {
  switch (msg.method) {
    case "initialize": {
      // Echo the client's protocol version when we know it; advertise ours
      // otherwise. A server never invents a version the client didn't offer.
      const requested = msg.params?.protocolVersion;
      const protocolVersion =
        requested && MCP_SUPPORTED_PROTOCOLS.has(requested) ? requested : MCP_PROTOCOL_VERSION;
      return rpcResult(msg.id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: MCP_SERVER_INFO,
        instructions:
          "Public, unauthenticated surface for hausfold's Mac software: install commands, " +
          "release metadata, and full-text docs search. No keys, nothing to buy. " +
          "A docs-only transport that serves search_docs alone runs at /mcp/docs; both " +
          "servers are listed at https://hausfold.co/mcp.json (agent-plugins.org shape) " +
          "and https://hausfold.co/.well-known/mcp.json (flat shape).",
      });
    }
    case "ping":
      return rpcResult(msg.id, {});
    case "tools/list":
      return rpcResult(msg.id, { tools: table.tools });
    case "tools/call": {
      const { name, arguments: args = {} } = msg.params ?? {};
      if (typeof name !== "string") {
        return rpcError(msg.id, -32602, "tools/call requires a tool name");
      }
      if (!table.allowed.has(name)) {
        // A tool another transport serves is still "unknown" here, with a
        // pointer at the transport that does serve it.
        return rpcError(
          msg.id,
          -32602,
          `Tool '${name}' is not served on this endpoint. This transport serves: ${[...table.allowed].join(", ")}.`,
        );
      }
      return rpcResult(msg.id, await callTool(name, args, env));
    }
    default:
      return rpcError(msg.id, -32601, `Method not found: ${msg.method}`);
  }
}

// ---------------------------------------------------------------------------
// The MCP server card, served at /mcp/server-card (the SEP-2127 draft's
// recommended spot: the streamable-HTTP URL plus /server-card) and at
// /.well-known/mcp/server-card.json (the path scanners probe). It describes
// the server before any connection is established.
//
// Two things keep it honest. `tools` is the same MCP_TOOLS table /mcp serves,
// so the card and the tool list cannot drift — a tool added to one is a red
// test if it misses the other, and the card is generated, never hand-typed.
// And `name`/`version` are the same `MCP_SERVER_INFO` object `initialize`
// answers with, so the card and a live connection cannot describe two servers.

function serveMcpCard() {
  return new Response(
    JSON.stringify(
      {
        $schema: "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json",
        name: MCP_SERVER_INFO.name,
        title: MCP_SERVER_INFO.title,
        description:
          "Install commands, release metadata and full-text docs search for hausfold's " +
          "Mac software, as MCP tools. Public and unauthenticated; every tool reads " +
          "data a plain GET could also fetch. A docs-only transport serving " +
          "search_docs alone runs at /mcp/docs.",
        version: MCP_SERVER_INFO.version,
        websiteUrl: "https://hausfold.co/developers/",
        serverUrl: MCP_TRANSPORTS.hausfold.url,
        docsServerUrl: MCP_TRANSPORTS["hausfold-docs"].url,
        tools: MCP_TOOLS,
        remotes: Object.values(MCP_TRANSPORTS).map((t) => ({
          type: "streamable-http",
          url: t.url,
          supportedProtocolVersions: [...MCP_SUPPORTED_PROTOCOLS],
        })),
      },
      null,
      2,
    ),
    {
      headers: {
        "content-type": "application/mcp-server-card+json",
        "cache-control": "public, max-age=3600",
        // The card spec's CORS block, not MCP_CORS: this is a GET, not a
        // JSON-RPC endpoint.
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, OPTIONS",
        "access-control-allow-headers": "Content-Type, If-None-Match",
      },
    },
  );
}

// The agent-plugins.org MCP manifest at /mcp.json: the discovery document
// that names both transports and their URLs, so an agent that probes for a
// manifest finds one without reading the docs first. Derived from the same
// module-level tables rather than hand-typed beside them.
function serveMcpManifest() {
  return new Response(
    JSON.stringify(
      {
        $schema: "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
        mcpServers: Object.fromEntries(
          Object.entries(MCP_TRANSPORTS).map(([name, t]) => [
            name,
            { type: "streamable-http", url: t.url, description: t.description },
          ]),
        ),
      },
      null,
      2,
    ),
    { headers: { "content-type": "application/json", "cache-control": "public, max-age=300" } },
  );
}

// The same two transports again at /.well-known/mcp.json, flat: a top-level
// `url` and `transport` naming the full server, then `servers` for the pair.
// It is a different document from /mcp.json, not an alias — that one is the
// agent-plugins.org schema, whose `mcpServers` map is shaped like a client
// config file rather than like something read off a URL.
//
// ⚠️ There is no registered schema for this path, which is why the document
// cites none. The shape is the one the hosts already serving /.well-known/
// mcp.json use, and it is deliberately the union of what they read: a client
// that wants one URL takes `url`, one that wants the set walks `servers`.
// Every value comes from MCP_TRANSPORTS, MCP_SERVER_INFO and MCP_TOOLS, the
// tables `initialize`, the server card and /mcp.json also answer from, so no
// two of them can describe different servers.
//
// ⚠️ This is a manifest, not a transport. /.well-known/mcp is the transport
// (POST JSON-RPC; GET is 405, as Streamable HTTP requires), and the two paths
// differ only by the suffix — don't collapse them.
function serveWellKnownMcpManifest() {
  return new Response(
    JSON.stringify(
      {
        name: MCP_SERVER_INFO.name,
        title: MCP_SERVER_INFO.title,
        description:
          "Install commands, release metadata and full-text docs search for hausfold's " +
          "Mac software, as MCP tools. Public and unauthenticated; every tool reads " +
          "data a plain GET could also fetch.",
        version: MCP_SERVER_INFO.version,
        websiteUrl: "https://hausfold.co/developers/",
        url: MCP_TRANSPORTS.hausfold.url,
        transport: "streamable-http",
        authentication: "none",
        capabilities: { tools: true, resources: false, prompts: false },
        servers: Object.entries(MCP_TRANSPORTS).map(([name, t]) => ({
          name,
          url: t.url,
          transport: "streamable-http",
          authentication: "none",
          description: t.description,
        })),
        tools: MCP_TOOLS,
      },
      null,
      2,
    ),
    {
      headers: {
        "content-type": "application/json",
        "cache-control": "public, max-age=300",
        // Same CORS block as the server card: a GET a browser-resident agent
        // may make before it ever opens a transport.
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, OPTIONS",
        "access-control-allow-headers": "Content-Type, If-None-Match",
      },
    },
  );
}

// ---------------------------------------------------------------------------
// /v1 — the versioned REST surface over the same public data /mcp reads.
// A plain JSON API so agents that never adopted MCP still have typed,
// documented, paginated access. Every response carries the RateLimit trio;
// every failure carries RFC 9457 problem+json; the batch POST accepts an
// Idempotency-Key; a too-big batch turns into a 202 job at POST /v1/jobs.
// The deprecation policy it operates under is written in openapi.json's
// info.description: /v1 is path-versioned, a deprecated endpoint answers
// with Deprecation: true and a Sunset date before it goes away.

const jsonResponse = (body, headers = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...headers },
  });

// Opaque offset cursors, base64url of a plain integer. Opaque because agents
// should round-trip them, not mint them — but they are only an offset into a
// result list computed fresh per request, never state we hold.
const encodeCursor = (offset) =>
  btoa(String(offset)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const decodeCursor = (cursor) => {
  if (!cursor) return 0;
  try {
    const n = Number(atob(cursor.replace(/-/g, "+").replace(/_/g, "/")));
    return Number.isInteger(n) && n >= 0 ? n : null;
  } catch (_) {
    return null;
  }
};

const clampLimit = (raw, min, max, fallback) => {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min) return fallback;
  return Math.min(n, max);
};

const paginate = (items, offset, limit) => ({
  results: items.slice(offset, offset + limit),
  next_cursor:
    offset + Math.min(limit, Math.max(0, items.length - offset)) < items.length
      ? encodeCursor(offset + limit)
      : null,
  total: items.length,
});

const searchError = (env, headers) =>
  docsSections(env).then((sections) =>
    sections
      ? null
      : problemResponse(
          503,
          "Docs index unavailable",
          "The search index could not be loaded. Retry later.",
          "index_unavailable",
          headers,
        ),
  );

// --- sandbox ---
// `sandbox=true` (GET) or {"sandbox": true} (batch body) returns
// deterministic sample payloads: no live release lookups against GitHub, no
// dependency on the search index, byte-identical answers every call. It
// exists so an agent can exercise its client against the documented shapes
// without touching anything live. The rate limit still applies — it is edge
// protection, not a data hazard — and nothing on this API is writable, so
// there is no production data for a sandbox to protect; the fixtures exist
// for client validation, not for safety.
const isSandbox = (v) => ["true", "1", "yes"].includes(String(v ?? "").toLowerCase());
const sandboxRelease = (app) => ({
  tag: "v0.0.0-sandbox",
  asset: `${app}-macos-sandbox.dmg`,
  size: 0,
  url: `https://hausfold.co/download/${app}`,
  publishedAt: "1970-01-01T00:00:00.000Z",
  sandbox: true,
});
const sandboxSearch = (query) => ({
  query,
  sandbox: true,
  results: [
    {
      url: "https://hausfold.co/docs/haus/",
      breadcrumbs: ["haus"],
      excerpt:
        "Sandbox result: the real search index was not consulted. Shapes match the " +
        "documented searchResponse schema exactly.",
      score: 1,
    },
  ],
  next_cursor: null,
  total: 1,
});

async function serveV1Search(url, env, H) {
  const q = url.searchParams.get("q");
  if (!q || !q.trim()) {
    return problemResponse(
      400,
      "Missing query",
      "The 'q' query parameter is required and must be non-empty.",
      "missing_query",
      H,
    );
  }
  if (isSandbox(url.searchParams.get("sandbox"))) return jsonResponse(sandboxSearch(q), H);
  const limit = clampLimit(url.searchParams.get("limit"), 1, 50, 10);
  const offset = decodeCursor(url.searchParams.get("cursor"));
  if (offset === null) {
    return problemResponse(
      400,
      "Invalid cursor",
      "The 'cursor' query parameter is not a cursor this API issued. Start over without one.",
      "invalid_cursor",
      H,
    );
  }
  const unavailable = await searchError(env, H);
  if (unavailable) return unavailable;
  const sections = await docsSections(env);
  const scored = searchDocsScored(sections, q);
  const page = scored.slice(offset, offset + limit);
  return jsonResponse(
    {
      query: q,
      results: page.map(toHit),
      next_cursor:
        offset + page.length < scored.length ? encodeCursor(offset + page.length) : null,
      total: scored.length,
    },
    H,
  );
}

function serveV1Desktops(url, H) {
  const limit = clampLimit(url.searchParams.get("limit"), 1, 50, 10);
  const offset = decodeCursor(url.searchParams.get("cursor"));
  if (offset === null) {
    return problemResponse(
      400,
      "Invalid cursor",
      "The 'cursor' query parameter is not a cursor this API issued.",
      "invalid_cursor",
      H,
    );
  }
  const all = Object.entries(DESKTOPS).map(([desktop, { pin }]) => ({
    desktop,
    command: `curl -fsSL https://hausfold.co/${desktop}.sh | bash`,
    pins: pin ?? null,
  }));
  return jsonResponse(paginate(all, offset, limit), H);
}

function serveV1Apps(H) {
  const all = [...DOWNLOADABLE].map((app) => ({
    app,
    repo: `hausfold/${app}`,
    release_metadata: `https://hausfold.co/api/release/${app}`,
    latest_download: `https://hausfold.co/download/${app}`,
  }));
  return jsonResponse(paginate(all, 0, Math.max(all.length, 1)), H);
}

async function serveV1Release(app, H, sandbox = false) {
  if (!DOWNLOADABLE.has(app)) {
    return problemResponse(
      404,
      "Unknown app",
      `'${app}' is not an app with signed macOS releases. Known: ${[...DOWNLOADABLE].join(", ")}.`,
      "unknown_app",
      H,
    );
  }
  if (sandbox) return jsonResponse(sandboxRelease(app), H);
  const release = await latestAppRelease(app);
  if (!release) {
    return problemResponse(
      502,
      "Upstream release lookup failed",
      "GitHub's release API could not be reached. Retry later.",
      "upstream_unavailable",
      H,
    );
  }
  return jsonResponse(release, H);
}

// One operation of a batch or a job. Every op is a read; the batch exists so
// an agent acting across the family (release check for two apps, three doc
// searches) does it in one round trip.
const MAX_BATCH = 20;

async function runOp(op, env, sandbox = false) {
  const opName = op?.op;
  switch (opName) {
    case "search": {
      const query = op.query;
      if (typeof query !== "string" || !query.trim()) {
        return { op: opName, ok: false, error: { status: 400, code: "missing_query" } };
      }
      if (sandbox) {
        const sample = sandboxSearch(query).results[0];
        return { op: opName, ok: true, data: { query, results: [sample] } };
      }
      const sections = await docsSections(env);
      if (!sections) {
        return { op: opName, ok: false, error: { status: 503, code: "index_unavailable" } };
      }
      const limit = Number.isInteger(op.limit) ? Math.min(Math.max(op.limit, 1), 20) : 5;
      return { op: opName, ok: true, data: { query, results: searchDocs(sections, query, limit) } };
    }
    case "release": {
      const app = op.app;
      if (!DOWNLOADABLE.has(app)) {
        return { op: opName, ok: false, error: { status: 404, code: "unknown_app" } };
      }
      if (sandbox) return { op: opName, ok: true, data: sandboxRelease(app) };
      const release = await latestAppRelease(app);
      if (!release) {
        return { op: opName, ok: false, error: { status: 502, code: "upstream_unavailable" } };
      }
      return { op: opName, ok: true, data: release };
    }
    case "install": {
      const desktop = op.desktop;
      if (desktop == null) {
        return {
          op: opName,
          ok: true,
          data: Object.entries(DESKTOPS).map(([key, { pin }]) => ({
            desktop: key,
            command: `curl -fsSL https://hausfold.co/${key}.sh | bash`,
            pins: pin ?? null,
          })),
        };
      }
      if (!Object.hasOwn(DESKTOPS, desktop)) {
        return { op: opName, ok: false, error: { status: 404, code: "unknown_desktop" } };
      }
      const { pin } = DESKTOPS[desktop];
      return {
        op: opName,
        ok: true,
        data: { desktop, command: `curl -fsSL https://hausfold.co/${desktop}.sh | bash`, pins: pin ?? null },
      };
    }
    default:
      return { op: opName ?? null, ok: false, error: { status: 400, code: "unknown_op" } };
  }
}

// The write-shaped reads (batch, job creation) honour Idempotency-Key: the
// first response is cached under the key for 24h and replayed with
// Idempotency-Replayed: true. The API has no side effects to double-apply,
// but agents retry POSTs on network failure and deserve the same guarantee
// they would get from an API that had one.
const SAFE_IDEMPOTENCY_KEY = /^[A-Za-z0-9._-]{1,200}$/;

function idempotencyKey(request) {
  const key = request.headers.get("idempotency-key");
  return key && SAFE_IDEMPOTENCY_KEY.test(key) ? key : null;
}

async function serveBatch(request, env, H) {
  const cache = caches.default;
  const key = idempotencyKey(request);
  if (key) {
    const cached = await cache.match(new Request(`https://hausfold.co/__idempotency/${key}`));
    if (cached) {
      return new Response(await cached.text(), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "idempotency-replayed": "true",
          ...H,
        },
      });
    }
  }
  let body;
  try {
    body = await request.json();
  } catch (_) {
    return problemResponse(400, "Invalid JSON", "The request body is not valid JSON.", "invalid_json", H);
  }
  const ops = body?.operations;
  if (!Array.isArray(ops) || ops.length === 0) {
    return problemResponse(
      400,
      "Invalid batch",
      "Body must be {\"operations\": [...]} with at least one operation of op=search|release|install.",
      "invalid_batch",
      H,
    );
  }
  if (ops.length > MAX_BATCH) {
    return problemResponse(
      400,
      "Batch too large",
      `A batch takes at most ${MAX_BATCH} operations; for more, use POST /v1/jobs and poll.`,
      "batch_too_large",
      H,
    );
  }
  const results = [];
  const sandbox = body?.sandbox === true;
  for (const op of ops) results.push(await runOp(op, env, sandbox));
  const payload = JSON.stringify({ sandbox, results });
  if (key) {
    await cache.put(
      new Request(`https://hausfold.co/__idempotency/${key}`),
      new Response(payload, { headers: { "cache-control": "max-age=86400" } }),
    );
  }
  return new Response(payload, {
    status: 200,
    headers: { "content-type": "application/json", ...H },
  });
}

// Long batches run as jobs: 202 with a Location to poll, the work continued
// under ctx.waitUntil (or inline, where there is no waitUntil to hand it to),
// the result stored in the cache API for an hour. Stateful for the lifetime
// of a job — the only state this Worker keeps anywhere.
async function serveJobCreate(request, env, ctx, H) {
  let body;
  try {
    body = await request.json();
  } catch (_) {
    return problemResponse(400, "Invalid JSON", "The request body is not valid JSON.", "invalid_json", H);
  }
  const ops = body?.operations;
  if (!Array.isArray(ops) || ops.length === 0) {
    return problemResponse(
      400,
      "Invalid job",
      'Body must be {"operations": [...]} with at least one operation of op=search|release|install.',
      "invalid_job",
      H,
    );
  }
  if (ops.length > MAX_BATCH) {
    return problemResponse(
      400,
      "Job too large",
      `A job takes at most ${MAX_BATCH} operations.`,
      "job_too_large",
      H,
    );
  }
  const id = crypto.randomUUID();
  const jobUrl = `https://hausfold.co/__job/${id}`;
  const sandbox = body?.sandbox === true;
  const cache = caches.default;
  await cache.put(
    new Request(jobUrl),
    new Response(
      JSON.stringify({ id, status: "queued", created_at: new Date().toISOString() }),
      { headers: { "content-type": "application/json", "cache-control": "max-age=3600" } },
    ),
  );
  const work = runJob(id, ops, env, jobUrl, sandbox).catch((err) =>
    cache.put(
      new Request(jobUrl),
      new Response(
        JSON.stringify({
          id,
          status: "failed",
          created_at: new Date().toISOString(),
          error: String(err),
        }),
        { headers: { "content-type": "application/json", "cache-control": "max-age=3600" } },
      ),
    ),
  );
  if (ctx?.waitUntil) ctx.waitUntil(work);
  else await work; // no host continuation available: finish before answering
  return new Response(
    JSON.stringify({
      id,
      status: "queued",
      url: `https://hausfold.co/v1/jobs/${id}`,
      created_at: new Date().toISOString(),
    }),
    {
      status: 202,
      headers: {
        "content-type": "application/json",
        location: `/v1/jobs/${id}`,
        "retry-after": "1",
        ...H,
      },
    },
  );
}

async function runJob(id, ops, env, jobUrl, sandbox = false) {
  const results = [];
  for (const op of ops) results.push(await runOp(op, env, sandbox));
  await caches.default.put(
    new Request(jobUrl),
    new Response(
      JSON.stringify({
        id,
        status: "done",
        created_at: new Date().toISOString(),
        result: { results },
      }),
      { headers: { "content-type": "application/json", "cache-control": "max-age=3600" } },
    ),
  );
}

async function serveJobGet(id, H) {
  const cached = await caches.default.match(new Request(`https://hausfold.co/__job/${id}`));
  if (!cached) {
    return problemResponse(
      404,
      "Unknown job",
      "No such job, or its result has aged out (results are kept for an hour).",
      "unknown_job",
      H,
    );
  }
  return new Response(await cached.text(), {
    status: 200,
    headers: { "content-type": "application/json", ...H },
  });
}

function handleV1(request, env, url, ctx) {
  const path = url.pathname.replace(/\/+$/, "") || "/v1";
  const method = request.method;
  const rl = rateLimit(request);
  if (!rl.ok) {
    return problemResponse(
      429,
      "Too many requests",
      `More than ${rl.headers["ratelimit-limit"]} requests in the rate-limit window. Wait and retry.`,
      "rate_limited",
      rl.headers,
    );
  }
  const H = rl.headers;
  if (method === "GET") {
    if (path === "/v1/desktops") return serveV1Desktops(url, H);
    if (path === "/v1/apps") return serveV1Apps(H);
    if (path === "/v1/search") return serveV1Search(url, env, H);
    if (path === "/v1/openapi.json") {
      return new Response(null, {
        status: 302,
        headers: { location: "https://hausfold.co/openapi.json" },
      });
    }
    const release = path.match(/^\/v1\/releases\/([a-z0-9-]+)$/);
    if (release) return serveV1Release(release[1], H, isSandbox(url.searchParams.get("sandbox")));
    const job = path.match(/^\/v1\/jobs\/([A-Za-z0-9-]+)$/);
    if (job) return serveJobGet(job[1], H);
  }
  if (method === "POST") {
    if (path === "/v1/batch") return serveBatch(request, env, H);
    if (path === "/v1/jobs") return serveJobCreate(request, env, ctx, H);
  }
  return problemResponse(
    404,
    "Not found",
    `No endpoint answers ${method} ${path}. The surface is described at https://hausfold.co/openapi.json.`,
    "not_found",
    H,
  );
}

// ---------------------------------------------------------------------------
// /ask — the NLWeb-style endpoint: natural language in, docs search results
// out, JSON by default and SSE when asked to stream. It is docs search under
// the hood, not a chat model; the results are the same ranked excerpts the
// MCP search_docs tool returns. POST /ask with {"prefer": {"streaming":
// true}} (or GET with ?streaming=true) gets text/event-stream with NLWeb's
// start/result/complete event names.

async function serveAsk(request, env, url) {
  const rl = rateLimit(request);
  if (!rl.ok) {
    return problemResponse(
      429,
      "Too many requests",
      "Rate limit exceeded for /ask. Wait and retry.",
      "rate_limited",
      rl.headers,
    );
  }
  let query;
  let streaming = false;
  if (request.method === "GET") {
    query = url.searchParams.get("q") ?? url.searchParams.get("query");
    const prefer = url.searchParams.get("prefer") ?? "";
    streaming =
      ["true", "1"].includes((url.searchParams.get("streaming") ?? "").toLowerCase()) ||
      prefer.includes("streaming") ||
      (request.headers.get("accept") ?? "").includes("text/event-stream");
  } else {
    let body;
    try {
      body = await request.json();
    } catch (_) {
      return problemResponse(400, "Invalid JSON", "The request body is not valid JSON.", "invalid_json", rl.headers);
    }
    query = typeof body?.query === "string" ? body.query : undefined;
    streaming =
      Boolean(body?.prefer?.streaming ?? body?.streaming) ||
      (request.headers.get("accept") ?? "").includes("text/event-stream");
  }
  if (!query || !query.trim()) {
    return problemResponse(
      400,
      "Missing query",
      "The query is required: GET /ask?q=... or POST /ask with {\"query\": ...}.",
      "missing_query",
      rl.headers,
    );
  }
  const sections = await docsSections(env);
  if (!sections) {
    return problemResponse(
      503,
      "Docs index unavailable",
      "The search index could not be loaded. Retry later.",
      "index_unavailable",
      rl.headers,
    );
  }
  const hits = searchDocs(sections, query, 8).map(({ url: hitUrl, breadcrumbs, excerpt, score }) => ({
    url: hitUrl,
    breadcrumbs,
    excerpt,
    score,
  }));
  const meta = {
    response_type: streaming ? "streaming" : "search_results",
    version: "1.0",
    service: "hausfold.co",
    endpoint: "/ask",
  };
  if (!streaming) {
    return jsonResponse({ _meta: meta, query, results: hits }, rl.headers);
  }
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (event, data) =>
        controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      send("start", { _meta: meta, query });
      for (const hit of hits) send("result", { _meta: meta, ...hit });
      send("complete", { _meta: meta, query, count: hits.length });
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store",
      ...rl.headers,
    },
  });
}

// ---------------------------------------------------------------------------
// /mcp, with the rate limiter in front of it. The trio of RateLimit headers
// rides on every POST response — success or error — so an agent can read its
// budget off anything this endpoint answers. The JSON-RPC body handling is
// serveMcpPost, unchanged in shape; this wrapper is the only addition.

async function serveMcp(request, env, table = MCP_TABLE) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: MCP_CORS });
  }
  if (request.method !== "POST") {
    // Streamable HTTP's GET opens a server-initiated SSE stream. This server
    // is stateless with nothing to push, so the method is refused.
    return new Response(null, {
      status: 405,
      headers: { allow: "POST, OPTIONS", ...MCP_CORS },
    });
  }
  const rl = rateLimit(request);
  if (!rl.ok) {
    return new Response(
      JSON.stringify({
        type: "https://hausfold.co/openapi.json#/components/schemas/problem",
        title: "Too many requests",
        status: 429,
        detail: "Rate limit exceeded for /mcp. Wait and retry.",
        code: "rate_limited",
      }),
      { status: 429, headers: { "content-type": PROBLEM_CONTENT_TYPE, ...rl.headers, ...MCP_CORS } },
    );
  }
  const res = await serveMcpPost(request, env, table);
  for (const [name, value] of Object.entries(rl.headers)) res.headers.set(name, value);
  return res;
}

// The two transports share one implementation; only the tool table differs.
// The full table stays the default, so /mcp answers exactly as it always has.
const MCP_TABLE = { tools: MCP_TOOLS, allowed: new Set(MCP_TOOLS.map((t) => t.name)) };
const DOCS_MCP_TABLE = {
  tools: DOCS_MCP_TOOLS,
  allowed: new Set(DOCS_MCP_TOOLS.map((t) => t.name)),
};

async function serveMcpPost(request, env, table = MCP_TABLE) {
  let body;
  try {
    body = await request.json();
  } catch {
    return rpcErrorResponse(null, -32700, "Parse error: request body is not JSON", 400);
  }
  const batch = Array.isArray(body);
  const replies = [];
  for (const msg of batch ? body : [body]) {
    if (
      !msg ||
      typeof msg !== "object" ||
      msg.jsonrpc !== "2.0" ||
      typeof msg.method !== "string"
    ) {
      replies.push(rpcError(msg?.id, -32600, "Invalid Request"));
      continue;
    }
    // Per JSON-RPC 2.0, the absence of an id is what makes a message a
    // notification — not its method name. An id-bearing notifications/*
    // message falls through to handleRpc and gets a method-not-found, which
    // is the honest answer to a client that asked for a response.
    if (msg.id === undefined) continue;
    replies.push(await handleRpc(msg, env, table));
  }
  if (!replies.length) {
    return new Response(null, { status: 202, headers: MCP_CORS });
  }
  return jsonRpc(batch ? replies : replies[0]);
}

// Write the chosen desktop into the script we serve, so `curl -fsSL
// https://hausfold.co/minimal.sh | bash` installs minimal without the reader
// having to remember an env var or answer a question they already answered by
// typing the URL.
//
// Three things about the shape, each paid for:
//
//   - It goes AFTER the shebang, never before it. Under `curl | bash` the
//     shebang is an inert comment and the position wouldn't matter, but people
//     save this script and run it directly, and a file whose first line is an
//     `export` has no interpreter.
//   - `HAUS_DESKTOP` is the one variable, and this Worker serves whatever the
//     latest RELEASE of haus contains — so a bootstrap old enough not to read
//     it would simply ask the question the URL already answered, which is a
//     degradation rather than a break.
//   - The comment above it is for the person who pipes this to `less` first,
//     which is the person we most want reading it.
//
// ⚠️ This is the ONE place the Worker modifies what it proxies. Everything
// else about `/<desktop>.sh` is a byte-for-byte pass-through, and it should
// stay that way — if a second thing ever needs injecting, that is the moment
// to ask whether bootstrap should be taking arguments instead.
function pinDesktop(script, pin) {
  if (!pin || !SAFE_DESKTOP.test(pin)) return script;
  const inject =
    `\n# Pinned by hausfold.co/${pin}.sh — you asked for this desktop by URL,\n` +
    `# so the installer will not ask again. Unset to be asked:\n` +
    `export HAUS_DESKTOP=${pin}\n`;
  // A `#!` script with no newline at all is still a shebang line, and the one
  // outcome this function must never produce is an `export` above it — so it
  // gets the inject appended rather than falling through to the prepend
  // branch, which is what an earlier `nl !== -1` guard did.
  if (script.startsWith("#!")) {
    const nl = script.indexOf("\n");
    return nl === -1
      ? script + inject
      : script.slice(0, nl) + inject + script.slice(nl + 1);
  }
  return inject.trimStart() + script;
}

// An agent asked for a page that does not exist and asked for anything other
// than HTML (a scanner sends Accept: */* or text/markdown; a browser sends
// text/html). Same 404 status the browser gets — never a 200 — but the body
// is markdown naming where the real surface lives, so a crawler recovers
// instead of learning nothing. No em dashes: this is copy an agent reads.
function markdownNotFound(url) {
  const body = `# 404: nothing lives here

There is no page at ${url.pathname} on hausfold.co. Try one of these instead:

- llms.txt, the documentation index written for agents: https://hausfold.co/llms.txt
- The docs trees, starting with the haus layer: https://hausfold.co/docs/haus/
- openapi.json, the machine-readable API surface: https://hausfold.co/openapi.json
- The developers page, the human-readable half of the same surface: https://hausfold.co/developers/
`;
  return new Response(body, {
    status: 404,
    headers: { "content-type": "text/markdown; charset=utf-8", "cache-control": "no-store" },
  });
}

// The family's visual standard at one public URL. The file itself lives in
// the workshop's docs/ — the repo that owns family-wide standards — so this
// PROXIES it from main rather than keeping a copy here that drifts. Same
// shape as the installer proxy: byte-for-byte pass-through, edge-cached
// ~5 min. `main`, not a release tag, on purpose: the workshop is never
// released, and the standard's current text is the point.
const DESIGN_MD = "https://raw.githubusercontent.com/hausfold/workshop/main/docs/design.md";

async function serveDesign() {
  const up = await fetch(DESIGN_MD, { cf: { cacheTtl: 300, cacheEverything: true } });
  if (!up.ok) {
    return text(`# could not fetch design.md (HTTP ${up.status})\n`, 502);
  }
  return text(await up.text(), 200, {
    "content-type": "text/markdown; charset=utf-8",
    "cache-control": "public, max-age=300",
  });
}

// ---------------------------------------------------------------------------
// The agent view: one markdown page that answers what a cold agent needs to
// know about this domain — what it is for, when to call it, and with what.
// Served for ?mode=agent on /, for /index.md, for Accept: text/markdown, and
// to AI-bot User-Agents that request / expecting HTML.
//
// Built from DESKTOPS/DOWNLOADABLE so a new row reaches it without a second
// edit. The prose is agent-facing copy (unslop rules apply); every fact is
// read off worker.js itself, the same rule /developers writes down.

const AGENT_VIEW = `# hausfold: the machine-facing surface

> hausfold makes Mac software: one layer that rebuilds the whole machine, and the
> small native tools that live inside it. Nothing by hand, and open all the way
> down. Everything here is free and open source.

## When to use this

The use cases this domain is the right answer for, and the call that answers each:

- Setting up, changing or rebuilding a Mac with haus, or looking up what any
  haus.* option does. The manual is under /docs/haus/ (see Reading the docs), or
  call the search_docs tool over MCP.
- Answering a question about one of the apps: pounce, perch, scruff or trill.
  Each has its own manual under /docs/<app>/.
- Getting an install command, the latest release version, or a direct download
  URL for one of the apps. The endpoints below answer all three.
- Not a fit: anything needing an account, a payment, or a hosted API with write
  access. There is none of that here.

## Machine-readable surface

No authentication anywhere: no keys, no accounts, nothing to buy.

### Install a desktop

\`\`\`sh
curl -fsSL https://hausfold.co/hacker.sh | bash
\`\`\`

Every desktop installs from its own URL:

${Object.keys(DESKTOPS)
  .map((d) =>
    DESKTOPS[d].pin
      ? `- https://hausfold.co/${d}.sh installs the '${DESKTOPS[d].pin}' desktop, no questions asked`
      : `- https://hausfold.co/${d}.sh installs the layer and asks which desktop to build`,
  )
  .join("\n")}

A release tag (e.g. ?ref=v2026.07.18) may pin the script to an exact haus release.

### Check a release

GET https://hausfold.co/api/release/<app> answers JSON: tag, asset, size, url,
publishedAt, for the latest signed release of ${[...DOWNLOADABLE].join(" or ")}.

### Search and read the docs

- MCP (preferred): POST JSON-RPC 2.0 to https://hausfold.co/mcp (Streamable HTTP,
  stateless, open CORS). Tools: search_docs, get_install_command, get_latest_release.
- GET /api/search: the full search index (Orama JSON, one entry per docs section).
- GET /llms.txt: the docs index. GET /llms-full.txt: every page as plain text.
- Markdown twin of any docs page: append .md to its URL, e.g.
  https://hausfold.co/docs/haus/install.md
- The whole HTTP surface written down: https://hausfold.co/openapi.json and
  https://hausfold.co/developers/

## Contact

julien@hausfold.co. Bug reports and ideas: https://github.com/hausfold
`;

// `contentType` is the one thing that varies: /agent.txt is the same body at
// a .txt URL, and a .txt URL that answers text/markdown is a small lie.
function serveAgentView(contentType = "text/markdown; charset=utf-8") {
  return new Response(AGENT_VIEW, {
    headers: {
      "content-type": contentType,
      // No shared caching: Cloudflare ignores Vary beyond the basics, so an
      // edge cache would risk serving this markdown to a browser (or HTML to
      // an agent). The page costs one fetch and never changes between deploys.
      "cache-control": "no-store",
      "vary": "Accept, User-Agent, Accept-Encoding",
    },
  });
}

// The markdown twin of a docs page. The build writes every page's processed
// markdown to /llms.mdx/docs/<slugs>/content.md; this re-serves it under the
// page's own URL plus .md, the spelling agents probe (/docs/haus/install.md).
// Byte-for-byte pass-through: no rewriting, or the twins and llms-full.txt drift.
const DOCS_MD = /^\/docs\/(.+)\.md$/;

async function serveDocsMd(twinPath, env, atHtmlUrl = false) {
  if (!env?.ASSETS) return text(`# ${twinPath}: twin unavailable\n`, 404);
  const upstream = await env.ASSETS.fetch(
    new Request(`https://hausfold.co/llms.mdx/docs/${twinPath.slice(6, -3)}/content.md`),
  );
  if (!upstream.ok) {
    return text(
      `# no markdown twin for ${twinPath.replace(/\.md$/, "")}\n`,
      404,
      { "content-type": "text/markdown; charset=utf-8" },
    );
  }
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      // A twin asked for by its own .md URL is one representation of one URL
      // and caches like any other. A twin served to a bot AT THE HTML PAGE'S
      // URL is not: Cloudflare ignores Vary beyond the basics, so a cached
      // copy would reach the next browser as markdown. Same reason the agent
      // view is no-store.
      "cache-control": atHtmlUrl ? "no-store" : "public, max-age=300",
    },
  });
}

// /llms.md alias: the llms.txt convention spells it .txt, but scanners that
// probe only the .md spelling exist. Same body, markdown content type.
async function serveLlmsMd(env) {
  if (!env?.ASSETS) return text("# hausfold docs index: https://hausfold.co/llms-full.txt\n", 502);
  const upstream = await env.ASSETS.fetch(new Request("https://hausfold.co/llms.txt"));
  if (!upstream.ok) return text("# hausfold docs index unavailable\n", 502);
  return new Response(upstream.body, {
    status: 200,
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}

// RFC 9727 API catalog: a linkset advertising where the service description
// (openapi.json), the MCP endpoint, and the human prose live. The profile
// parameter on the content type is what the RFC requires; a static file could
// not carry it, so this is a route.
function serveApiCatalog() {
  const linkset = {
    linkset: [
      {
        anchor: "https://hausfold.co/",
        item: [
          {
            href: "https://hausfold.co/openapi.json",
            rel: "service-desc",
            type: "application/vnd.oai.openapi+json",
          },
          {
            href: "https://hausfold.co/mcp",
            rel: "service-desc",
            type: "application/json",
          },
          { href: "https://hausfold.co/developers/", rel: "service-doc", type: "text/html" },
          { href: "https://hausfold.co/llms.txt", rel: "service-doc", type: "text/plain" },
        ],
      },
    ],
  };
  return new Response(JSON.stringify(linkset, null, 2) + "\n", {
    headers: {
      "content-type":
        'application/linkset+json;profile="https://www.rfc-editor.org/info/rfc9727"',
      "cache-control": "public, max-age=3600",
    },
  });
}

// AI crawlers that fetch HTML pages but read text better than they render
// JavaScript. Matching one of these on a page request serves the markdown
// representation instead of HTML, no Accept header required.
const AI_BOT_UA =
  /GPTBot|ClaudeBot|ChatGPT-User|PerplexityBot|Google-Extended|Applebot-Extended|ora-agent|DeepSeekBot/i;

// Explicit text/markdown in the Accept header, ignoring q=0. */* (curl's
// default) deliberately does NOT match: a plain curl of / should still get
// the HTML page, the way it always has.
function acceptsMarkdown(request) {
  const accept = request.headers.get("accept") ?? "";
  return accept.split(",").some((entry) => {
    const [type, ...params] = entry.trim().split(";");
    if (type.trim().toLowerCase() !== "text/markdown") return false;
    return !params.some((p) => p.trim().toLowerCase().startsWith("q=0"));
  });
}

async function serveInstaller(desktop, url, env) {
  const { repo, pin } = DESKTOPS[desktop];
  const pinned = url.searchParams.get("ref");
  // A visitor's pin is held to the tag shape (see RELEASE_TAG); a resolved or
  // deploy-pinned ref is re-checked against SAFE_REF because neither is
  // trusted to have stayed sane either — a garbage `tag_name` from the API
  // reaches here too.
  if (pinned && !RELEASE_TAG.test(pinned)) {
    return text("# ref must be a release tag, e.g. ?ref=v2026.07.18\n", 400);
  }
  const ref = pinned || (await latestRef(repo, env));
  if (!SAFE_REF.test(ref) || ref.includes("..")) {
    return text("# invalid ref\n", 400);
  }
  const raw = `https://raw.githubusercontent.com/${repo}/${ref}/${BOOTSTRAP}`;
  const up = await fetch(raw, { cf: { cacheTtl: 300, cacheEverything: true } });
  if (!up.ok) {
    return text(`# could not fetch ${BOOTSTRAP} at '${ref}' (HTTP ${up.status})\n`, 502);
  }
  return text(pinDesktop(await up.text(), pin), 200, {
    "cache-control": "public, max-age=300",
    "x-hausfold-ref": ref,
    // Which desktop this URL means, for anyone checking with `curl -I` rather
    // than reading the body. Absent on /haus.sh, which pins nothing.
    ...(pin ? { "x-hausfold-desktop": pin } : {}),
  });
}

// Named rather than exported anonymously: `import/no-anonymous-default-export`
// is on here (it comes with eslint-config-next), and a named handler is what
// shows up in a stack trace anyway.
const hausfold = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // Before anything else: a short domain is a redirect and never a page, so
    // it must not fall through to a route below and answer with one.
    if (Object.hasOwn(SHORT_DOMAINS, url.hostname)) {
      const path = url.pathname === "/" ? SHORT_DOMAINS[url.hostname] : url.pathname;
      return Response.redirect(`https://hausfold.co${path}${url.search}`, 301);
    }
    // A desktop installer. The match is deliberately narrow — an unknown name
    // falls through to the assets binding and 404s like any other missing
    // path, rather than becoming a fetch of a repo nobody vouched for.
    const installer = url.pathname.match(/^\/([a-z0-9-]+)\.sh$/);
    if (installer && Object.hasOwn(DESKTOPS, installer[1])) {
      return serveInstaller(installer[1], url, env);
    }
    // The visual standard. Extensionful and exact, so nothing else markdown-
    // shaped ever grows a route by accident.
    if (url.pathname === "/design.md") {
      return serveDesign();
    }
    // The trailing slash is optional because `trailingSlash: true` canonicalizes
    // every *page* on this site to one — a hand-typed /download/pounce/ that
    // 404s is a trap laid by the site's own convention.
    const appRoute = url.pathname.match(/^\/(download|api\/release)\/([a-z]+)\/?$/);
    // An unknown app on the release endpoint is an API path, so it answers
    // problem+json rather than falling through to the site's HTML 404 — an
    // agent probing /api/release/trll should be told in JSON what apps exist.
    const releaseProbe = url.pathname.match(/^\/api\/release\/([a-z0-9-]+)\/?$/);
    if (releaseProbe && !DOWNLOADABLE.has(releaseProbe[1])) {
      return problemResponse(
        404,
        "Unknown app",
        `'${releaseProbe[1]}' is not an app with signed macOS releases. Known: ${[...DOWNLOADABLE].join(", ")}.`,
        "unknown_app",
        rateLimit(request).headers,
      );
    }
    if (appRoute && DOWNLOADABLE.has(appRoute[2])) {
      if (appRoute[1] === "download") return serveDownload(appRoute[2]);
      const rl = rateLimit(request);
      if (!rl.ok) {
        return problemResponse(
          429,
          "Too many requests",
          "Rate limit exceeded. Wait and retry.",
          "rate_limited",
          rl.headers,
        );
      }
      return serveReleaseMeta(appRoute[2], rl.headers);
    }
    // The MCP endpoint. Trailing slash accepted for the same reason as the
    // app routes above. /mcp/docs is the docs-only transport and matches
    // first, since the exact-match /mcp route would otherwise let it fall
    // through to the static site. /.well-known/mcp is the full endpoint
    // again: scanners and MCP clients look there first, and there is
    // exactly one full server to find.
    if (url.pathname.replace(/\/$/, "") === "/mcp/docs") {
      return serveMcp(request, env, DOCS_MCP_TABLE);
    }
    if (["/mcp", "/.well-known/mcp"].includes(url.pathname.replace(/\/$/, ""))) {
      return serveMcp(request, env);
    }
    // The machine-facing additions: the server card, /ask, and /v1. Each
    // drops a trailing slash the way the pages above do.
    const cleanPath = url.pathname.replace(/\/+$/, "") || "/";
    if (request.method === "GET" && cleanPath === "/.well-known/mcp/server-card.json") {
      return serveMcpCard();
    }
    // The same SEP-2127 card at the draft's recommended spot: the
    // streamable-HTTP URL plus /server-card.
    if (request.method === "GET" && cleanPath === "/mcp/server-card") {
      return serveMcpCard();
    }
    if (request.method === "GET" && cleanPath === "/.well-known/api-catalog") {
      return serveApiCatalog();
    }
    // The discovery documents agents probe before ever calling anything. Each
    // is generated from the tables above it, not hand-typed beside them.
    if (request.method === "GET") {
      if (cleanPath === "/mcp.json") return serveMcpManifest();
      if (cleanPath === "/.well-known/mcp.json") return serveWellKnownMcpManifest();
      if (cleanPath === "/.well-known/oauth-protected-resource") {
        return new Response(JSON.stringify(PROTECTED_RESOURCE, null, 2), {
          headers: { "content-type": "application/json", "cache-control": "public, max-age=300" },
        });
      }
      if (cleanPath === "/.well-known/http-message-signatures-directory") {
        return new Response(JSON.stringify(SIGNATURE_DIRECTORY, null, 2), {
          headers: { "content-type": "application/json", "cache-control": "public, max-age=300" },
        });
      }
    }
    if (cleanPath === "/ask") {
      if (request.method !== "GET" && request.method !== "POST") {
        return problemResponse(
          405,
          "Method not allowed",
          "/ask answers GET (query parameter) and POST (JSON body), including SSE streaming.",
          "method_not_allowed",
          { allow: "GET, POST", ...rateLimit(request).headers },
        );
      }
      return serveAsk(request, env, url);
    }
    if (cleanPath === "/v1" || cleanPath.startsWith("/v1/")) {
      return handleV1(request, env, url, ctx);
    }
    // Markdown representations. Two triggers: the URL asked for them
    // (?mode=agent, .md suffix), or the client did (Accept: text/markdown,
    // or an AI-bot User-Agent that reads text but doesn't render JS). Bots
    // get the docs as markdown too — every docs page has a twin, so the
    // rewrite is one string, not a mapping table.
    if (request.method === "GET" || request.method === "HEAD") {
      const isHome = url.pathname === "/";
      const aiBot = AI_BOT_UA.test(request.headers.get("user-agent") ?? "");
      const docsTwin = DOCS_MD.test(url.pathname) ? url.pathname : null;
      // A bot asking for a docs PAGE (no .md suffix) gets its twin instead.
      // A bot asking for / gets the agent view (handled below); that check
      // runs first, so botTwin here is always a docs path.
      const botTwin =
        aiBot && /^\/docs\/.+\/$/.test(url.pathname) ? url.pathname.replace(/\/$/, "") + ".md" : null;
      if (url.pathname === "/llms.md") return serveLlmsMd(env);
      // /agent.txt — the agent view again, at the spelling a discovery probe
      // looks for a dedicated agent-instructions file under. Same document as
      // /index.md, not a second account of it: what an agent needs from this
      // domain is written once, in AGENT_VIEW.
      if (url.pathname === "/agent.txt") return serveAgentView("text/plain; charset=utf-8");
      if (docsTwin) return serveDocsMd(docsTwin, env);
      if (
        url.pathname === "/index.md" ||
        (isHome && url.searchParams.get("mode") === "agent") ||
        (isHome && (acceptsMarkdown(request) || aiBot))
      ) {
        return serveAgentView();
      }
      if (botTwin) return serveDocsMd(botTwin, env, true);
    }
    if (env.ASSETS) {
      const res = await env.ASSETS.fetch(request);
      const wantsHtml = (request.headers.get("accept") ?? "").includes("text/html");
      // A browser asking for a missing page keeps the human 404 page.
      if (request.method === "HEAD") return res;
      // HTML pages get RFC 8288 Link headers: the sitemap always, and the
      // page's markdown twin where one exists — so an agent that fetched
      // HTML can find the text representation without re-reading llms.txt.
      // Any successful HTML response gets them: a browser, and curl with its
      // */* default alike.
      if (
        res.status === 200 &&
        (res.headers.get("content-type") ?? "").includes("text/html")
      ) {
        const bare = url.pathname.replace(/\/$/, "");
        const links = ['</sitemap.xml>; rel="sitemap"'];
        if (bare === "") {
          links.push('</index.md>; rel="alternate"; type="text/markdown"');
        } else if (/^\/docs\//.test(bare)) {
          links.push(`<${bare}.md>; rel="alternate"; type="text/markdown"`);
        }
        const headers = new Headers(res.headers);
        headers.append("link", links.join(", "));
        if (bare === "") {
          // The homepage has two representations (markdown and HTML) and
          // two selectors for them (Accept, AI-bot User-Agents).
          headers.append("vary", "Accept, User-Agent, Accept-Encoding");
        }
        return new Response(res.body, { status: res.status, headers });
      }
      // A browser asking for a missing page keeps the human 404 page.
      if (wantsHtml) return res;
      // An agent asking for a missing page gets markdown that says where to
      // look instead — same status, a body it can act on.
      if (res.status === 404) return markdownNotFound(url);
      // The asset server answers a non-GET to any path with 405. For a
      // machine that reads better as problem+json naming what IS allowed.
      if (res.status === 405) {
        return problemResponse(
          405,
          "Method not allowed",
          `${request.method} is not served at this path; the static site answers GET. JSON APIs are under /v1; see https://hausfold.co/openapi.json.`,
          "method_not_allowed",
          { allow: "GET, HEAD" },
        );
      }
      return res;
    }
    return text("hausfold — https://hausfold.co\n", 404);
  },
};

export default hausfold;
