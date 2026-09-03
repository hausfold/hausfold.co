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
//   /design.md          → PROXIES the workshop's docs/design.md — the
//                         family's visual standard as one public URL any
//                         coding agent can load before drawing something
//                         that carries the brand
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
import { DESKTOPS, DOWNLOADABLE, MCP_TOOLS, MCP_PROTOCOL_VERSION } from "./worker-config.js";

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
// challenge from a GitHub runner.
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

async function serveReleaseMeta(app) {
  const release = await latestAppRelease(app);
  if (!release) return text("{}", 502, { "content-type": "application/json" });
  return new Response(JSON.stringify(release), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=300",
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

function searchDocs(sections, query, limit) {
  // Term count + a breadcrumb boost: crude next to Orama's BM25, but the
  // corpus is ~3800 short sections and the query is usually one or two
  // domain words, which is the case this is tuned for.
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
  if (!terms.length) return [];
  const scored = [];
  for (const doc of sections) {
    const content = doc.content ?? "";
    const lower = content.toLowerCase();
    const crumb = (doc.breadcrumbs ?? []).join(" ").toLowerCase();
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
  return scored.slice(0, limit).map(({ doc, score, idx }) => ({
    url: doc.url,
    breadcrumbs: doc.breadcrumbs ?? [],
    excerpt: excerpt(doc.content ?? "", idx),
    score,
  }));
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
        return toolResult(
          `unknown desktop '${desktop}'. Available: ${Object.keys(DESKTOPS).join(", ")}`,
          true,
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
        return toolResult(
          `unknown app '${app}'. Available: ${[...DOWNLOADABLE].join(", ")}`,
          true,
        );
      }
      const release = await latestAppRelease(app);
      if (!release) {
        return toolResult(`no macOS release found for '${app}'`, true);
      }
      return toolResult(release);
    }
    case "search_docs": {
      const query = args.query;
      if (typeof query !== "string" || !query.trim()) {
        return toolResult("'query' must be a non-empty string", true);
      }
      const sections = await docsSections(env);
      if (!sections) {
        return toolResult("docs index unavailable", true);
      }
      const limit = Number.isInteger(args.limit) ? Math.min(Math.max(args.limit, 1), 20) : 8;
      return toolResult({ query, results: searchDocs(sections, query, limit) });
    }
    default:
      return toolResult(`unknown tool '${name}'`, true);
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

async function handleRpc(msg, env) {
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
        serverInfo: { name: "hausfold.co", title: "hausfold", version: "1.0.0" },
        instructions:
          "Public, unauthenticated surface for hausfold's Mac software: install commands, " +
          "release metadata, and full-text docs search. No keys, nothing to buy.",
      });
    }
    case "ping":
      return rpcResult(msg.id, {});
    case "tools/list":
      return rpcResult(msg.id, { tools: MCP_TOOLS });
    case "tools/call": {
      const { name, arguments: args = {} } = msg.params ?? {};
      if (typeof name !== "string") {
        return rpcError(msg.id, -32602, "tools/call requires a tool name");
      }
      return rpcResult(msg.id, await callTool(name, args, env));
    }
    default:
      return rpcError(msg.id, -32601, `Method not found: ${msg.method}`);
  }
}

async function serveMcp(request, env) {
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
    replies.push(await handleRpc(msg, env));
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
  async fetch(request, env) {
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
    if (appRoute && DOWNLOADABLE.has(appRoute[2])) {
      return appRoute[1] === "download" ? serveDownload(appRoute[2]) : serveReleaseMeta(appRoute[2]);
    }
    // The MCP endpoint. Trailing slash accepted for the same reason as the
    // app routes above.
    if (url.pathname.replace(/\/$/, "") === "/mcp") {
      return serveMcp(request, env);
    }
    // Everything else is the static site. With the [assets] binding present,
    // matching assets are served automatically before the Worker even runs;
    // this fallback covers requests that reach the Worker anyway.
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return text("hausfold — https://hausfold.co\n", 404);
  },
};

export default hausfold;
