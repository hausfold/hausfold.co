import Link from 'next/link';
import { Colophon, GithubMark } from '@/components/sheet';

// The 404, ported from `public/404.html` — because it had to be.
//
// Next's static export always writes its own `out/404.html` from this file,
// and the export overwrites anything of the same name copied out of
// `public/`. So the hand-written page could not simply stay where it was:
// leaving it there produced a live site whose 404 was Next's grey default
// with a serif site behind it. This is the same markup, the same classes out
// of `public/hausfold.css`, and the same words.
//
// All three links are `<Link>`s now. They used to be plain `<a>`s because `/`
// and `/#desktops` were files in `public/` rather than Next routes, and
// `next/link` would have prefetched a route that didn't exist. The landing
// pages became routes, so that reason is gone — and this page is no longer the
// odd one out under the layout, either: it is one `.sheet` route among the
// rest.
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
        {/* No data-accent on `hausfold`: that is the house, and the accent
            rule exists so a product's colour follows a product. `haus` is a
            product and still takes none, for the reason the ⌂ takes all six —
            the layer everything sits in borrows every colour and owns none.
            A desktop is not a product and never had one either.

            🚨 The middle row is `/haus/#desktops`, NOT bare `/haus`, and the
            anchor is the point: this page is one of the two callers
            `public/_redirects` and AGENTS.md name for that id, and dropping it
            here would leave the `/desktops` 301 holding it alone while four
            files still said otherwise. It moved from `/#desktops` to
            `/haus/#desktops` on 2026-08-17, with the section itself. */}
        <ul className="index" role="list">
          <li>
            <Link className="index-name" href="/">
              hausfold
            </Link>
            , the house.{' '}
            <Link className="index-name" href="/haus/#desktops">
              desktops
            </Link>
            , the ones you can run.{' '}
            <Link className="index-name" href="/docs/haus">
              docs
            </Link>
            , how any of it works.
          </li>
        </ul>
      </section>

      {/* This was "the ninth colophon", carrying its own copy of the issue
          line and the pre-release mark, with a comment telling you to keep it
          in step with the static ones by hand. There is nothing to keep
          in step now — every colophon on the site is this component. */}
      <Colophon>
        <GithubMark />
      </Colophon>
    </main>
  );
}
