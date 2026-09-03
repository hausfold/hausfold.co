import { getPagesInOrder } from '@/lib/source';
import { faqJsonLd, organizationJsonLd } from '@/lib/jsonld';
import { siteUrl } from '@/lib/shared';

// The structured-data feed robots.txt advertises via its `schemamap:` line
// (the NLWeb Schema Feeds draft): one JSON object per line, schema.org
// vocabulary only, every fact derived from pages this build already has.
//
// Content-Type follows the draft's recommendation for JSON Lines. Prerendered
// with the build, so the bytes are reproducible like the rest of out/.
export const revalidate = false;

// The hand-written pages and their titles, matching each page's own metadata.
const LANDING = [
  {
    url: `${siteUrl}/`,
    name: 'hausfold',
    description:
      'hausfold makes Mac software: one layer that rebuilds the whole machine, and the small native tools that live inside it.',
  },
  {
    url: `${siteUrl}/developers/`,
    name: 'developers · hausfold',
    description:
      'The public machine-facing surface of hausfold.co: installers, release metadata, docs search, an MCP endpoint for coding agents. No keys, no accounts.',
  },
  {
    url: `${siteUrl}/about/`,
    name: 'about · hausfold',
    description:
      'One person, a few small programs, no company to upsell you: what hausfold makes and how the house is run.',
  },
  {
    url: `${siteUrl}/contact/`,
    name: 'contact · hausfold',
    description: 'Where bugs, questions and ideas go: one email address and one GitHub org, both read by a person.',
  },
  {
    url: `${siteUrl}/privacy/`,
    name: 'privacy · hausfold',
    description: 'This site collects nothing: static pages, no cookies, no analytics, no accounts.',
  },
  {
    url: `${siteUrl}/perch/privacy/`,
    name: 'perch privacy policy · hausfold',
    description: 'What perch collects (nothing), sends (nothing), and stores (everything, on your Mac).',
  },
];

export async function GET() {
  const pages = getPagesInOrder().map((page) => ({
    url: `${siteUrl}${page.url}/`,
    name: page.data.title,
    ...(page.data.description ? { description: page.data.description } : {}),
  }));
  const lines = [
    organizationJsonLd,
    faqJsonLd,
    ...LANDING.map(({ url, name, description }) => ({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      url,
      name,
      description,
    })),
    ...pages.map(({ url, name, description }) => ({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      url,
      name,
      ...(description ? { description } : {}),
    })),
  ];
  return new Response(lines.map((o) => JSON.stringify(o)).join('\n') + '\n', {
    headers: { 'content-type': 'application/x-jsonlines' },
  });
}