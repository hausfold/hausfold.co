# hausfold.co auth.md

Every endpoint listed in [openapi.json](https://hausfold.co/openapi.json) is public. You do not need an API key, an account, or an OAuth token to call anything on this host. This file exists so an agent can verify that claim by reading instead of by probing.

## Discover

The machine-facing surface is described in these places, all on this host:

- [openapi.json](https://hausfold.co/openapi.json): the REST and MCP surface, with typed schemas and the error model.
- [/developers/](https://hausfold.co/developers/): the same surface written for a human, with quickstarts.
- [/.well-known/mcp/server-card.json](https://hausfold.co/.well-known/mcp/server-card.json): the MCP server card, for previewing the tools before opening a transport. Two MCP transports are served: [/mcp](https://hausfold.co/mcp) and a docs-only [/mcp/docs](https://hausfold.co/mcp/docs); the manifest naming both is at [/mcp.json](https://hausfold.co/mcp.json).
- [/.well-known/oauth-protected-resource](https://hausfold.co/.well-known/oauth-protected-resource): RFC 9728 Protected Resource Metadata. It is published even though nothing here requires authentication: `resource` names this host, `resource_documentation` points back at this file, and `authorization_servers` is empty because no token is needed to reach the resource; the issuer this host describes grants none, so listing it would send a client after a token that cannot exist. The document exists so discovery never walks into a 404.
- [/.well-known/oauth-authorization-server](https://hausfold.co/.well-known/oauth-authorization-server): RFC 8414 Authorization Server Metadata for an issuer that grants nothing. `issuer` is this host, and `grant_types_supported` and `response_types_supported` are empty, so a client that reads it knows before its first request that no token can be had. The endpoints it names exist, because a discovery document that points at dead URLs is worse than none: [/oauth/authorize](https://hausfold.co/oauth/authorize) answers that there is no client to authorize, `POST /oauth/token` answers `unsupported_grant_type` in RFC 6749's own shape, and [/.well-known/jwks.json](https://hausfold.co/.well-known/jwks.json) is an empty key set. There is no `/.well-known/openid-configuration`: hausfold.co issues no identity and is not an OpenID Provider.
- [/.well-known/http-message-signatures-directory](https://hausfold.co/.well-known/http-message-signatures-directory): the Web Bot Auth directory, a JWK Set with the Ed25519 key this host signs its own outbound requests with. That is the other direction from everything else on this page: when the Worker fetches an install script or a release from GitHub on your behalf, the request carries `Signature-Agent: "https://hausfold.co"`, a `Signature-Input` covering `@authority` and `signature-agent` under `tag="web-bot-auth"`, and the `Signature`, so a receiver can check it against this directory. An empty `keys` array means the signing key is not installed on the Worker and those requests go out unsigned. Nothing you send to this host needs a signature.

## Pick a method

hausfold.co supports exactly one method today: `anonymous`. Requests without credentials are served at the same rate limits as everyone else's.

There is no `identity_assertion` offering, no `service_auth` key issuance, and no `id-jag` token exchange. If a future endpoint starts requiring credentials, its unauthenticated response will carry a `WWW-Authenticate: Bearer resource_metadata="https://hausfold.co/.well-known/oauth-protected-resource"` header, and this file will change in the same commit. Today no endpoint returns a 401, so no such header is advertised; an agent can confirm that with one request.

## agent_auth

The auth.md convention carries the registration and claim surface in an `agent_auth` block inside authorization-server metadata, and that is where it lives: [/.well-known/oauth-authorization-server](https://hausfold.co/.well-known/oauth-authorization-server) carries this block, naming the one identity type that exists. It is repeated here so this file stands alone:

```json
{
  "agent_auth": {
    "skill": "https://hausfold.co/auth.md",
    "identity_types_supported": ["anonymous"]
  }
}
```

`anonymous` needs no endpoints: nothing is minted, nothing is claimed, nothing announces revocation events. The `identity_endpoint`, `claim_endpoint` and `events_endpoint` fields are therefore absent rather than pointing at URIs that would 404. An `identity_assertion` entry would carry an `identity_assertion.assertion_types_supported` block (the ID-JAG URN belongs there, not at the top level); none is advertised because none is accepted.

## Register

Nothing to register. No key issuer, no developer console, no contact-sales gate. Agents cannot fill out forms, so there are none between a request and an answer.

## Claim

Not applicable. With no identity provider behind this host, there is nothing to claim. The `agent_auth` block of the auth.md convention names an `identity_endpoint`, a `claim_endpoint` and an `events_endpoint` for hosts that mint identity assertions; hausfold.co mints none, so none are advertised. Advertising endpoints that do not exist would be worse than advertising none: an agent would waste a request on a dead URI.

## Exchange

Not applicable. The authorization server this host describes supports no grant types, so there is no token exchange, no assertion minting, and no `id-jag` grant. `/.well-known/oauth-authorization-server` says so up front (`grant_types_supported` is empty), and `POST /oauth/token` answers `unsupported_grant_type` to any grant type named (and `invalid_request` to a request naming none).

## Use the access_token

Not applicable: no tokens are issued here, so there is no token to use. If you are building an agent against this host, send no `Authorization` header at all. A request that sends one anyway is not rejected; the header is simply ignored.

## Errors

All JSON endpoints return RFC 9457 `application/problem+json` on failure, with a stable machine-readable `code` field (see the `problem` schema in openapi.json for the full enumeration). Rate limiting answers `429 Too Many Requests` with `Retry-After`, and every response on the machine-facing surface the Worker itself answers carries the `RateLimit-Limit`, `RateLimit-Remaining` and `RateLimit-Reset` headers so an agent can self-throttle without ever being throttled. (Static files passed through the asset server, such as `/api/search` and the llms.txt files, are the exception: no limiter stands in front of them.)

## Revocation

Nothing to revoke: no credentials are issued, so there are none to revoke and none to rotate. If that ever changes, revocation instructions will appear in this section before the credential-issuing endpoint goes live, not after.

## Reference

The auth.md convention is WorkOS's: [github.com/workos/auth.md](https://github.com/workos/auth.md). This file follows its section structure.
