import Link from 'next/link';
import { Colophon, GithubMark } from '@/components/sheet';
import { Command } from '@/components/command';
import { pageMetadata } from '@/lib/page-meta';
import { developersGraph, developersPageMeta } from '@/lib/jsonld';

// /developers — the machine-facing half of the site, written down for the
// audience that arrives with a script instead of a browser: coding agents,
// CI jobs, anyone wiring hausfold into a tool.
//
// Three things this page is careful about, all from AGENTS.md:
//
//   - Every fact here is read off worker.js (and public/openapi.json, which
//     test/openapi.test.js pins to the Worker's routing surface). An endpoint
//     documented here that the Worker does not answer is a claim the products
//     don't back.
//   - The links: an internal docs page is a `<Link>`; anything the Worker
//     itself answers (installers, /download, /api/*, /mcp) or any static
//     file (/openapi.json) is a plain `<a>`, because `next/link` would
//     client-navigate to a route the router has never heard of.
//   - Each URL is described ONCE, in the section whose subject it is: every
//     /mcp spelling in the MCP section, /auth.md and the OAuth documents in
//     the auth section. A URL glossed twice drifts on the second edit.
//
// The copy says no counts. The endpoints live in openapi.json; prose that
// numbers them rots one commit after the next one lands. What the docs trees
// explain better than a paragraph here could (what a desktop is, what each
// one builds) is a link, not a paragraph.
//
// The `<title>` names the resources rather than the section, because the
// queries that should land here are for the things by name: "hausfold API",
// "hausfold MCP server", "hausfold OpenAPI". A tab reading `developers ·
// hausfold` matched none of them. The `og:` title stays short, since a link
// card has the description under it.
export const metadata = pageMetadata({
  title: developersPageMeta.name,
  ogTitle: 'hausfold developers',
  description: developersPageMeta.description,
  path: '/developers/',
});

