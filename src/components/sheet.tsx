import Link from 'next/link';
import { Fragment, type ReactNode } from 'react';

// The three pieces of chrome every hand-written page repeated verbatim: the
// breadcrumb, the colophon, and the GitHub mark inside it. They were copied
// eight times because `public/` had no template; they are components now for
// the same reason `src/lib/page-meta.ts` exists — AGENTS.md's "a change to one
// is a change to all of them, and nothing checks" was a description of the
// problem, not of a rule anyone could keep.
//
// The markup is unchanged, class for class. Every style these carry is in
// `public/hausfold.css` (`.crumbs`, `.colophon`, `.colophon .gh`), which
// `src/app/global.css` imports — so this is a move, not a restyle.

/** The house's own GitHub link, in the colophon. Not every page carries it:
 *  the seller's pages (`/terms`, `/refunds`) point at the privacy policy
 *  instead, and `/perch` points at terms and refunds. */
export function GithubMark() {
  return (
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
  );
}

/** The pre-release mark's sentence. Added 2026-08-14 as a hand-copied `<span>`
 *  on all eight colophons that had one, plus the 404's — this is those nine
 *  copies, once. It is a second piece of edition metadata rather than a banner,
 *  which is why it sits at the colophon's right-hand end in the issue's own
 *  micro-caps and spends none of the page's attention. */
const PRE_RELEASE_NOTE =
  "Every path that could lose your work is either reversible by design, or stops to ask you first. That's the intent, not a warranty.";

/** The foot of every sheet. `hi@hausfold.co` first, then the issue line and
 *  the pre-release mark — AGENTS.md is explicit that the address is `hi@`,
 *  deliberately, and that it is not to be "upgraded" to `support@`. Whatever a
 *  page puts between them is its own.
 *
 *  `note` overrides the pre-release sentence for a page that can make a more
 *  specific promise; `/perch` is the only one that does, because perch#57 let
 *  it say what the shelf actually does rather than the general thing. The
 *  bubble is drawn
 *  in the page (`.stage[data-note]` in `public/hausfold.css`), not by a native
 *  `title` — a `title` on a mark this small waits a second and then paints in
 *  OS chrome, which reads as broken. `tabIndex`/`aria-label` are what make it
 *  reachable without a mouse. */
export function Colophon({ children, note = PRE_RELEASE_NOTE }: { children?: ReactNode; note?: string }) {
  return (
    <footer className="colophon">
      <a href="mailto:hi@hausfold.co">hi@hausfold.co</a>
      {children}
      <span className="issue">Issue 2026.08</span>
      <span
        className="stage"
        tabIndex={0}
        role="note"
        aria-label={`Pre-release. ${note}`}
        data-note={note}
      >
        Pre-release
      </span>
    </footer>
  );
}

/** The breadcrumb an inner page opens on instead of the ⌂. `trail` is
 *  everything before the current page; `/desktops/nebelhaus` is the one page
 *  with two entries in it, and deliberately not three — see its own page for
 *  why the middle crumb points at `/#desktops` rather than at `/desktops`. */
export function Crumbs({
  trail,
  current,
}: {
  trail: { href: string; label: string }[];
  current: string;
}) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {trail.map((crumb) => (
        <Fragment key={crumb.href}>
          <Link href={crumb.href}>{crumb.label}</Link>
          <span className="sep" aria-hidden="true">
            /
          </span>
        </Fragment>
      ))}
      <span aria-current="page">{current}</span>
    </nav>
  );
}
