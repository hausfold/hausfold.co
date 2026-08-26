import { type ReactNode } from 'react';

// The pieces of chrome every hand-written page repeated verbatim: the
// colophon and the GitHub mark inside it. (A `Crumbs` breadcrumb was the
// third until 2026-08-26, when `/perch` — its last caller — was retired into
// `/docs/perch`; `.crumbs` left `public/hausfold.css` in the same commit.)
// They were copied eight times because `public/` had no template; they are
// components now for
// the same reason `src/lib/page-meta.ts` exists — AGENTS.md's "a change to one
// is a change to all of them, and nothing checks" was a description of the
// problem, not of a rule anyone could keep.
//
// The markup is unchanged, class for class. Every style these carry is in
// `public/hausfold.css` (`.colophon`, `.colophon .gh`), which
// `src/app/global.css` imports — so this is a move, not a restyle.

/** The house's own GitHub link, in the colophon. Every `.sheet` route with a
 *  colophon carries it as of 2026-08-16, when `/terms` and `/refunds` were
 *  retired: they were the pages that pointed at the privacy policy instead,
 *  and `/perch` was the page that pointed at them — itself retired on
 *  2026-08-26. `/perch/privacy` is the one sheet with no colophon at all, and
 *  writes its own footer. */
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
 *  on every colophon that had one, plus the 404's — this is all of those
 *  copies, once. It is a second piece of edition metadata rather than a banner,
 *  which is why it sits at the colophon's right-hand end in the issue's own
 *  micro-caps and spends none of the page's attention. */
const PRE_RELEASE_NOTE =
  "Every path that could lose your work is either reversible by design, or stops to ask you first. That's the intent, not a warranty.";

/** The foot of every sheet. `julien@hausfold.co` first, then the pre-release
 *  mark at the right-hand end — AGENTS.md is explicit that the address is
 *  deliberate, and that it is not to be "upgraded" to `support@`. It was
 *  `hi@hausfold.co` (settled 2026-08-09) until 2026-08-22; the decision record
 *  is the workshop's notes/go-to-market.md §6. Whatever a page puts between
 *  them is its own. (An "Issue YYYY.MM" line sat beside the
 *  mark until 2026-08-16, when the user cut it — the broadsheet conceit ends
 *  at the masthead now, and the stage mark pushes itself right.)
 *
 *  There was a `note` prop here, overriding the sentence for a page that
 *  could make a more specific promise. `/perch` was the only caller it ever
 *  had — perch#57 let it say what the shelf actually does rather than the
 *  general thing — and it went with that page on 2026-08-26. The sentence is
 *  the same on every colophon again; `data-note` stays, because the bubble
 *  still reads it. The bubble is drawn
 *  in the page (`.stage[data-note]` in `public/hausfold.css`), not by a native
 *  `title` — a `title` on a mark this small waits a second and then paints in
 *  OS chrome, which reads as broken. `tabIndex`/`aria-label` are what make it
 *  reachable without a mouse. */
export function Colophon({ children }: { children?: ReactNode }) {
  return (
    <footer className="colophon">
      <a href="mailto:julien@hausfold.co">julien@hausfold.co</a>
      {children}
      <span
        className="stage"
        tabIndex={0}
        role="note"
        aria-label={`Pre-release. ${PRE_RELEASE_NOTE}`}
        data-note={PRE_RELEASE_NOTE}
      >
        Pre-release
      </span>
    </footer>
  );
}

