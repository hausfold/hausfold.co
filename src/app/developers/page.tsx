import Link from 'next/link';
import { Colophon, GithubMark } from '@/components/sheet';
import { Command } from '@/components/command';
import { pageMetadata } from '@/lib/page-meta';

// /developers — the machine-facing half of the site, written down for the
// audience that arrives with a script instead of a browser: coding agents,
// CI jobs, anyone wiring hausfold into a tool.
//
// Two things this page is careful about, both from AGENTS.md:
//
//   - Every fact here is read off worker.js (and now public/openapi.json,
//     which test/openapi.test.js pins to the Worker's routing surface). An
//     endpoint documented here that the Worker does not answer is a claim
//     the products don't back.
//   - The links: an internal docs page is a `<Link>`; anything the Worker
//     itself answers (installers, /download, /api/*, /mcp) or any static
//     file (/openapi.json) is a plain `<a>`, because `next/link` would
//     client-navigate to a route the router has never heard of.
//
// The copy says no counts. The endpoints live in openapi.json; prose that
// numbers them rots one commit after the next one lands.
export const metadata = pageMetadata({
  title: 'developers · hausfold',
  description:
    'The public machine-facing surface of hausfold.co: installers, release metadata, docs search, an MCP endpoint for coding agents. No keys, no accounts.',
  path: '/developers/',
});

export default function Developers() {
  return (
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
            hausfold.co answers machines as well as people: this page is the surface written
            down. No API keys, no accounts, nothing to sign up for. If you are an
            agent reading this: the same list lives in{' '}
            <a href="/openapi.json">openapi.json</a>, and the Model Context Protocol section
            below is the fastest way in.
          </p>
        </div>
      </header>

      <section className="block">
        <h2>Install the software</h2>
        <p>
          Each desktop has a URL that installs it. The script is haus&apos;s{' '}
          <code>bootstrap.sh</code>, served plain so it survives a{' '}
          <code>curl | bash</code>, with the desktop written into it:
        </p>
        <Command>{'curl -fsSL https://hausfold.co/hacker.sh | bash'}</Command>
        <p>
          <code>hacker</code>, <code>everyday</code> and <code>minimal</code> are pinned by
          their URLs; <code>haus.sh</code> installs the layer and asks instead.{' '}
          <Link href="/docs/haus">The docs</Link> explain what a desktop is and what each one
          builds. A <code>?ref=v2026.07.18</code> release tag may be appended to pin the script
          itself, but nothing published relies on it.
        </p>
      </section>

      <section className="block">
        <h2>Check a version</h2>
        <p>
          Every app on this site ships signed, notarized releases on GitHub. The release
          endpoint answers with the real latest version, so a download button never hardcodes
          one:
        </p>
        <Command>{'curl -fsSL https://hausfold.co/api/release/pounce'}</Command>
        <p>
          The JSON carries <code>tag</code>, <code>asset</code>, <code>size</code>,{' '}
          <code>url</code> and <code>publishedAt</code>. The asset URL is also reachable as a
          stable redirect: <a href="/download/pounce">download/pounce</a> 302s to the latest
          DMG, preferring it over the archive the Homebrew formula takes.
        </p>
      </section>

      <section className="block">
        <h2>Read the documentation as text</h2>
        <p>
          The docs under <Link href="/docs/haus">/docs</Link> exist in plain-text forms, so a
          tool can load them without a browser: <a href="/llms.txt">llms.txt</a> is the index,
          <a href="/llms-full.txt">llms-full.txt</a> is every page&apos;s full text, and{' '}
          <a href="/api/search">api/search</a> is the complete search index (Orama JSON, one
          entry per page section with its URL and breadcrumbs). The MCP server below scores
          that same index.
        </p>
      </section>

      <section className="block">
        <h2>Model Context Protocol</h2>
        <p>
          <a href="/mcp">
            <code>/mcp</code>
          </a>{' '}
          speaks JSON-RPC 2.0 over Streamable HTTP: POST a request, get JSON back. It is
          stateless (no session ids, nothing to initialize beyond the handshake) and answers
          with open CORS, so browser-resident agents can call it as well as command-line ones.
          Point any MCP client at it:
        </p>
        <Command>
          {"curl -fsSL https://hausfold.co/mcp \\\n  -H 'content-type: application/json' \\\n  -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}'"}
        </Command>
        <p>The tools, all read-only over the same public data:</p>
        <ul className="index" role="list">
          <li>
            <code>get_install_command</code>, the one-liner for a desktop; called without a
            desktop it lists every URL and what it pins.
          </li>
          <li>
            <code>get_latest_release</code>, the latest signed macOS release of an app: tag,
            asset, size, direct download URL, publish date.
          </li>
          <li>
            <code>search_docs</code>, full-text search over the docs, returning page URLs,
            breadcrumbs and excerpts.
          </li>
        </ul>
      </section>

      <section className="block">
        <h2>The whole surface, in one file</h2>
        <p>
          <a href="/openapi.json">
            <code>/openapi.json</code>
          </a>{' '}
          is the OpenAPI 3.1 description of everything on this page. If you are generating a
          client, generate it from that; this page is the readable half, and the spec is what
          CI keeps in step with the Worker.
        </p>
      </section>

      <section className="block">
        <h2>Be discovered</h2>
        <p>
          Two files exist so an agent can find all of the above without reading this page.{' '}
          <a href="/.well-known/ard.json">.well-known/ard.json</a> is an Agentic Resource
          Discovery catalog listing the MCP server and the OpenAPI spec. And the repo behind
          this site is an <a href="https://agent-plugins.org/">Agent Plugin</a>: its{' '}
          <a href="https://github.com/hausfold/hausfold.co/blob/main/plugin.json">
            plugin.json
          </a>{' '}
          ships the same MCP server as an <code>mcp.json</code> entry, plus a skill covering
          install and release lookups.
        </p>
      </section>

      <Colophon>
        <GithubMark />
      </Colophon>
    </main>
  );
}
