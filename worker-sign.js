// worker-sign.js — Web Bot Auth: the signature on every request this Worker
// sends out, and the key directory a receiver verifies it against.
//
// hausfold.co is a bot, in a small way. Four routes reach out to GitHub on a
// visitor's behalf: `/<desktop>.sh` proxies bootstrap.sh from
// raw.githubusercontent.com after asking api.github.com for the latest release
// tag, `/download/<app>` and `/api/release/<app>` (and the MCP and /v1 shapes
// of the same lookup) ask it for an app's latest release, and `/design.md`
// proxies the workshop's design standard. Every one of those requests now
// carries an RFC 9421 HTTP Message Signature in the Web Bot Auth profile
// (draft-meunier-web-bot-auth-architecture), so a receiver that checks can
// tell "hausfold.co's Worker" from "someone on a Cloudflare IP":
//
//   Signature-Agent: "https://hausfold.co"
//   Signature-Input: sig1=("@authority" "signature-agent");alg="ed25519";
//                    keyid="<JWK thumbprint>";nonce="…";tag="web-bot-auth";
//                    created=<unix>;expires=<unix>
//   Signature:       sig1=:<base64 Ed25519 signature>:
//
// `Signature-Agent` names where the key lives: the directory at
// https://hausfold.co/.well-known/http-message-signatures-directory
// (draft-meunier-http-message-signatures-directory), a JWK Set holding the
// public half. The directory response is itself signed with the same key,
// under `tag="http-message-signatures-directory"`, which is how a verifier
// knows the host that serves the key also holds it.
//
// 🚨 The key is a Worker SECRET, never a file in this repo. `WEB_BOT_AUTH_KEY`
// holds an Ed25519 private JWK (kty OKP, crv Ed25519, x, d, plus nbf/exp), set
// once with `scripts/web-bot-auth-key.mjs | npx wrangler secret put
// WEB_BOT_AUTH_KEY` and surviving every deploy after. The public half is
// DERIVED from it at request time, so the directory and the signatures can
// never disagree, and rotation is the same command again. With no secret in
// the environment (a preview Worker, a bare `wrangler dev`, the tests) the
// directory is honestly empty and the requests go out unsigned: a missing key
// is a missing feature, never a broken installer. A secret that is present
// but malformed is logged once per isolate and treated the same way.
//
// Everything here is WebCrypto, which both workerd and Node ship with Ed25519
// support, so the tests verify real signatures against the real base string
// rather than trusting the string-building.

export const KEY_VAR = "WEB_BOT_AUTH_KEY";

// The URI a receiver resolves the key from: the origin, and the well-known
// path is implied by the directory draft. Sent as a Structured Field String,
// so the header value carries its own double quotes.
export const SIGNATURE_AGENT = "https://hausfold.co";

export const DIRECTORY_PATH = "/.well-known/http-message-signatures-directory";
export const DIRECTORY_CONTENT_TYPE = "application/http-message-signatures-directory+json";

// How long a signature stays valid, in seconds. Five minutes is well inside
// the architecture draft's 24-hour ceiling and wide enough for clock skew;
// every request gets a fresh one, so nothing is lost by keeping it short.
const SIGNATURE_TTL = 300;

// The directory's own Cache-Control. The draft's example says a day; the
// Worker regenerates the signature on every request, so a verifier that
// honours this and re-checks the cached signature past SIGNATURE_TTL will
// find it expired, which is the same thing the draft's own example does
// (created + 10s under max-age=86400). An empty directory is cached for the
// five minutes the other well-known documents get, so the day the secret
// lands a verifier is not holding "no keys" until tomorrow.
const DIRECTORY_MAX_AGE = 86400;
const EMPTY_MAX_AGE = 300;

const enc = new TextEncoder();
const b64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const b64url = (bytes) => b64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

// RFC 7638 §3 / RFC 8037 Appendix A.3: SHA-256 over the required members in
// lexicographic order with no whitespace, base64url without padding. This is
// the `kid` in the directory and the `keyid` in every signature.
export async function jwkThumbprint(jwk) {
  const canonical = JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x });
  return b64url(await crypto.subtle.digest("SHA-256", enc.encode(canonical)));
}

// RFC 9421 §2.2.3: the authority of the target URI, lowercased, with a port
// only when it is not the scheme's default. URL.host is exactly that.
export const authority = (url) => new URL(url).host;

