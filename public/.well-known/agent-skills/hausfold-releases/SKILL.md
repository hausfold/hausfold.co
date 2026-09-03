---
name: hausfold-releases
description: Check the latest signed macOS release of a hausfold app (pounce, perch) and get its direct download URL. Use before naming a version, checking for updates, or linking a download.
---

# hausfold releases

pounce and perch ship signed, notarized releases on GitHub. Don't hardcode a
version: ask the release endpoint, which always answers with the real latest.

```sh
curl -fsSL https://hausfold.co/api/release/pounce
```

The JSON:

```json
{
  "tag": "v2026.08.02",
  "asset": "pounce-macos.dmg",
  "size": 4821120,
  "url": "https://github.com/hausfold/pounce/releases/download/...",
  "publishedAt": "2026-08-02T09:14:00Z"
}
```

- `apps`: `pounce`, `perch`. Other names 404.
- The `url` is the DMG, preferred over the tarball (which is what the Homebrew
  formula consumes). `https://hausfold.co/download/<app>` 302s to the same
  asset when you want a stable link instead of JSON.
- The same lookup exists as an MCP tool, `get_latest_release`, on
  `https://hausfold.co/mcp`.

No auth, no rate limit beyond Cloudflare's, and the response is cached for five
minutes at the edge, so polling is pointless.
