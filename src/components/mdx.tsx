import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Card as FumaCard, Cards } from 'fumadocs-ui/components/card';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import type { MDXComponents } from 'mdx/types';
import type { ComponentProps } from 'react';
import { Icon } from '@/lib/icons';
import { cn } from '@/lib/cn';

// One class, so the stylesheet has something to hold onto: fumadocs' Card
// renders a `div.rounded-xl.border` with no hook of its own, and styling
// "every bordered box in the prose" is how a rule meant for a doorway ends
// up on a callout. See `.hf-card` in `app/global.css`. Exported because the
// docs page's footer draws the same doorways for frontmatter `related:`
// entries — one card, one look, wherever it renders.
export function Card({ className, ...props }: ComponentProps<typeof FumaCard>) {
  return <FumaCard className={cn('hf-card', className)} {...props} />;
}

// The components a page may reach for without importing anything. Kept to
// the five Starlight shapes the ported docs actually used — Aside (→
// Callout, which `defaultMdxComponents` already provides), Card/CardGrid,
// Steps and Tabs — plus `Icon`, which is how a card gets the same glyph its
// page carries in the sidebar. Anything beyond these is a decision, not a
// convenience: a component the prose could have been is a component that
// hides the prose from search and from `llms-full.txt`.
export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Card,
    Cards,
    Icon,
    Step,
    Steps,
    Tab,
    Tabs,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
