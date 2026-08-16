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
// ⚠️ Every row maps to `hausfold/haus` because all four desktops ship *inside*
// the layer's own repo, as `desktops/<name>.nix` — that is not a spelling
// mistake, and the file each row fetches is that one repo's `bootstrap.sh`.
// (`nebelung.sh` would be the wrong name for any of them: nebelung is the
// palette, not a desktop.) The row exists to say which desktop the
// URL means, not which repo it came from; the day a desktop lives in a repo
// we don't own, `repo` is already where that goes.
//
// `pin: null` is the entry point that asks. `/haus.sh` installs the layer and
// lets bootstrap's own interview choose, which is what someone who hasn't
// decided wants; every other row skips that one question because the URL they
// typed already answered it.
//
// 🚨 `blank` is deliberately absent. It is a real desktop in the repo — the
// null selection, for someone assembling rooms by hand — but it is not a thing
// this site presents, and a key here is a promise to keep serving it.
const DESKTOPS = {
  haus: { repo: "hausfold/haus", pin: null },
  hacker: { repo: "hausfold/haus", pin: "hacker" },
  everyday: { repo: "hausfold/haus", pin: "everyday" },
  minimal: { repo: "hausfold/haus", pin: "minimal" },
};

// A desktop name we are willing to write into the served script. The values
// above are ours, not a visitor's, so this is belt-and-braces rather than a
// boundary — but the one thing that must never happen here is a newline or a
// shell metacharacter reaching a line of bash we generate.
const SAFE_DESKTOP = /^[a-z][a-z0-9-]*$/;

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
