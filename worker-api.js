// worker-api.js — the small shared pieces of the machine-facing REST surface
// that the tests need to reach directly: the per-isolate rate limiter and the
// RFC 9457 problem+json error shape.
//
// workerd refuses named exports from worker.js that aren't handlers (the
// reason worker-config.js exists), and the tests need to reset the limiter
// between cases, so this lives beside worker.js rather than inline there.

export const PROBLEM_CONTENT_TYPE = "application/problem+json";

// Per-isolate buckets keyed by client IP. Cloudflare isolates are per-colo, so
// the RateLimit headers under-report the true ceiling (N colos serving one
// visitor can admit up to N x this), which the OpenAPI description says in
// as many words. Making it cross-isolate would take a KV or DO binding this
// site doesn't otherwise need.
export const RATE_LIMIT = { limit: 600, windowMs: 60_000 };

const buckets = new Map();

export function resetRateLimits() {
  buckets.clear();
}

export function rateLimit(request) {
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  const now = Date.now();
  if (buckets.size > 10_000) buckets.clear();
  let bucket = buckets.get(ip);
  if (!bucket || bucket.reset <= now) {
    bucket = { count: 0, reset: now + RATE_LIMIT.windowMs };
    buckets.set(ip, bucket);
  }
  bucket.count += 1;
  const resetSeconds = Math.max(1, Math.ceil((bucket.reset - now) / 1000));
  // The RateLimit field names from draft-ietf-httpapi-ratelimit-headers:
  // limit, remaining (this window), reset (seconds until the window turns).
  const headers = {
    "ratelimit-limit": String(RATE_LIMIT.limit),
    "ratelimit-remaining": String(Math.max(0, RATE_LIMIT.limit - bucket.count)),
    "ratelimit-reset": String(resetSeconds),
  };
  if (bucket.count > RATE_LIMIT.limit) {
    return { ok: false, headers: { ...headers, "retry-after": String(resetSeconds) } };
  }
  return { ok: true, headers };
}

// RFC 9457 problem+json. `code` is the machine-readable half an agent branches
// on; `type` anchors into the problem schema in openapi.json, which resolves
// (200) on this host so no link in an error body dangles.
export function problemResponse(status, title, detail, code, extraHeaders = {}) {
  return new Response(
    JSON.stringify({
      type: "https://hausfold.co/openapi.json#/components/schemas/problem",
      title,
      status,
      detail,
      code,
    }),
    {
      status,
      headers: {
        "content-type": PROBLEM_CONTENT_TYPE,
        "cache-control": "no-store",
        ...extraHeaders,
      },
    },
  );
}
