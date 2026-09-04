import { getPagesInOrder } from '@/lib/source';
import { developersJsonLd, faqJsonLd, organizationJsonLd } from '@/lib/jsonld';
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
  // ⚠️ No `/developers/` row. `developersJsonLd` below already carries that
  // URL, with the same name and description and a richer type, so a row here
  // would be a second node for one URL and a third copy of two strings.
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
    url: `${siteUrl}/terms/`,
    name: 'terms · hausfold',
    description:
      'Terms of use for hausfold.co: everything is free, unauthenticated and offered as-is, with no warranty and no promise it stays up.',
  },
  {
    url: `${siteUrl}/perch/privacy/`,
    name: 'perch · privacy',
    description:
      "Perch's privacy policy: no account, no analytics, no data collected. Nothing leaves your Mac except to a device you paired yourself.",
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
    // The developer resources by name, so a feed reader that never renders
    // /developers still learns that "hausfold MCP server" and "hausfold
    // OpenAPI spec" are things with URLs on this domain.
    developersJsonLd,
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