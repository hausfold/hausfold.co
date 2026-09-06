#!/usr/bin/env node
// scripts/web-bot-auth-key.mjs — mint the Ed25519 key the Worker signs its
// outbound requests with (Web Bot Auth; see worker-sign.js), in the shape the
// WEB_BOT_AUTH_KEY secret expects. Run it from a checkout of this repo, since
// wrangler reads wrangler.toml to know which Worker the secret belongs to:
//
//   node scripts/web-bot-auth-key.mjs | npx wrangler secret put WEB_BOT_AUTH_KEY
//
// The private half goes to stdout and nowhere else: never into the repo, never
// into a chat window. Stdout has to be a pipe; a terminal is refused. The
// public half, exactly as the directory will serve it, and its key id go to
// stderr, so after the next deploy you can compare against the live document:
//
//   curl -s https://hausfold.co/.well-known/http-message-signatures-directory
//
// Rotation is the same command again. The directory serves whatever the
// secret holds, and nothing in the repo knows the key, so no file changes.
//
// For the `wrangler dev` loop, `--dev-vars` writes the same secret into
// .dev.vars (gitignored) instead of stdout; wrangler reads it as the local
// environment.
//
// The key carries a validity window: nbf now, exp a year out, both served in
// the directory's JWK. A verifier stops trusting the key after exp, so a
// yearly rotation is the deal; the date is printed here and readable in the
// directory, and nothing on this site breaks if it lapses (GitHub does not
// verify), so it is a calendar entry rather than an alarm.

import { generateKeyPairSync, createHash } from "node:crypto";
import { writeFileSync } from "node:fs";

const VALID_FOR = 365 * 24 * 60 * 60;

const { privateKey } = generateKeyPairSync("ed25519");
const { kty, crv, x, d } = privateKey.export({ format: "jwk" });
const nbf = Math.floor(Date.now() / 1000);
const exp = nbf + VALID_FOR;
const secret = JSON.stringify({ kty, crv, x, d, nbf, exp });

// RFC 7638 thumbprint: the kid the directory serves and every signature names.
const kid = createHash("sha256")
  .update(JSON.stringify({ crv, kty, x }))
  .digest("base64url");

const iso = (t) => new Date(t * 1000).toISOString().slice(0, 10);

if (process.argv.includes("--dev-vars")) {
  writeFileSync(".dev.vars", `WEB_BOT_AUTH_KEY=${secret}\n`, { mode: 0o600 });
  console.error(`wrote .dev.vars (kid ${kid}); \`npx wrangler dev\` now signs with it`);
} else if (process.stdout.isTTY) {
  console.error(
    "This prints a private key. Pipe it straight into the secret rather than a terminal:\n" +
      "  node scripts/web-bot-auth-key.mjs | npx wrangler secret put WEB_BOT_AUTH_KEY",
  );
  process.exit(2);
} else {
  process.stdout.write(secret);
  console.error(
    `public key, as the directory will serve it:\n` +
      `  ${JSON.stringify({ kty, crv, kid, x, use: "sig", nbf, exp })}\n` +
      `valid ${iso(nbf)} to ${iso(exp)}; rotate with the same command before then`,
  );
}
