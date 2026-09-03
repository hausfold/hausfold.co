import Link from 'next/link';
import { Colophon, GithubMark } from '@/components/sheet';
import { pageMetadata } from '@/lib/page-meta';

// /privacy — the org-level privacy policy for hausfold.co itself: the site,
// the installers, and the machine-facing endpoints (/mcp, /api/*, the docs
// mirrors). Perch, the Mac app, keeps its own policy at /perch/privacy,
// which is the URL the App Store listing carries; this page links to it and
// does not replace it.
//
// Written for the plugin-directory forms (OpenAI's among them) that ask for
// a policy URL before listing an MCP server. Every claim here is readable
// off worker.js and worker-api.js: the rate limiter is the only place a
// visitor's data is held, in memory, keyed on the connecting IP, for the
// 60s window RATE_LIMIT.windowMs sets.
export const metadata = pageMetadata({
  title: 'hausfold · privacy',
  description:
    "hausfold.co's privacy policy: no accounts, no analytics, no cookies. What the servers see is Cloudflare's to process and ours to forget.",
  ogTitle: 'hausfold · Privacy',
  path: '/privacy/',
});

export default function Privacy() {
  return (
    <main className="sheet">
      <header className="masthead">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">hausfold</Link>
          <span className="sep" aria-hidden="true">
            /
          </span>
          <span aria-current="page">privacy</span>
        </nav>
        <div className="mark" aria-hidden="true">
          ⌂
        </div>
        <h1 className="wordmark">privacy</h1>
        <p className="standfirst">Nothing collected. Nothing kept.</p>
        <div className="lede">
          <p>
            This is the privacy policy for hausfold.co: the website, the install scripts it
            serves, and its machine-facing endpoints (the docs search API and the{' '}
            <a href="/mcp">MCP server</a>). For Perch, the Mac app, there is a separate{' '}
            <Link href="/perch/privacy">policy of its own</Link>.
          </p>
        </div>
      </header>

      <section className="block">
        <h2>What we collect</h2>
        <p>Nothing.</p>
        <p>
          There are no accounts, no sign-ins, no cookies, no analytics service and no error
          reporter on this site. Nothing on it asks who you are, and nothing on it follows you
          from page to page. The downloadable apps&apos; release artifacts (pounce, perch) are
          signed and notarized in each product&apos;s own release process; the website is not in
          that loop.
        </p>
      </section>

      <section className="block">
        <h2>What the network sees anyway</h2>
        <p>
          Cloudflare serves this site, so Cloudflare&apos;s edge sees the standard record any
          web server sees: your IP address, the URL you asked for, and the time. We run no
          analytics over that record and build no profile from it. It is traffic noise, not
          data about you.
        </p>
      </section>

      <section className="block">
        <h2>The one thing held briefly</h2>
        <p>
          The MCP server and the REST surface rate-limit by IP address, so one noisy client
          cannot crowd out everyone else. The counter lives in the Worker&apos;s own working
          memory, keyed on the connecting IP, and expires after 60 seconds. It is never
          written to disk or to a database, because there is no database: hausfold.co is a
          static site and a Worker that holds nothing keyed to you.
        </p>
      </section>

      <section className="block">
        <h2>What leaves this site</h2>
        <p>
          When you (or an agent) ask for an app&apos;s latest release, the Worker calls
          GitHub&apos;s public API from Cloudflare&apos;s servers to find it. GitHub sees that
          server-side request, not you: your IP address does not travel with the question.
        </p>
      </section>

      <section className="block">
        <h2>Changes</h2>
        <p>
          If any of this stops being true (a sign-in, a counter that persists, an analytics
          SDK), this page changes before the code ships, not after.
        </p>
      </section>

      <Colophon>
        <Link href="/perch/privacy">perch&apos;s policy</Link>
        <GithubMark />
      </Colophon>
    </main>
  );
}