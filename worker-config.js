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

// The MCP tool table. Descriptions and schemas are what agents see; the enum
// values are derived from the tables above so a desktop or app added to one
// place reaches the tool list without a second edit.
export const MCP_TOOLS = [
  {
    name: "get_install_command",
    description:
      "Get the one-line install command for a hausfold desktop. Omit `desktop` to list every " +
      "desktop and what each URL installs.",
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
  },
  {
    name: "get_latest_release",
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
  },
  {
    name: "search_docs",
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
  },
];
