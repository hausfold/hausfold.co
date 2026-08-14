'use client';

import { useEffect, useRef, useState } from 'react';

// The fenced command with a copy button — the twelve lines that used to sit at
// the foot of `/haus`, `/perch`, `/pounce` and `/desktops/nebelhaus` as four
// identical `<script>` blocks.
//
// The bar AGENTS.md sets for script on these pages is kept exactly: **pure
// enhancement, nothing lost without it**. The button renders `hidden` in the
// exported HTML and is unhidden by an effect, and only where
// `navigator.clipboard` actually exists — so with JS off, or over `file://`
// where the API is absent, there is no button and the command is plain
// selectable text. That was true of the script and it is true of this.
//
// A page may hold more than one; `/pounce` does, and its second is the example
// command rather than an install line. Each is its own component instance now
// rather than a loop over `document.querySelectorAll('.copy')`, which is the
// one behavioural difference and it is invisible.
export function Command({ children }: { children: string }) {
  const [ready, setReady] = useState(false);
  const [label, setLabel] = useState('Copy');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (navigator.clipboard) setReady(true);
    return () => clearTimeout(timer.current);
  }, []);

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
      <code>{children}</code>
      <button className="copy" type="button" hidden={!ready} onClick={copy}>
        {label}
      </button>
    </div>
  );
}
