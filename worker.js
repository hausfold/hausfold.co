// hausfold.co — one Worker in front of the static export.
//
//   /<desktop>.sh       → PROXIES that desktop's bootstrap.sh as text/plain, so
//                         the install one-liner is exactly:
//                             curl -fsSL https://hausfold.co/nebelhaus.sh | bash
//   /download/<app>     → 302 to the latest GitHub release's macOS artifact,
//                         so the product pages (and curl) get a stable URL while
//                         GitHub keeps hosting bytes and counting downloads
//   /api/release/<app>  → tiny JSON (tag, asset, size, publishedAt) the product
//                         pages use to label the download button with the real
//                         version — nothing hardcoded to go stale between deploys
//   everything else     → the static export in ./out (the [assets] binding)
//
// Ported from the workshop's `web/worker.js`, which serves the same three
// things on nebelhaus.com and keeps doing so until that zone becomes 301s
// (rename plan §5.2). Two things changed on the way over, and both are the
// point of the move rather than incidental:
//
//   - `/init.sh` became `/<desktop>.sh`. hausfold.co is the platform's door,
//     not one desktop's, so the installer is named after the desktop you are
//     installing — `hausfold.co/nebelhaus.sh`. There is deliberately no
//     `/init.sh` here: the redirect that keeps the old URL alive lives on
//     nebelhaus.com and points straight at `/nebelhaus.sh`, so a shell history
//     from 2026 still resolves in one hop.
//   - The resolution table is data. Today it holds one name; a second desktop
//     is a row, not a route. What happens when a desktop lives in a repo we
//     don't own is deliberately deferred (§5.2) — ship the one-name version.
//
// We PROXY (fetch), not redirect, so the pretty URL is what curl sees and
// there's no hop to a raw.githubusercontent.com link. By default the script is
// served from the latest GitHub *release* tag of the desktop's repo (cached
// ~1h to stay well under GitHub's unauthenticated API limit), falling back to
// `main` before the first release. `?ref=v2026.07.18` pins an exact ref; a REF
// wrangler var hard-pins one for everybody.

// The desktops this site installs, by the name in their URL. A key here is a
// promise that `hausfold.co/<key>.sh` keeps resolving, so only desktops the
// site actually presents belong in it.
//
// ⚠️ `nebelhaus` maps to `hausfold/haus` because nebelhaus is the desktop that
// ships *inside* the layer's own repo — it is not a spelling mistake, and the
// file it fetches is that repo's `bootstrap.sh`. And `nebelung.sh` would be
// the wrong name for it: nebelung is the palette, nebelhaus is the desktop.
const DESKTOPS = {
  nebelhaus: "hausfold/haus",
};

const BOOTSTRAP = "bootstrap.sh";
const SAFE_REF = /^[A-Za-z0-9._-]+$/; // no slashes / dots-dots -> no path traversal

// The apps with signed + notarized release artifacts on GitHub. Keys are the
// URL slugs; each repo lives at github.com/hausfold/<app>.
// A slug here is a promise to keep serving that app's latest release, so only
// apps the site actually presents belong in this set.
const DOWNLOADABLE = new Set(["pounce", "perch"]);
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
      const asset =
        release.assets?.find((a) => MACOS_DMG.test(a.name)) ??
        release.assets?.find((a) => MACOS_ASSET.test(a.name)) ??
        release.assets?.[0];
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

async function serveInstaller(desktop, url, env) {
  const repo = DESKTOPS[desktop];
  const ref = url.searchParams.get("ref") || (await latestRef(repo, env));
  if (!SAFE_REF.test(ref) || ref.includes("..")) {
    return text("# invalid ref\n", 400);
  }
  const raw = `https://raw.githubusercontent.com/${repo}/${ref}/${BOOTSTRAP}`;
  const up = await fetch(raw, { cf: { cacheTtl: 300, cacheEverything: true } });
  if (!up.ok) {
    return text(`# could not fetch ${BOOTSTRAP} at '${ref}' (HTTP ${up.status})\n`, 502);
  }
  return text(await up.text(), 200, {
    "cache-control": "public, max-age=300",
    "x-hausfold-ref": ref,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // A desktop installer. The match is deliberately narrow — an unknown name
    // falls through to the assets binding and 404s like any other missing
    // path, rather than becoming a fetch of a repo nobody vouched for.
    const installer = url.pathname.match(/^\/([a-z0-9-]+)\.sh$/);
    if (installer && Object.hasOwn(DESKTOPS, installer[1])) {
      return serveInstaller(installer[1], url, env);
    }
    const appRoute = url.pathname.match(/^\/(download|api\/release)\/([a-z]+)$/);
    if (appRoute && DOWNLOADABLE.has(appRoute[2])) {
      return appRoute[1] === "download" ? serveDownload(appRoute[2]) : serveReleaseMeta(appRoute[2]);
    }
    // Everything else is the static site. With the [assets] binding present,
    // matching assets are served automatically before the Worker even runs;
    // this fallback covers requests that reach the Worker anyway.
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return text("hausfold — https://hausfold.co\n", 404);
  },
};
