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

// RFC 9728 Protected Resource Metadata. The resource this host serves is
// public: no authorization server stands behind it, so authorization_servers
// is empty rather than pointing at an issuer that does not exist, and no
// scopes are required. The document exists so the URL auth.md names (and a
// 401 would advertise, if an endpoint ever started requiring credentials)
// resolves today instead of 404ing an agent mid-discovery.
export const PROTECTED_RESOURCE = {
  resource: "https://hausfold.co/",
  resource_documentation: "https://hausfold.co/auth.md",
  authorization_servers: [],
  scopes_supported: [],
  bearer_methods_supported: ["header"],
  response_types_supported: [],
};

// The Web Bot Auth directory (draft-ietf-httpbis-unprompted-auth): the set of
// Ed25519 keys this host signs its responses with. hausfold.co signs no
// responses, so the array is empty — an honest directory rather than a
// fabricated key. If response signing ever lands, the keys go here and
// nowhere else.
export const SIGNATURE_DIRECTORY = { keys: [] };

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
