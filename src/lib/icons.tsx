import { createElement, type ReactNode } from 'react';
import type { LucideProps } from 'lucide-react';
import {
  Armchair,
  Bell,
  BellOff,
  Blocks,
  Bot,
  Boxes,
  Cat,
  Command,
  Compass,
  DoorOpen,
  Download,
  Feather,
  Fingerprint,
  Footprints,
  Hammer,
  Inbox,
  Keyboard,
  Layers,
  LayoutGrid,
  LifeBuoy,
  ListChecks,
  Monitor,
  MonitorCog,
  Palette,
  PanelTop,
  RefreshCw,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Snowflake,
  SquareDashed,
  SquareTerminal,
  Terminal,
  TextCursorInput,
  Wand2,
  Wrench,
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
// drawn, which since 2026-08-16 is the four tree icons and nothing else: they
// appear side by side in the switcher's popover, where "the current page's
// accent" would paint them the same. (It used to cover the sidebar's outward
// product rows too; that list is empty now — see `src/lib/layout.shared.tsx`.)
// Everything else has no hue and is tinted by the page's accent in
// `global.css` — which is what makes a whole tree read as one colour without
// any page saying so.
type IconSpec = {
  icon: typeof Layers;
  hue?: Accent;
};

const icons = {
  // The four trees. These are the switcher's glyphs, and the one place the
  // sidebar tells you which quarter of the docs you are in at a glance. All
  // four carry a hue, because they sit side by side in the switcher's popover
  // where "the current page's accent" would paint them the same.
  //
  // `pounce` was an outward link to /pounce until that page was retired into
  // this tree; it is the same glyph and the same hue, promoted. `perch` was
  // the sidebar's way-out row to /perch and was promoted the same way when
  // perch got a tree on 2026-08-14 — the product page stayed, so the row is
  // gone and this glyph now means the tree.
  layer: { icon: Layers, hue: 'nebelung' },
  pounce: { icon: Command, hue: 'pounce' },
  perch: { icon: Inbox, hue: 'perch' },
  trill: { icon: Bell, hue: 'trill' },

  // Pages. No hue: they take the tree's.
  compass: { icon: Compass },
  install: { icon: Download },
  bar: { icon: PanelTop },
  steps: { icon: Footprints },
  tiling: { icon: LayoutGrid },
  apps: { icon: Boxes },
  shell: { icon: SquareTerminal },
  palette: { icon: Palette },
  keys: { icon: Keyboard },
  launcher: { icon: Command },
  terminal: { icon: Terminal },
  fingerprint: { icon: Fingerprint },
  bellOff: { icon: BellOff },
  agent: { icon: Bot },
  wand: { icon: Wand2 },
  sync: { icon: RefreshCw },
  wrench: { icon: Wrench },
  dials: { icon: SlidersHorizontal },
  options: { icon: SlidersHorizontal },
  lifebuoy: { icon: LifeBuoy },
  door: { icon: DoorOpen },
  share: { icon: Share2 },
  flake: { icon: Snowflake },
  hammer: { icon: Hammer },
  display: { icon: MonitorCog },
  shelf: { icon: Inbox },
  expand: { icon: TextCursorInput },
  shield: { icon: ShieldCheck },
  choose: { icon: ListChecks },
  // The last row in the Rooms group: how to write one. `hammer` would have
  // done, but it is already what "Create a desktop" and "Contributing" wear,
  // and three identical glyphs in one sidebar stop saying anything.
  blocks: { icon: Blocks },

  // The four desktops, one page each under `haus/desktops/`. No hue on any of
  // them, unlike the tree glyphs above: they are page rows inside the haus
  // tree and take its mauve like every other row, and a desktop owns no
  // accent anywhere on this site in the first place (AGENTS.md's closed
  // vocabulary — hacker is a named thing with an upstream hue, `everyday`
  // and `minimal` are selections of the same options). `hacker` was called
  // `desktop` and carried the desktop's hue while it pointed OUT of the docs at
  // /desktops/nebelhaus; that page was deleted on 2026-08-14 and the link
  // turned inward, which is exactly the condition for dropping a hue.
  hacker: { icon: Cat },
  everyday: { icon: Armchair },
  minimal: { icon: Feather },
  blank: { icon: SquareDashed },

  // "Desktops, as a kind of thing" — the glyph a card uses when it points at
  // the group rather than at one of them (`rooms/creating`'s way onward to
  // `desktops/creating`). ⚠️ It was the sidebar's last way-out row until
  // 2026-08-16; that row is gone and this entry is NOT, because content names
  // it. No hue: a desktop owns no accent anywhere on this site.
  desktops: { icon: Monitor },
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
