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

// haus's room registry, snapshotted into this repository by
// `scripts/check-rooms.mjs --update` and inlined into the bundle the same way
// this module is: the Worker cannot reach haus at runtime, so `/v1/rooms`
// reads the snapshot. ROOMS, below, is what this side of the boundary adds.
import roomRegistry from "./src/data/rooms.json" with { type: "json" };

// The desktops gallery: every desktop this site presents, in the order it
// presents them. One table, read by `/v1/desktops`, the MCP tool, the agent
// view, the A2A skill and `content/docs/haus/desktops/choosing.mdx` alike, so
// a row added here reaches all five.
//
// A row is a promise to present that desktop, and it carries what a card
// needs:
//
//   author   whose name goes on the card. Not derived from `repo`: a desktop
//            hausfold publishes for someone else would name them, not us.
//   blurb    one sentence, the whole of what the card says it is for.
//   rooms    the rooms it switches ON, in the registry's order (the keys in
//            src/data/rooms.json). A room with no switch of its own —
//            Appearance — is not in the list even when the desktop sets values
//            inside it, because the list answers "what turns on".
//   image    a screenshot, when one exists. Null on every row today: this site
//            ships no screenshots (AGENTS.md says why), and the field is here
//            so `/v1/desktops` can carry one the day a desktop has it.
//
// ⚠️ Two kinds of row, and `flakeref` is the whole difference.
//
// **No `flakeref`**: hausfold presents it from this domain, and the key is the
// name in the URL — a promise that `hausfold.co/<key>.sh` keeps resolving.
// `pin` says which desktop that URL selects, and `pin: null` is the front
// door: `/haus.sh` installs the foundation, the layer with no desktop (no bar,
// no tiling, no palette, no wallpaper until a room is turned on) and asks no
// desktop question at all. Both rows map to `hausfold/haus` because the file
// each fetches is that repo's `bootstrap.sh`, and `hacker` ships inside it as
// `desktops/hacker.nix`; `repo` exists to say where the script comes from, so
// the day a desktop lives in a repo we don't own, it is already where that
// goes. `repo` belongs to this kind of row alone.
//
// **A `flakeref`**: a desktop in its own repo, with NO installer URL on this
// domain, no `pin` and no `repo` — it proxies no script, and the flakeref is
// already where the source lives. It installs by flag (`--desktop=<flakeref>`, haus
// #733), which is how anybody's desktop installs; being in the gallery buys a
// card, not a short URL. That is deliberate — the domain never lends its name
// to a repo nobody read — and it is why `INSTALLER_DESKTOPS` below, not this
// table, is what `/<name>.sh` routes on.
export const DESKTOPS = {
  haus: {
    repo: "hausfold/haus",
    pin: null,
    author: "hausfold",
    blurb:
      "The layer and nothing on screen: the haus CLI, the shell, the app roster and the rebuild plumbing, with every optional room left off.",
    rooms: [],
    image: null,
  },
  hacker: {
    repo: "hausfold/haus",
    pin: "hacker",
    author: "hausfold",
    blurb:
      "Keyboard-first, for someone who writes code all day: tiled windows, a bar, the palette on ⌘Space, coding agents and a themed terminal.",
    rooms: ["development", "windows", "bar", "launcher", "shelf", "focus", "ai", "security"],
    image: null,
  },
  producer: {
    flakeref: "github:hausfold/producer-desktop",
    author: "hausfold",
    blurb:
      "A studio Mac, built around Ableton, RX and Resolve and leaving all three alone: the palette opens on ⌘Space, and the tiler stays off so Caps Lock is still Caps Lock.",
    rooms: ["bar", "launcher", "shelf", "focus", "security"],
    image: null,
  },
};

// The rows `/<name>.sh` serves: the ones with no `flakeref`, which is the same
// thing as the ones whose key is a URL this domain promises. Derived rather
// than a second list, so a row can't be in one and missing from the other.
export const INSTALLER_DESKTOPS = Object.fromEntries(
  Object.entries(DESKTOPS).filter(([, row]) => row.flakeref == null),
);

// One gallery row, the shape every surface hands back: `/v1/desktops`, the
// `get_install_command` tool, the `install` batch op and the A2A skill all call
// this, so none of them can describe a desktop differently from the others.
//
// `command` is the one line that installs it on a fresh Mac, and the two kinds
// of row differ only there: a hausfold URL, or `/haus.sh` plus the
// `--desktop=<flakeref>` flag that pins and selects a desktop from its own
// repo. `pins` is the desktop a hausfold URL selects and stays null on a
// flakeref row, which has no URL to pin anything; a client that wants to know
// which kind it is reads `flakeref`.
export function desktopRow(desktop) {
  // `image` defaults too: `/v1/desktops` and the tool's outputSchema both mark
  // it required, so a row that omits it must still answer null rather than drop
  // the key.
  const { pin = null, flakeref = null, image = null, author, blurb, rooms } = DESKTOPS[desktop];
  return {
    desktop,
    author,
    blurb,
    rooms,
    image,
    flakeref,
    command: flakeref
      ? `curl -fsSL https://hausfold.co/haus.sh | bash -s -- --desktop=${flakeref}`
      : `curl -fsSL https://hausfold.co/${desktop}.sh | bash`,
    pins: pin,
  };
}