async function loadSigner(secret) {
  let jwk;
  try {
    jwk = JSON.parse(secret);
  } catch {
    throw new Error(`${KEY_VAR} is not JSON`);
  }
  if (
    jwk?.kty !== "OKP" ||
    jwk.crv !== "Ed25519" ||
    typeof jwk.x !== "string" ||
    typeof jwk.d !== "string"
  ) {
    throw new Error(`${KEY_VAR} is not an Ed25519 private JWK (kty OKP, crv Ed25519, x, d)`);
  }
  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: "OKP", crv: "Ed25519", x: jwk.x, d: jwk.d },
    { name: "Ed25519" },
    false,
    ["sign"],
  );
  const kid = await jwkThumbprint(jwk);
  // The public half, as the directory serves it. `nbf`/`exp` ride along from
  // the secret when the generator stamped them; a key without them is served
  // without them rather than with a made-up validity window.
  const publicJwk = { kty: "OKP", crv: "Ed25519", kid, x: jwk.x, use: "sig" };
  if (Number.isInteger(jwk.nbf)) publicJwk.nbf = jwk.nbf;
  if (Number.isInteger(jwk.exp)) publicJwk.exp = jwk.exp;
  return { key, kid, jwk: publicJwk };
}

// One import per isolate, keyed on the secret's own text so the tests (and a
// rotated secret, which arrives as a new isolate anyway) never see a stale
// key. Resolves to null when there is nothing to sign with.
let memoSecret;
let memoSigner;
export function signer(env) {
  const secret = env?.[KEY_VAR];
  if (secret === memoSecret && memoSigner) return memoSigner;
  memoSecret = secret;
  memoSigner = secret
    ? loadSigner(secret).catch((err) => {
        console.error(`[web-bot-auth] ${err.message}; requests go out unsigned`);
        return null;
      })
    : Promise.resolve(null);
  return memoSigner;
}

// RFC 9421 §2.5: the signature base is one line per covered component,
// `<identifier>: <value>`, then the `@signature-params` line, joined by LF
// with no trailing newline. The identifier is the component's serialized
// form, parameters included, exactly as it appears inside the Signature-Input
// list — so `"@authority";req` on the directory response is its own line.
export function signatureBase(components, params) {
  return [...components.map(([id, value]) => `${id}: ${value}`), `"@signature-params": ${params}`].join(
    "\n",
  );
}

// The params half of Signature-Input, in the order Cloudflare's own directory
// example writes them. The order is arbitrary to the spec but it is signed,
// so the tests rebuild the base from this exact string.
export function signatureParams(componentIds, { kid, nonce, tag, created, expires }) {
  return `(${componentIds.join(" ")});alg="ed25519";keyid="${kid}";nonce="${nonce}";tag="${tag}";created=${created};expires=${expires}`;
}

// 64 random bytes, base64: the size and encoding of every example in the
// drafts. Nothing verifies the nonce today; it is there so a replay of one
// signed request is at least distinguishable from a second one.
const nonce = () => b64(crypto.getRandomValues(new Uint8Array(64)));

async function sign(s, components, tag) {
  const created = Math.floor(Date.now() / 1000);
  const params = signatureParams(
    components.map(([id]) => id),
    { kid: s.kid, nonce: nonce(), tag, created, expires: created + SIGNATURE_TTL },
  );
  const sig = await crypto.subtle.sign("Ed25519", s.key, enc.encode(signatureBase(components, params)));
  return { "signature-input": `sig1=${params}`, signature: `sig1=:${b64(sig)}:` };
}

// fetch(), with the Web Bot Auth headers on when there is a key. The covered
// components are the two the architecture draft requires of an agent that
// sends Signature-Agent: the target's authority and the agent header itself.
// No `@method`, `@path` or content digest: Cloudflare's verifier accepts more,
// but the profile's minimum is what every verifier accepts, and the point is
// identity, not integrity of a public GET.
export async function signedFetch(url, init = {}, env) {
  const s = await signer(env);
  if (!s) return fetch(url, init);
  const agent = `"${SIGNATURE_AGENT}"`;
  const headers = new Headers(init.headers);
  headers.set("signature-agent", agent);
  const sig = await sign(
    s,
    [
      ['"@authority"', authority(url)],
      ['"signature-agent"', agent],
    ],
    "web-bot-auth",
  );
  for (const [name, value] of Object.entries(sig)) headers.set(name, value);
  return fetch(url, { ...init, headers });
}

// GET /.well-known/http-message-signatures-directory. A JWK Set with the one
// public key, signed with that key over the request's authority (`;req`,
// because this is a response signing a request component, and that is how
// Cloudflare's reference directory writes it). No key, no signature, and an
// empty set — never a placeholder.
export async function serveSignatureDirectory(request, env) {
  const s = await signer(env);
  const headers = {
    "content-type": DIRECTORY_CONTENT_TYPE,
    "cache-control": `public, max-age=${s ? DIRECTORY_MAX_AGE : EMPTY_MAX_AGE}`,
  };
  if (s) {
    Object.assign(
      headers,
      await sign(s, [['"@authority";req', authority(request.url)]], "http-message-signatures-directory"),
    );
  }
  return new Response(JSON.stringify({ keys: s ? [s.jwk] : [] }, null, 2), { headers });
}
