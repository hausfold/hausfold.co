'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

// Does this browser have the clipboard API? The answer differs between the
// server (where the button must render `hidden`, because that is what ships in
// the exported HTML and what a reader with JS off keeps) and the client, which
// is exactly what `useSyncExternalStore`'s third argument is for. Written as a
// `useEffect` + `setState` first, which works and is what the original script
// did — but it is a cascading render on every page with a command on it, and
// `react-hooks/set-state-in-effect` says so.
//
// It never changes after hydration, so `subscribe` registers nothing and
// returns a no-op unsubscribe. Both live at module scope so the references are
// stable across renders.
const subscribe = () => () => {};
const hasClipboard = () => Boolean(navigator.clipboard);
const serverSnapshot = () => false;

// The fenced command with a copy button — the twelve lines that used to sit at
// the foot of `/haus`, `/perch`, `/pounce` and `/desktops/nebelhaus` as four
// identical `<script>` blocks. Three of those four pages are gone: `/haus` and
// `/pounce` were retired into docs trees and the desktop pages were deleted
// outright, all on 2026-08-14. In a tree a fenced block is MDX and gets
// fumadocs' own copy button; this component serves the landing half, which is
// now `/` and `/perch`.
//
// The bar AGENTS.md sets for script on these pages is kept exactly: **pure
// enhancement, nothing lost without it**. The button renders `hidden` in the
// exported HTML and is unhidden by an effect, and only where
// `navigator.clipboard` actually exists — so with JS off, or over `file://`
// where the API is absent, there is no button and the command is plain
// selectable text. That was true of the script and it is true of this.
//
// A page may hold more than one — `/desktops/nebelhaus` did, before it was
// deleted. Each is its own component instance now
// rather than a loop over `document.querySelectorAll('.copy')`, which is the
// one behavioural difference and it is invisible.
// `html`, when given, is Shiki output rendered at build time by the server
// component that owns the code (see `src/app/page.tsx`) — highlighted with
// `structure: 'inline'`, so it is spans and `<br>`s that drop straight into
// the same `<code>` the plain string would fill. `children` stays the raw
// text either way: it is what the copy button writes, and what a reader with
// JS off selects. Never pass anything here that didn't come from Shiki.
export function Command({ children, html }: { children: string; html?: string }) {
  const ready = useSyncExternalStore(subscribe, hasClipboard, serverSnapshot);
  const [label, setLabel] = useState('Copy');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // The reset timer must not fire into an unmounted component.
  useEffect(() => () => clearTimeout(timer.current), []);

  function copy() {
    // `.trim()` because the JSX template literal, like the old `<code>`'s
    // textContent, carries the newline the markup is laid out with.
    navigator.clipboard.writeText(children.trim()).then(
      () => flash('Copied'),
      // A denied permission or an unfocused document rejects. Say so on the
      // button rather than leaving it silent — the command is right there to
      // select by hand.
      () => flash('Select it'),
    );
  }

  function flash(text: string) {
    setLabel(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setLabel('Copy'), 1400);
  }

  return (
    <div className="cmd">
      {html ? <code dangerouslySetInnerHTML={{ __html: html }} /> : <code>{children}</code>}
      <button className="copy" type="button" hidden={!ready} onClick={copy}>
        {label}
      </button>
    </div>
  );
}
