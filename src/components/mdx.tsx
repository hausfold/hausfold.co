import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Card, Cards } from 'fumadocs-ui/components/card';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import type { MDXComponents } from 'mdx/types';

// The components a page may reach for without importing anything. Kept to
// the five Starlight shapes the ported docs actually used — Aside (→
// Callout, which `defaultMdxComponents` already provides), Card/CardGrid,
// Steps and Tabs. Anything beyond these is a decision, not a convenience:
// a component the prose could have been is a component that hides the
// prose from search and from `llms-full.txt`.
export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Card,
    Cards,
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
