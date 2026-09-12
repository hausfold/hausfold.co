// The ordered procedure. Fumadocs' own `Steps`/`Step` are these same two divs
// wearing `fd-steps`/`fd-step`, and that pair of class names is what its
// preset styles — an absolutely positioned `::before` numeral in a grey pill,
// a hairline, and two breakpoints of its own. Everything under "an ordered
// procedure" in `src/app/global.css` had to override that rule by rule and still
// inherited three declarations from it, so a fumadocs bump could move every
// numeral without a line here changing. Owning the two divs ends that: the
// stylesheet answers `.hf-steps`/`.hf-step` and nothing upstream reaches them.
//
// The markup is the whole contract. `src/lib/source.ts` unwraps the two MDX
// tags by NAME for the Markdown twin, so a page still writes `<Steps>` and
// `<Step>`; what renders is ours.
import type { ReactNode } from 'react';

export function Steps({ children }: { children: ReactNode }) {
  return <div className="hf-steps">{children}</div>;
}

export function Step({ children }: { children: ReactNode }) {
  return <div className="hf-step">{children}</div>;
}