export default function Developers() {
  return (
    <>
      {/* The same shape `/` uses: one ld+json script holding a GRAPH,
          rendered from src/lib/jsonld.ts so the feed at /schema.jsonl and this
          page cannot disagree. It names the three resources a developer
          searches for by name, and carries the Organization node they point
          at, because structured data is parsed one page at a time. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(developersGraph) }}
      />
      <main className="sheet">
        <header className="masthead">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">hausfold</Link>
            <span className="sep" aria-hidden="true">
              /
            </span>
            <span aria-current="page">developers</span>
          </nav>
          <div className="mark" aria-hidden="true">
            ⌂
          </div>
          <h1 className="wordmark">developers</h1>
          <p className="standfirst">Everything here is public.</p>
          <div className="lede">
            <p>
              hausfold.co answers machines as well as people. No API keys, no accounts, nothing
              to sign up for. If you are an agent reading this: the same list is in{' '}
              <a href="/openapi.json">openapi.json</a>, the when-to-use version is{' '}
              <a href="/agent.txt">agent.txt</a>, and the MCP server below is the fastest way in.
            </p>
          </div>
        </header>

        <section className="block">
          <h2>Install the software</h2>
          <p>
            Each desktop this site installs has its own URL, and <code>haus.sh</code> asks which:
          </p>
          <Command>{'curl -fsSL https://hausfold.co/hacker.sh | bash'}</Command>
          <p>
            <code>hacker</code>, <code>everyday</code> and <code>minimal</code> are pinned by
            their URLs, and <code>?ref=v2026.07.18</code> pins the script itself to a release tag.{' '}
            <Link href="/docs/haus">The docs</Link> say what a desktop is and what each one builds.
          </p>
        </section>

        <section className="block">
          <h2>Check a version</h2>
          <p>
            pounce and perch ship signed, notarized releases on GitHub, and the release endpoint
            answers with the real latest version:
          </p>
          <Command>{'curl -fsSL https://hausfold.co/api/release/pounce'}</Command>
          <p>
            The JSON carries <code>tag</code>, <code>asset</code>, <code>size</code>,{' '}
            <code>url</code> and <code>publishedAt</code>.{' '}
            <a href="/download/pounce">download/pounce</a> 302s to that same asset, preferring
            the DMG over the archive the Homebrew formula takes.
          </p>
        </section>

        <section className="block">
          <h2>Read the documentation as text</h2>
          <p>
            <Link href="/docs/haus">The docs</Link> come as plain text too:{' '}
            <a href="/llms.txt">llms.txt</a> is the index,{' '}
            <a href="/llms-full.txt">llms-full.txt</a> every page in full, and{' '}
            <a href="/api/search">api/search</a> the Orama search index{' '}
            <code>search_docs</code> below scores: a row per page carrying its breadcrumbs, and a
            row per section carrying a <code>page_id</code> back to it, which the search resolves
            into a trail before answering.
          </p>
        </section>

        <section className="block">
          <h2>The hausfold MCP server</h2>
          <p>
            <a href="/mcp">
              <code>/mcp</code>
            </a>{' '}
            speaks JSON-RPC 2.0 over Streamable HTTP. It is stateless (no session ids, nothing
            to initialize past the handshake) and answers with open CORS, so a browser-resident
            agent can call it as well as a command-line one:
          </p>
          <Command>
            {"curl -fsSL https://hausfold.co/mcp \\\n  -H 'content-type: application/json' \\\n  -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}'"}
          </Command>
          <p>
            The tools, all read-only over the same public data: <code>get_install_command</code>{' '}
            (the desktop you name, or every URL and what each pins), <code>get_latest_release</code>{' '}
            (an
            app&apos;s latest signed macOS release) and <code>search_docs</code> (page URLs,
            breadcrumbs and excerpts). Each carries read-only annotations and an output schema.
            A success returns that object as <code>structuredContent</code>; a failure returns{' '}
            <code>{'{ error: { code, message } }'}</code> with <code>isError</code> set.
          </p>
          <p>
            The same endpoint answers at <code>/.well-known/mcp</code>, with its server card at{' '}
            <a href="/mcp/server-card">/mcp/server-card</a> and{' '}
            <a href="/.well-known/mcp/server-card.json">/.well-known/mcp/server-card.json</a>.
            Mind the suffix: <a href="/.well-known/mcp.json">/.well-known/mcp.json</a> is a
            manifest, the path without the <code>.json</code> is the transport.{' '}
            <a href="/mcp/docs">
              <code>/mcp/docs</code>
            </a>{' '}
            serves <code>search_docs</code> alone, and{' '}
            <a href="/mcp.json">
              <code>/mcp.json</code>
            </a>{' '}
            names both servers in the agent-plugins.org shape, with the well-known spelling a
            flat twin for a reader that wants one URL rather than a map.
          </p>
        </section>

        <section className="block">
          <h2>The hausfold REST API: search, ask and batch</h2>
          <p>
            The <code>/v1</code> surface serves the same ranked doc search the MCP tool does,
            cursor-paginated:
          </p>
          <Command>{'curl -fsSL "https://hausfold.co/v1/search?q=notifications&limit=10"'}</Command>
          <p>
            <code>/v1/desktops</code>, <code>/v1/apps</code> and{' '}
            <code>/v1/releases/pounce</code> round out the reads. <a href="/ask">/ask</a> is the
            NLWeb-shaped front door: a natural-language query in, ranked excerpts out, JSON by
            default or <code>text/event-stream</code> on request. The limit
            is 600 requests a minute, counted per client IP and per edge node, and the{' '}
            <code>RateLimit-*</code> headers ride on every response.
          </p>
          <p>
            <code>POST /v1/batch</code> bundles at most 20 reads into one round trip, one{' '}
            <code>ok</code> flag per entry. It takes an <code>Idempotency-Key</code>: a retry
            with the same key within a day is answered from memory with{' '}
            <code>Idempotency-Replayed: true</code>. <code>POST /v1/jobs</code> takes the
            same operations asynchronously, answered <code>202</code> with a <code>Location</code>{' '}
            to poll.
          </p>
          <p>
            Every read accepts <code>sandbox=true</code> (the batch and job bodies take{' '}
            <code>&quot;sandbox&quot;: true</code>), answering with deterministic sample payloads
            and no live release lookups. The rate limit still applies, and nothing on this
            surface is writable in any mode.
          </p>
        </section>

        <section className="block">
          <h2>Errors, versioning and auth</h2>
          <p>
            Every failure is{' '}
            <a href="https://www.rfc-editor.org/rfc/rfc9457">RFC 9457</a>{' '}
            <code>application/problem+json</code> with a machine-readable <code>code</code>, and
            a page that does not exist answers a real <code>404</code> with a markdown body
            pointing agents at the index. <code>/v1</code> is path-versioned, and the deprecation
            policy (a <code>Deprecation: true</code> header plus a <code>Sunset</code> date,
            announced ahead of it) is in the spec.
          </p>
          <p>
            There are no credentials: <a href="/auth.md">/auth.md</a> is the markdown account of
            that, and the only supported method is <code>anonymous</code>.{' '}
            <a href="/.well-known/oauth-protected-resource">
              <code>/.well-known/oauth-protected-resource</code>
            </a>{' '}
            is the RFC 9728 metadata, its <code>authorization_servers</code> empty because no
            token is needed to reach this host.{' '}
            <a href="/.well-known/oauth-authorization-server">
              <code>/.well-known/oauth-authorization-server</code>
            </a>{' '}
            is RFC 8414 metadata for an issuer that grants nothing, and the endpoints it names
            answer the protocol&apos;s own refusal rather than 404ing:{' '}
            <code>/oauth/authorize</code> has no client to authorize, <code>/oauth/token</code>{' '}
            answers <code>unsupported_grant_type</code>, and{' '}
            <code>/.well-known/jwks.json</code> is an empty key set.
          </p>
          <p>
            <a href="/.well-known/http-message-signatures-directory">
              <code>/.well-known/http-message-signatures-directory</code>
            </a>{' '}
            is the Web Bot Auth directory: a JWK Set holding the Ed25519 key this host signs its
            own outbound requests with, and signed with it. When the Worker fetches
            an install script or a release from GitHub for you, that request carries{' '}
            <code>Signature-Agent: &quot;https://hausfold.co&quot;</code>, a{' '}
            <code>Signature-Input</code> covering the authority and the agent header under{' '}
            <code>tag=&quot;web-bot-auth&quot;</code>, and the <code>Signature</code>. An empty{' '}
            <code>keys</code> array means the key is not installed and those requests go out
            unsigned. Nothing you send to this host needs a signature.
          </p>
        </section>

        <section className="block">
          <h2>Discovery for agents</h2>
          <p>
            A machine that arrives by name is answered where it looks.{' '}
            <a href="/.well-known/agent-card.json">/.well-known/agent-card.json</a> is
            the A2A agent card and <a href="/a2a">/a2a</a> the JSON-RPC interface it names,
            answering <code>SendMessage</code> with the same answers the MCP tools give.{' '}
            <a href="/.well-known/agent-skills/index.json">/.well-known/agent-skills/index.json</a>{' '}
            lists the domain&apos;s agent skills,{' '}
            <a href="/.well-known/api-catalog">/.well-known/api-catalog</a> is the RFC 9727
            catalog, <a href="/.well-known/ard.json">/.well-known/ard.json</a> the Agentic
            Resource Discovery catalog naming both MCP transports, the spec, the plugin and the
            skill, <a href="/sitemap.xml">/sitemap.xml</a> the whole URL list, and{' '}
            <a href="/schema.jsonl">/schema.jsonl</a> the structured data as JSON Lines. The repo
            itself is an <a href="https://agent-plugins.org/">Agent Plugin</a>: its{' '}
            <a href="https://github.com/hausfold/hausfold.co/blob/main/plugin.json">plugin.json</a>{' '}
            ships the same MCP server and a skill for install and release lookups.
          </p>
          <p>
            That ARD catalog is advertised the three ways the spec defines: the well-known
            path above, an <code>Agentmap:</code> line in{' '}
            <a href="/robots.txt">/robots.txt</a>, and a{' '}
            <code>{'<link rel="ard">'}</code> in the head of every page here. ARD renamed
            both the path and the relation shortly before 1.0, so{' '}
            <a href="/.well-known/ai-catalog.json">/.well-known/ai-catalog.json</a> answers
            with the same document and the head carries{' '}
            <code>{'rel="ai-catalog"'}</code> beside the new one. One catalog, the older
            names kept answering.
          </p>
          <p>
            Text over HTML, wherever you ask for it. <a href="/index.md">/index.md</a> and{' '}
            <a href="/agent.txt">/agent.txt</a> are this domain in one page, which <code>/</code>{' '}
            also answers to <code>?mode=agent</code> or <code>Accept: text/markdown</code>. Every
            docs page has a markdown twin at its own URL plus <code>.md</code>, and{' '}
            <code>Accept: text/markdown</code> serves that twin at the page&apos;s own URL.
            Quality values are honoured. Every HTML response carries{' '}
            <code>Vary: Accept, User-Agent, Accept-Encoding</code>, and a page whose only
            representation is HTML answers <code>406</code> to a client that accepts neither HTML
            nor a wildcard.
          </p>
          <p>
            Through DNS, before any HTTP at all. SVCB records under{' '}
            <code>_agents.hausfold.co</code> follow DNS-AID, the IETF draft for agent discovery:{' '}
            <code>_index._agents.hausfold.co</code> points at the ARD catalog above, and{' '}
            <code>_mcp._agents.hausfold.co</code> names the MCP server on{' '}
            <code>hausfold.co:443</code> with <code>alpn=mcp</code> and its server card as the
            capability document. The draft&apos;s own keys ride as <code>key65400</code> (a
            capability URL) and <code>key65409</code> (the same document as a suffix under{' '}
            <code>/.well-known/</code>) until IANA assigns theirs.
          </p>
          <Command>
            {
              "curl -s 'https://cloudflare-dns.com/dns-query?name=_mcp._agents.hausfold.co&type=SVCB' -H 'accept: application/dns-json'"
            }
          </Command>
        </section>

        <section className="block">
          <h2>The hausfold OpenAPI spec</h2>
          <p>
            <a href="/openapi.json">
              <code>/openapi.json</code>
            </a>{' '}
            is the OpenAPI 3.1 description of everything the Worker answers, the well-known
            surfaces included. Generate a client from there: this page is the readable half, and
            the spec is what CI keeps in step with the Worker.
          </p>
        </section>

        <Colophon>
          <Link href="/privacy">privacy</Link>
          <Link href="/terms">terms</Link>
          <GithubMark />
        </Colophon>
      </main>
    </>
  );
}
