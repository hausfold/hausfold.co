// The data tables the Worker routes on, held in their own module.
//
// workerd refuses any named export from worker.js that is not an exported
// handler ("Incorrect type for map entry ... not of type 'function or
// ExportedHandler'"), so the values both worker.js and the tests need live
// here instead of being exported from there. test/openapi.test.js pins
// public/openapi.json against DESKTOPS, DOWNLOADABLE and MCP_TOOLS — a row
// added to one and not the spec should be a red test.
//
// The Worker's bundle is built from worker.js; wrangler inlines this import.

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
export const DESKTOPS = {
  haus: { repo: "hausfold/haus", pin: null },
  hacker: { repo: "hausfold/haus", pin: "hacker" },
  everyday: { repo: "hausfold/haus", pin: "everyday" },
  minimal: { repo: "hausfold/haus", pin: "minimal" },
};

// The apps with signed + notarized release artifacts on GitHub. Keys are the
// URL slugs; each repo lives at github.com/hausfold/<app>.
// A slug here is a promise to keep serving that app's latest release, so only
// apps the site actually presents belong in this set.
export const DOWNLOADABLE = new Set(["pounce", "perch"]);

// The version /mcp advertises. Supported-history is in worker.js; this export
// is what the OpenAPI-era tool table and the tests read.
export const MCP_PROTOCOL_VERSION = "2025-06-18";

// The two MCP transports, in one place. The server card, /mcp.json and
// /.well-known/mcp.json all read this, so a URL or a description can only be
// wrong in one spelling if it is wrong in every spelling. The keys are the
// names /mcp.json publishes, and `hausfold` is the full server: a client
// handed nothing else should open that one.
//
// Since 2026-09-06 DNS reads it too: scripts/dns-aid.mjs derives the
// `_mcp._agents.hausfold.co` SVCB record's target from `hausfold.url`, so a
// transport that moves here moves in DNS on the next push to main.
export const MCP_TRANSPORTS = {
  hausfold: {
    url: "https://hausfold.co/mcp",
    description:
      "Install commands, release metadata and docs search for hausfold's Mac software.",
  },
  "hausfold-docs": {
    url: "https://hausfold.co/mcp/docs",
    description: "Full-text search of the hausfold documentation alone.",
  },
};

// RFC 9728 Protected Resource Metadata. The resource this host serves is
// public: no token is needed to reach it, so authorization_servers is empty
// and no scopes are required. ⚠️ Empty even though AUTHORIZATION_SERVER below
// exists — that issuer grants nothing, and RFC 9728 says the list names the
// servers a client CAN use with the resource, so naming it would send a
// client after a token that cannot exist. The document exists so the URL
// auth.md names (and a 401 would advertise, if an endpoint ever started
// requiring credentials) resolves today instead of 404ing an agent
// mid-discovery.
export const PROTECTED_RESOURCE = {
  resource: "https://hausfold.co/",
  resource_documentation: "https://hausfold.co/auth.md",
  authorization_servers: [],
  scopes_supported: [],
  bearer_methods_supported: ["header"],
  response_types_supported: [],
};

// RFC 8414 Authorization Server Metadata. hausfold.co issues nothing, and the
// document says so in the protocol's own vocabulary: grant_types_supported and
// response_types_supported are empty, so a conforming client learns before
// its first request that no token can be had here. That is more than a 404
// tells it — a 404 leaves "no auth" and "not implemented" indistinguishable,
// which is the same reason PROTECTED_RESOURCE is published for a resource
// that needs no token.
//
// The three endpoints it names are real, because auth.md's own rule is that a
// discovery document naming a URL that 404s is worse than no document:
// /oauth/authorize answers that there is no client to authorize,
// /oauth/token answers RFC 6749's `unsupported_grant_type`, and
// /.well-known/jwks.json is an empty key set, the same shape as the Web Bot
// Auth directory serves before a key is installed (worker-sign.js).
// serveOAuthEndpoint() in worker.js is the whole of it. There is deliberately
// NO /.well-known/openid-configuration: OIDC metadata must claim an id_token
// signing algorithm, and this host signs no identity, so an honest OIDC
// document cannot be written.
//
// ⚠️ `issuer` has no trailing slash. RFC 8414 §3 derives the well-known URL
// from it and a client compares the value it read against the one it used,
// byte for byte; PROTECTED_RESOURCE.resource keeps its slash because RFC 9728
// works the other way round. Both are deliberate.
//
// The lists whose ABSENCE would imply a capability are [] rather than
// omitted: with no grant_types_supported a reader assumes authorization_code
// and implicit, with no token_endpoint_auth_methods_supported it assumes
// client_secret_basic, and with no response_modes_supported it assumes query
// and fragment. registration_endpoint, revocation_endpoint and
// introspection_endpoint are absent because absent is what they mean.
export const AUTHORIZATION_SERVER = {
  issuer: "https://hausfold.co",
  authorization_endpoint: "https://hausfold.co/oauth/authorize",
  token_endpoint: "https://hausfold.co/oauth/token",
  jwks_uri: "https://hausfold.co/.well-known/jwks.json",
  service_documentation: "https://hausfold.co/auth.md",
  op_policy_uri: "https://hausfold.co/privacy/",
  op_tos_uri: "https://hausfold.co/terms/",
  scopes_supported: [],
  response_types_supported: [],
  response_modes_supported: [],
  grant_types_supported: [],
  token_endpoint_auth_methods_supported: [],
  // The auth.md convention's registration-and-claim block, in the document
  // the convention says it belongs in. public/auth.md repeats it so that file
  // stands alone; the two move together.
  agent_auth: {
    skill: "https://hausfold.co/auth.md",
    identity_types_supported: ["anonymous"],
  },
};