// Installer URLs that were published and are no longer presented. A URL that
// was in someone's shell history keeps resolving forever (the same promise
// `_redirects` makes for a page), so these are served by `/<name>.sh` exactly
// as a DESKTOPS row is — but they appear in no listing, so nothing hands them
// to a new reader. bootstrap.sh reads the pinned name as a retired spelling
// and installs the foundation plus the rooms that desktop turned on.
//
// 🚨 Never move a key from here back to DESKTOPS, and never delete one: the
// first re-presents a desktop haus no longer ships, the second breaks a
// command someone saved.
export const RETIRED_INSTALLERS = {
  everyday: { repo: "hausfold/haus", pin: "everyday" },
  minimal: { repo: "hausfold/haus", pin: "minimal" },
};

// ---------------------------------------------------------------------------
// The rooms gallery: every room this site presents, in the order it presents
// them. One table, read by `/v1/rooms` and by
// `content/docs/haus/rooms/index.mdx` alike, so a row added here reaches both.
//
// What is NOT here: which rooms exist, their titles, their order, and the
// `haus.*` namespaces each one owns. That is haus's registry
// (`modules/options-groups.nix`, published as `docs/site-data/groups.json`),
// snapshotted into src/data/rooms.json and imported at the top of this file. A
// second hand-typed copy of the room list is the drift `check-rooms.mjs`
// exists to catch, so the snapshot IS the copy and one script keeps it honest.
//
// What IS here is this repository's half of a card: the sentence and the icon.
// haus writes its blurbs for the options reference, where they say things like
// "a shared surface below" and where Notifications' runs to 630 characters and
// cites a file path in the haus tree. A card, the CLI and `/v1/rooms` all want
// the short sentence instead, and this is where it is written once.
//
// ⚠️ Two kinds of row, and `flakeref` is the whole difference.
//
// **No `flakeref`**: a room haus ships. Its key is the registry's key, which
// is also its page here, and `check-rooms.mjs` holds this half to the registry
// exactly — one row per room haus publishes, in haus's order. Nothing installs
// it, because it is already installed: its page says which option turns it on,
// and `command` is null.
//
// **A `flakeref`**: somebody else's room, in its own repo. It carries its own
// `title` and the `namespace` haus files it under, because neither can be read
// without running the author's code (rooms/index says why), and it installs
// with `haus add --room --namespace`. None today, and a row here is a promise
// that hausfold has read the code, so no row goes in ahead of the reading.
//
// `icon` is the page's alone and `/v1/rooms` does not serve it. It is a name
// from src/lib/icons.tsx, and it sits on the row so that everything one card
// needs is in one place.
export const ROOMS = {
  apps: {
    icon: "apps",
    author: "hausfold",
    blurb:
      "Every app, font and CLI tool, where each installs from, and what a rebuild does to anything you added by hand.",
  },
  appearance: {
    icon: "palette",
    author: "hausfold",
    blurb:
      "The palette, the accent, the wallpaper, the fonts, and the macOS surfaces that follow them.",
  },
  displays: {
    icon: "display",
    author: "hausfold",
    blurb: "Per-screen scaling, said as an intent rather than a pixel count.",
  },
  development: {
    icon: "shell",
    author: "hausfold",
    blurb:
      "Ghostty, zmx, zsh, the editor and the browser, plus Git tooling, the CLI toolbelt and language runtimes.",
  },
  windows: {
    icon: "tiling",
    author: "hausfold",
    blurb:
      "Tiling, named workspaces, hot corners, and a leader key that throws a window anywhere.",
  },
  bar: {
    icon: "bar",
    author: "hausfold",
    blurb:
      "A status bar: workspaces, weather, media, battery, clock, and a second one at the bottom if you want it.",
  },
  launcher: {
    icon: "launcher",
    author: "hausfold",
    blurb: "A ⌘Space command palette where every command is a file.",
  },
  shelf: {
    icon: "shelf",
    author: "hausfold",
    blurb: "A file shelf that drops out of the notch to catch what you drag at it.",
  },
  notifications: {
    icon: "notifications",
    author: "hausfold",
    blurb:
      "Whose banners you see: haus draws through trill, can own the bundle, and announces new mail.",
  },
  focus: {
    icon: "moon",
    author: "hausfold",
    blurb:
      "One quiet switch for Do Not Disturb, your status and your own hooks, with a timer on it and scenes your Mac can enter by itself.",
  },
  ai: {
    icon: "agent",
    author: "hausfold",
    blurb: "Coding agents, each with its own checkout of the repo it is working on.",
  },
  "text-expansion": {
    icon: "expand",
    author: "hausfold",
    blurb: "Type a short trigger, get the long thing, in any app.",
  },
  security: {
    icon: "shield",
    author: "hausfold",
    blurb:
      "Touch ID for sudo, lock and login-window behaviour, the firewall, and where secret values come from.",
  },
};

