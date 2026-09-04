import type { MetadataRoute } from 'next';
import { getPagesInOrder } from '@/lib/source';
import { siteUrl } from '@/lib/shared';

// The sitemap robots.txt advertises. Every indexable URL: the hand-written
// pages and every docs page, with the trailing slash `trailingSlash: true`
// serves them at (the canonical form, never the bare path).
//
// No <lastmod>, on purpose: the export is byte-reproducible build to build
// (docs.yml diffs two cold builds and goes red when they disagree), and there
// is no per-page date to pin — the pages don't carry dates. A clock would
// break that check; a made-up date would lie.
export const revalidate = false;

const LANDING = ['/', '/developers/', '/about/', '/contact/', '/privacy/', '/perch/privacy/'];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...LANDING.map((path) => ({ url: `${siteUrl}${path}` })),
    ...getPagesInOrder().map((page) => ({ url: `${siteUrl}${page.url}/` })),
  ];
}
