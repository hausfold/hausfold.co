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
// odd one out under the layout, either: it is one hand-written-half page
// among eight.
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
            <Link className="index-name" href="/">
              hausfold
            </Link>
            , the house.{' '}
            <Link className="index-name" href="/#desktops">
              desktops
            </Link>
            , the ones you can run.{' '}
            <Link className="index-name" href="/docs">
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