// The registry, keyed and rooms-only. The two owners that are not rooms — the
// shared surfaces and the host — are in the snapshot because the namespace
// table on rooms/index resolves every public `haus.*` name through it. They
// are not rooms, so they are not in the gallery.
export const ROOM_REGISTRY = Object.fromEntries(
  roomRegistry.rooms.filter((room) => room.kind === "room").map((room) => [room.key, room]),
);

// One gallery row, the shape every surface hands back. `/v1/rooms` calls this,
// and so does the renderer behind rooms/index, so neither can describe a room
// differently from the other.
//
// The registry answers for a room haus ships: its title, the namespaces it
// owns, the page it has here. A room in its own repo has none of those on this
// side, so the row carries its own title and the one namespace the reader
// claims for it, and `docs` is null rather than a URL that 404s.
// `rooms` defaults to the table and is a parameter so that the renderer behind
// rooms/index can be handed one: there is no third-party row today, and a shape
// nothing renders is a shape nothing checks.
export function roomRow(room, rooms = ROOMS) {
  const { flakeref = null, namespace = null, title = null, author, blurb } = rooms[room];
  // Keyed off `flakeref`, not off whether the registry happens to have the key:
  // a third-party row named `bar` would otherwise be handed the Bar room's page
  // and its namespaces, and nothing downstream would notice.
  const registry = flakeref ? null : ROOM_REGISTRY[room];
  return {
    room,
    title: registry ? registry.title : title,
    author,
    blurb,
    namespaces: registry
      ? registry.namespaces.map((ns) => `haus.${ns}`)
      : [`haus.${namespace}`],
    flakeref,
    docs: registry ? `https://hausfold.co/docs/haus/rooms/${room}` : null,
    // A room haus ships is already on the machine; turning it on is an option
    // in your host file, which its page names. Only somebody else's room has
    // an install line, and `haus add --room` is answered by typing rather than
    // by `-y` because pinning a room runs its author's code.
    command: flakeref ? `haus add --room --namespace ${namespace} ${flakeref}` : null,
  };
}

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
// credential — it grants nothing and it is meant to be read by anyone. Keep
// it after the verification passes: the portal is free to check again, and
// nothing tells us when it does, so the cost of holding a public string is
// smaller than the cost of a listing that quietly unverifies.
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
      "Get the one-line install command for a hausfold desktop, with the card the gallery shows " +
      "for it: who wrote it, what it is for, and the rooms it turns on. Answers with a " +
      "`desktops` list either way: one row for the desktop you name, every row when you omit it.",
    inputSchema: {
      type: "object",
      properties: {
        desktop: {
          type: "string",
          enum: Object.keys(DESKTOPS),
          description: "The desktop to install. Omit to list the whole gallery.",
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
              author: { type: "string", description: "Who publishes this desktop." },
              blurb: { type: "string", description: "One sentence on what it is for." },
              rooms: {
                type: "array",
                items: { type: "string" },
                description:
                  "The rooms it switches on, by the name in haus's registry. Empty for the foundation, which switches none on.",
              },
              image: {
                type: ["string", "null"],
                description: "A screenshot URL, or null when there is none.",
              },
              flakeref: {
                type: ["string", "null"],
                description:
                  "For a desktop in its own repo, the flakeref `--desktop=` takes. Null for one hausfold serves from its own URL.",
              },
              command: { type: "string", description: "The one-line installer to run." },
              pins: {
                type: ["string", "null"],
                description:
                  "The desktop this URL pins. Null for /haus.sh, which installs the foundation with no desktop, and null on a flakeref row, which has no URL here at all.",
              },
              note: { type: "string", description: "What running that line does." },
            },
            required: [
              "desktop",
              "author",
              "blurb",
              "rooms",
              "image",
              "flakeref",
              "command",
              "pins",
              "note",
            ],
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

// Where the A2A agent answers, and where its card is. Here rather than in
// worker.js for the same reason MCP_TRANSPORTS is, recorded above: a node
// script cannot import the Worker, and worker.js exports only handlers.
// scripts/dns-aid.mjs derives the `_a2a._agents.hausfold.co` SVCB record from
// these two — the record's target is the card's hostname and its capability
// document is the card. The card is served at the path A2A's own discovery
// convention puts it at, which is also the DNS-AID draft's worked example
// (`well-known=agent-card.json`), so the HTTP and DNS spellings of "where is
// the card" are one string.
export const A2A_ENDPOINT = {
  url: "https://hausfold.co/a2a",
  cardUrl: "https://hausfold.co/.well-known/agent-card.json",
  protocolBinding: "JSONRPC",
  protocolVersion: "1.0",
};

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
      "the reply lists the whole gallery, each row with its author, what it is for and the rooms " +
      "it turns on.",
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