// The JWK Set /.well-known/jwks.json serves and AUTHORIZATION_SERVER.jwks_uri
// names. No token is ever signed on this host, so there is no key to publish;
// an empty set is the honest statement of that. (The Web Bot Auth directory
// beside it is NOT this shape once its key is installed: that one holds the
// key the Worker signs its own outbound requests with, and lives in
// worker-sign.js.)
export const JWKS = { keys: [] };

// The token OpenAI's app portal fetches from
// /.well-known/openai-apps-challenge to prove we control this hostname before
// it will list the MCP server. It is a proof-of-control string, not a
// credential — it grants nothing, it is meant to be read by anyone, and the
// portal re-checks it, so it stays here after the verification passes:
// removing it unverifies the listing.
//
// ⚠️ No whitespace around it, and worker.js serves it bare with no trailing
// newline, because the checker compares the response body to the string it
// minted rather than trimming it.
export const OPENAI_APPS_CHALLENGE = "N7WuPKdjS6LawHM7XHT4S8zOseNBs0kVmmX0R7lPqVg";

// The MCP tool table. Descriptions and schemas are what agents see; the enum
// values are derived from the tables above so a desktop or app added to one
// place reaches the tool list without a second edit.
//
// Every tool here is a read: annotations say so explicitly (readOnlyHint,
// idempotentHint) rather than leaving an agent to infer it from the
// descriptions. `get_latest_release` reaches out to GitHub's API, so it
// carries openWorldHint: true; the other two read only what this Worker
// already serves.
//
// Every tool declares an outputSchema, and worker.js's toolResult returns the
// same object twice on success: as `structuredContent` for a client that
// planned against the schema, and serialized into the text block for one that
// did not. A client can then branch on fields it knows exist instead of
// parsing prose and hoping.
//
// 🚨 Each schema carries the `error` branch beside its payload, and requires
// one side or the other rather than the payload's keys outright. A tool
// failure is an isError result whose structuredContent is
// `{ error: { code, message } }`; a client that validates every
// structuredContent it is handed would otherwise reject the one payload it
// most needs to read. Widen the payload, never the anyOf.
const TOOL_ERROR = {
  type: "object",
  description: "Returned instead of the payload when the call failed. `isError` is set with it.",
  properties: {
    code: {
      type: "string",
      description: "Machine-readable failure code, e.g. unknown_desktop, release_unavailable.",
    },
    message: { type: "string", description: "Human-readable explanation." },
  },
  required: ["code", "message"],
  additionalProperties: false,
};

const withErrorBranch = (properties, required) => ({
  type: "object",
  properties: { ...properties, error: TOOL_ERROR },
  anyOf: [{ required }, { required: ["error"] }],
});

