import Link from 'next/link';

// The 404, ported from `public/404.html` — because it had to be.
//
// Next's static export always writes its own `out/404.html` from this file,
// and the export overwrites anything of the same name copied out of
// `public/`. So the hand-written page could not simply stay where it was:
// leaving it there produced a live site whose 404 was Next's grey default
// with a serif site behind it. This is the same markup, the same classes out
// of `public/hausfold.css`, and the same words.
//
// The two links out to hand-written pages stay plain `<a>` — `/` and
// `/#desktops` are files (or anchors on one) in `public/`, not Next routes,
// so `next/link` would prefetch a route that doesn't exist. `/docs` IS a Next
// route and takes a `<Link>`, which is also what the lint rule is asking for.
//
// `noindex` is added by Next for this route; the original page set it by
// hand for the same reason — the document is served under whatever wrong URL
// the visitor typed, so there is nothing true to be canonical about.
export default function NotFound() {
  return (
    <main className="sheet">
      <header className="masthead">
        <div className="mark" aria-hidden="true">
          ⌂
        </div>
        <h1 className="wordmark">404</h1>
        <p className="standfirst">Nothing at this address.</p>
      </header>

      <section>
        {/* No data-accent: neither of these is a product's name, and the
            accent rule exists so a product's colour follows a product. The
            house tinting itself pink would break exactly that. */}
        <ul className="index" role="list">
          <li>
            <a className="index-name" href="/">
              hausfold
            </a>
            , the house.{' '}
            <a className="index-name" href="/#desktops">
              desktops
            </a>
            , the ones you can run.{' '}
            <Link className="index-name" href="/docs">
              docs
            </Link>
            , how any of it works.
          </li>
        </ul>
      </section>

      <footer className="colophon">
        <a href="mailto:hi@hausfold.co">hi@hausfold.co</a>
        <a
          className="gh"
          href="https://github.com/hausfold"
          aria-label="github.com/hausfold"
          title="github.com/hausfold"
        >
          <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
          </svg>
        </a>
        <span className="issue">Issue 2026.08</span>
        {/* The ninth colophon. This page moved out of `public/` on
            2026-08-12, so it is the one a grep scoped to `public/` misses —
            keep it in step with the eight static ones by hand. */}
        <span
          className="stage"
          title="Every path that could lose your work is either reversible by design, or stops to ask you first. That's the intent, not a warranty."
        >
          Pre-release
        </span>
      </footer>
    </main>
  );
}
