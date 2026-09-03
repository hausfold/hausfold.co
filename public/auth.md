# Authentication for hausfold.co

Every endpoint listed in [openapi.json](https://hausfold.co/openapi.json) is public. You do not need an API key, an account, or an OAuth token to call anything on this host. This file exists so an agent can verify that claim by reading instead of by probing.

## Discover

The machine-facing surface is described in three places, all on this host:

- [openapi.json](https://hausfold.co/openapi.json): the REST and MCP surface, with typed schemas and the error model.
- [/developers/](https://hausfold.co/developers/): the same surface written for a human, with quickstarts.
- [/.well-known/mcp/server-card.json](https://hausfold.co/.well-known/mcp/server-card.json): the MCP server card, for previewing the tools before opening a transport.

## Pick a method

hausfold.co supports exactly one method today: `anonymous`. Requests without credentials are served at the same rate limits as everyone else's.

There is no `identity_assertion` offering, no `service_auth` key issuance, and no `id-jag` token exchange. If a future endpoint starts requiring credentials, its unauthenticated response will carry a `WWW-Authenticate: Bearer resource_metadata="https://hausfold.co/.well-known/oauth-protected-resource"` header, and this file will change in the same commit. Today no endpoint returns a 401, so no such header is advertised; an agent can confirm that with one request.

## Register

Nothing to register. No key issuer, no developer console, no contact-sales gate. Agents cannot fill out forms, so there are none between a request and an answer.

## Claim

Not applicable. With no identity provider behind this host, there is nothing to claim. The `agent_auth` block of the auth.md convention names an `identity_endpoint`, a `claim_endpoint` and an `events_endpoint` for hosts that mint identity assertions; hausfold.co mints none, so none are advertised. Advertising endpoints that do not exist would be worse than advertising none: an agent would waste a request on a dead URI.

## Exchange

Not applicable. There is no authorization server behind this host, so there is no token exchange, no assertion minting, and no `id-jag` grant. Correspondingly there is no `/.well-known/oauth-authorization-server` document, and the absence is deliberate rather than an oversight.

## Use the access_token

Not applicable: no tokens are issued here, so there is no token to use. If you are building an agent against this host, send no `Authorization` header at all. A request that sends one anyway is not rejected; the header is simply ignored.

## Errors

All JSON endpoints return RFC 9457 `application/problem+json` on failure, with a stable machine-readable `code` field (see the `problem` schema in openapi.json for the full enumeration). Rate limiting answers `429 Too Many Requests` with `Retry-After`, and every response on the machine-facing surface carries the `RateLimit-Limit`, `RateLimit-Remaining` and `RateLimit-Reset` headers so an agent can self-throttle without ever being throttled.

## Revocation

Nothing to revoke: no credentials are issued, so there are none to revoke and none to rotate. If that ever changes, revocation instructions will appear in this section before the credential-issuing endpoint goes live, not after.

## Reference

The auth.md convention is WorkOS's: [github.com/workos/auth.md](https://github.com/workos/auth.md). This file follows its section structure.