export const MCP_TOOLS = [
  {
    name: "get_install_command",
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    description:
      "Get the one-line install command for a hausfold desktop. Answers with a `desktops` list " +
      "either way: one row for the desktop you name, every row when you omit it.",
    inputSchema: {
      type: "object",
      properties: {
        desktop: {
          type: "string",
          enum: Object.keys(DESKTOPS),
          description: "The desktop to install. Omit to list every desktop.",
        },
      },
      required: [],
    },
    outputSchema: withErrorBranch(
      {
        desktops: {
          type: "array",
          description:
            "One row per desktop asked for: the named one alone, or all of them. Always a " +
            "list, so a caller reads the same shape either way.",
          items: {
            type: "object",
            properties: {
              desktop: { type: "string", enum: Object.keys(DESKTOPS) },
              command: { type: "string", description: "The one-line installer to run." },
              pins: {
                type: ["string", "null"],
                description: "The desktop this URL pins, or null when the URL asks which to build.",
              },
              note: { type: "string", description: "What running that line does." },
            },
            required: ["desktop", "command", "pins", "note"],
          },
        },
      },
      ["desktops"],
    ),
  },
  {
    name: "get_latest_release",
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    description:
      "Latest signed and notarized macOS release of a hausfold app: version tag, asset name, " +
      "size, direct download URL, publish date.",
    inputSchema: {
      type: "object",
      properties: {
        app: {
          type: "string",
          enum: [...DOWNLOADABLE],
          description: "A Mac app published by hausfold.",
        },
      },
      required: ["app"],
    },
    outputSchema: withErrorBranch(
      {
        tag: { type: "string", description: "The release tag, e.g. v2026.08.14." },
        asset: { type: "string", description: "File name of the macOS artifact." },
        size: { type: "integer", description: "Artifact size in bytes." },
        url: {
          type: "string",
          format: "uri",
          description: "Direct download URL for that artifact on GitHub.",
        },
        publishedAt: { type: "string", format: "date-time" },
      },
      ["tag", "asset", "size", "url", "publishedAt"],
    ),
  },
  {
    name: "search_docs",
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    description:
      "Full-text search of the hausfold documentation (haus, pounce, perch, trill, scruff). " +
      "Returns page URLs, breadcrumbs and an excerpt per match.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "What to look for, e.g. notifications, keybindings, do not disturb.",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 20,
          default: 8,
          description: "Maximum number of results.",
        },
      },
      required: ["query"],
    },
    outputSchema: withErrorBranch(
      {
        query: { type: "string", description: "The query as searched, echoed back." },
        results: {
          type: "array",
          description: "Highest scoring first, at most `limit` of them.",
          items: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "Site-relative docs URL, e.g. /docs/haus/reference/options.",
              },
              breadcrumbs: {
                type: "array",
                items: { type: "string" },
                description: "Where the section sits, outermost first.",
              },
              excerpt: { type: "string", description: "Text around the first match." },
              score: { type: "number", description: "Relative rank within this result set only." },
            },
            required: ["url", "breadcrumbs", "excerpt", "score"],
          },
        },
      },
      ["query", "results"],
    ),
  },
];

// The subset /mcp/docs serves: the documentation surface alone, so an agent
// that only wants to read the docs can subscribe to a transport whose tool
// list says so. /mcp keeps serving the full table (docs included) so existing
// clients see no change; the two servers share one implementation. Declared
// after MCP_TOOLS, which it is filtered from.
export const DOCS_MCP_TOOLS = MCP_TOOLS.filter((t) => t.name === "search_docs");

// The A2A (Agent2Agent) skills: what /.well-known/agent-card.json publishes
// and what /a2a answers. Each row names the MCP tool that does the work, so a
// skill is a second name for a tool and never a fourth capability —
// test/agent-surface.test.js holds the two tables to the same set, which is
// what "a fourth tool means a fourth skill in the same commit" costs now.
// `tool` is stripped before the card is served; every other key is the
// AgentSkill object verbatim (spec §4.4.5), so keep them spec-shaped.
export const A2A_SKILLS = [
  {
    id: "search-docs",
    name: "Docs search",
    description:
      "Full-text search of the haus, pounce, perch, trill and scruff manuals. Send a question as a " +
      "text part; the reply lists page URLs, breadcrumbs and an excerpt per match, as text and as a " +
      "data part.",
    tags: ["docs", "search", "macos", "nix"],
    examples: [
      "How do I turn on do not disturb?",
      '{"skill": "search-docs", "query": "keybindings", "limit": 5}',
    ],
    inputModes: ["text/plain", "application/json"],
    tool: "search_docs",
  },
  {
    id: "install-command",
    name: "Install command",
    description:
      "The one-line shell command that installs a haus desktop on a Mac. Send a data part naming " +
      `the skill and, optionally, a desktop (${Object.keys(DESKTOPS).join(", ")}); without one ` +
      "the reply lists every desktop.",
    tags: ["install", "shell", "macos"],
    examples: ['{"skill": "install-command", "desktop": "hacker"}', '{"skill": "install-command"}'],
    inputModes: ["application/json"],
    tool: "get_install_command",
  },
  {
    id: "latest-release",
    name: "Latest release",
    description:
      `The latest signed, notarized macOS release of ${[...DOWNLOADABLE].join(" or ")}: version ` +
      "tag, asset name and size, direct download URL, publish date. Send a data part naming the " +
      "skill and the app. Use before naming a version or checking for updates.",
    tags: ["releases", "downloads", "macos"],
    examples: ['{"skill": "latest-release", "app": "pounce"}'],
    inputModes: ["application/json"],
    tool: "get_latest_release",
  },
];
