// hausfold.co — one Worker in front of the static export.
//
//   /<desktop>.sh       → PROXIES that desktop's bootstrap.sh as text/plain, so
//                         the install one-liner is exactly:
//                             curl -fsSL https://hausfold.co/nebelhaus.sh | bash
//   /download/<app>     → 302 to the latest GitHub release's macOS artifact,
//                         so the product pages (and curl) get a stable URL while
//                         GitHub keeps hosting bytes and counting downloads
//   /api/release/<app>  → tiny JSON (tag, asset, size, publishedAt) for
//                         labelling a download button with the real version
//                         instead of one hardcoded to go stale. ⚠️ Nothing on
//                         this site calls it yet — the pages that did are the
//                         nebelhaus.com ones, and it is here so the landing
//                         pages have it when they become Next routes.
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
//     `/init.sh` here: nebelhaus.com still answers that URL with the script
//     today, and when it becomes the 301 map (§5.2) its redirect should point
//     straight at `/nebelhaus.sh`, so a shell history from 2026 costs one hop.
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
// hand out `curl -fsSL 'https://hausfold.co/nebelhaus.sh?ref=<sha>' | bash` —
// our domain, our TLS, no visible redirect, their script. A tag is the one
// ref shape only the repo's own maintainers can create.
//
// The deploy-time REF var stays on SAFE_REF on purpose: that one is set by
// whoever deploys the Worker, not by whoever clicks a link, and pinning a
// branch during an incident is exactly what it is for. A desktop repo that
// versions differently one day wants its own pattern in the table row, not a
// loosening of this.
const RELEASE_TAG = /^v\d{4}\.\d{2}\.\d{2}(-\d+)?$/;

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

async function serveInstaller(desktop, url, env) {
  const repo = DESKTOPS[desktop];
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
  return text(await up.text(), 200, {
    "cache-control": "public, max-age=300",
    "x-hausfold-ref": ref,
  });
}

// Named rather than exported anonymously: `import/no-anonymous-default-export`
// is on here (it comes with eslint-config-next), and a named handler is what
// shows up in a stack trace anyway.
const hausfold = {
  async fetch(request, env) {
    const url = new URL(request.url);
    // A desktop installer. The match is deliberately narrow — an unknown name
    // falls through to the assets binding and 404s like any other missing
    // path, rather than becoming a fetch of a repo nobody vouched for.
    const installer = url.pathname.match(/^\/([a-z0-9-]+)\.sh$/);
    if (installer && Object.hasOwn(DESKTOPS, installer[1])) {
      return serveInstaller(installer[1], url, env);
    }
    // The trailing slash is optional because `trailingSlash: true` canonicalizes
    // every *page* on this site to one — a hand-typed /download/pounce/ that
    // 404s is a trap laid by the site's own convention.
    const appRoute = url.pathname.match(/^\/(download|api\/release)\/([a-z]+)\/?$/);
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

export default hausfold;
