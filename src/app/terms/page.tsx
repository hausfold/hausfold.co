import Link from 'next/link';
import { Colophon, GithubMark } from '@/components/sheet';
import { pageMetadata } from '@/lib/page-meta';

// /terms — terms of use for the service at this domain, published 2026-09-04.
//
// ⚠️ There was no page here from 2026-08-16, and `public/_redirects` sent
// /terms to /#made with a comment saying it would resolve there forever. That
// redirect existed because there was nothing to serve, and the page it pointed
// at answered the only question anyone was asking then ("is there something to
// buy?"). The four lines were deleted for the two /terms spellings in the same
// commit as this file, because _redirects is evaluated ahead of the assets and
// a page under a redirected path never renders. /refunds still redirects:
// there are still no refunds, because there is still nothing to buy.
//
// What changed is the reason. The retired page was a SALES document (seats,
// renewals, a fourteen-day window) for a licence that no longer exists, and
// AGENTS.md's rule against reviving it is about that document. This one is the
// opposite kind: no-warranty terms for a free, keyless, read-only public API,
// written because OpenAI's app submission requires a terms URL and a redirect
// onto a landing-page paragraph is a soft 404 in that field.
//
// Every claim is readable off worker.js and worker-api.js. The rate limit is
// RATE_LIMIT in worker-api.js (600 requests per 60s window, per client IP and
// per edge node); keep the number here in step with it.
export const metadata = pageMetadata({
  title: 'hausfold · terms',
  description:
    "hausfold.co's terms of use: everything is free, unauthenticated and offered as-is, with no warranty and no promise it stays up.",
  ogTitle: 'hausfold · Terms',
  path: '/terms/',
});

export default function Terms() {
  return (
    <main className="sheet">
      <header className="masthead">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">hausfold</Link>
          <span className="sep" aria-hidden="true">
            /
          </span>
          <span aria-current="page">terms</span>
        </nav>
        <div className="mark" aria-hidden="true">
          ⌂
        </div>
        <h1 className="wordmark">terms</h1>
        <p className="standfirst">Free, public, and offered as it is.</p>
        <div className="lede">
          <p>
            These are the terms of use for hausfold.co: the website, the install scripts it
            serves, and its <Link href="/developers">machine-facing endpoints</Link> (the docs
            search API and the MCP server). There is no account to open, nothing to buy and no
            contract to sign, which is why this page is short. For what the servers see, there is
            a <Link href="/privacy">privacy policy</Link>.
          </p>
        </div>
      </header>

      <section className="block">
        <h2>What this covers</h2>
        <p>
          This domain serves pages, documentation, install scripts, and a set of read-only
          endpoints any client can call without a key. Using any of them means these terms apply
          to that use. They cover the service at this address and nothing else: the software the
          service points you at is licensed separately, and each product&apos;s own repository
          says how.
        </p>
      </section>

      <section className="block">
        <h2>No warranty, and no promise it stays up</h2>
        <p>
          Everything here is provided as it is, with no warranty of any kind. Nothing is
          guaranteed to be available, correct or current. Endpoints may change or stop answering,
          a documented URL may move, and a release lookup may fail because a third party is
          having a bad day. Nobody here is liable for what follows if any of that happens to you.
        </p>
        <p>
          Install scripts are the case worth reading twice. They run on your own machine with
          your own privileges, and reviewing one before you run it is yours to do. Every script
          this site serves is public source, fetched from a tagged release, precisely so that you
          can.
        </p>
      </section>

      <section className="block">
        <h2>Using it fairly</h2>
        <p>
          Two asks, and no key enforces either. Stay inside the rate limit: the MCP server and
          the REST surface allow 600 requests a minute per client, counted per edge node. Going
          over gets you a 429 and a header saying when to retry, not a ban.
        </p>
        <p>
          And take what you need rather than the whole site. The documentation is published for
          reading and for agents to search, so the index, llms.txt and llms-full.txt exist to
          save you crawling for it. Use those instead. Beyond that: do not use the service to
          break the law or to attack anyone, which is a rule about the world and not really about
          this site.
        </p>
      </section>

      <section className="block">
        <h2>The software has its own licence</h2>
        <p>
          These terms govern the service. They grant no rights to the code and take none away.
          Everything hausfold publishes is open source, and each repository carries the licence
          that says what you may do with the software itself. That file is the answer, not this
          page.
        </p>
      </section>

      <section className="block">
        <h2>Changes</h2>
        <p>
          If any of this stops being true, this page changes. There is no notice list to join and
          no version banner to read: the text here is the terms, and this site&apos;s history is
          public if you want to see what moved and when.
        </p>
      </section>

      <Colophon>
        <Link href="/privacy">privacy</Link>
        <GithubMark />
      </Colophon>
    </main>
  );
}
