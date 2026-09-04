import { homepageGraph } from '@/lib/jsonld';

// The homepage's JSON-LD graph at its structured-data endpoint: the canonical
// URL with a .jsonld suffix, per the schemamap convention the /schema.jsonl
// feed and robots.txt advertise. Same bytes as the <script type="application/
// ld+json"> in src/app/page.tsx — both render from src/lib/jsonld.ts.
export const revalidate = false;

export function GET() {
  return new Response(JSON.stringify(homepageGraph, null, 2) + '\n', {
    headers: { 'content-type': 'application/ld+json' },
  });
}
