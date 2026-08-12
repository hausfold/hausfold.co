import { createElement, type ReactNode } from 'react';
import type { LucideProps } from 'lucide-react';
import {
  Cat,
  CloudFog,
  Command,
  Compass,
  Download,
  Footprints,
  Inbox,
  Layers,
  Monitor,
  PanelTop,
} from 'lucide-react';
import type { Accent } from './shared';

// The docs' whole icon vocabulary, in one file.
//
// Content never names a Lucide component: `meta.json` and frontmatter say
// `icon: bar`, and this table decides what that draws. Two reasons it is worth
// the indirection — a page's icon is an editorial choice about what the page
// *is*, not about which glyph library we happen to ship; and every icon that
// carries a colour carries it from the same six `--a-*` accents the rest of
// the site borrows from, rather than from a class someone typed in an MDX
// file.
//
// `hue` is for the icons that must hold their own colour wherever they are
// drawn: the two tree icons appear side by side in the switcher, so they
// cannot both be "the current page's accent", and the outward product links
// are the products' own. Everything else has no hue and is tinted by the
// page's accent in `global.css` — which is what makes a whole tree read as
// one colour without any page saying so.
type IconSpec = {
  icon: typeof Layers;
  hue?: Accent;
};

const icons = {
  // The two trees. These are the switcher's glyphs, and the one place the
  // sidebar tells you which half of the docs you are in at a glance.
  layer: { icon: Layers, hue: 'nebelung' },
  desktop: { icon: Cat, hue: 'nebelhaus' },

  // Pages. No hue: they take the tree's.
  compass: { icon: Compass },
  install: { icon: Download },
  bar: { icon: PanelTop },
  fog: { icon: CloudFog },
  steps: { icon: Footprints },

  // The outward links at the head of the sidebar — the products' own colours,
  // the same ones the landing page's index spends on hover.
  desktops: { icon: Monitor },
  pounce: { icon: Command, hue: 'pounce' },
  perch: { icon: Inbox, hue: 'perch' },
} satisfies Record<string, IconSpec>;

export type IconName = keyof typeof icons;

/**
 * Resolve an icon name from `meta.json` or a page's frontmatter.
 *
 * An unknown name draws nothing rather than throwing: a typo should cost the
 * row its glyph, not the build.
 */
export function resolveIcon(name: string | undefined): ReactNode {
  if (!name) return;
  const spec = icons[name as IconName] as IconSpec | undefined;

  if (!spec) {
    console.warn(`[icons] unknown icon "${name}" — see src/lib/icons.tsx`);
    return;
  }

  // `data-hue` is not in Lucide's prop type — it spreads onto the `<svg>` at
  // runtime like any other unknown attribute, and the cast is the price of
  // saying so in TypeScript.
  return createElement(spec.icon, { 'data-hue': spec.hue } as LucideProps);
}

/** The same table, for the places that ask for an icon in TSX rather than in content. */
export function Icon({ name }: { name: IconName }) {
  return resolveIcon(name);
}
