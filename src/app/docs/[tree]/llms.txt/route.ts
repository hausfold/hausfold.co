import { source } from '@/lib/source';
import { llms } from 'fumadocs-core/source';
import { notFound } from 'next/navigation';

// A per-tree llms.txt: /docs/haus/llms.txt, /docs/pounce/llms.txt and so on.
// The root index (src/app/llms.txt/route.ts) is the whole manual's table of
// contents; this is the scoped one, for an agent that already knows which
// product it cares about and doesn't want four other trees in context.
//
// The body reuses fumadocs' own renderer via indexNode(), so the shape and
// the per-page descriptions match the root index exactly. `pageTree.children`
// holds the five root folders (the tree switcher's tabs), and a root folder's
// `$id` is its directory name — the same lookup the docs page uses for its
// eyebrow, for the reason recorded there.
export const revalidate = false;

const TREES = {
  haus: 'The macOS layer: one file describes the Mac, one command makes the Mac match it.',
  pounce: 'The launcher you teach: a native command palette where every command is a file.',
  perch: 'A shelf that drops out of the notch mid-drag to catch whatever you are carrying.',
  trill: 'A notification compositor for macOS: one place for what interrupts you, and a filter in front of it. In the incubator.',
  scruff: 'A lane per agent: its own branch, its own checkout, its own pane.',
};

export function generateStaticParams() {
  return Object.keys(TREES).map((tree) => ({ tree }));
}

export async function GET(_req: Request, { params }: RouteContext<'/docs/[tree]/llms.txt'>) {
  const { tree } = await params;
  if (!Object.hasOwn(TREES, tree)) notFound();
  const node = source.pageTree.children.find((n) => n.type === 'folder' && n.$id === tree);
  if (!node) notFound();

  const header = `# ${tree} docs

> ${TREES[tree as keyof typeof TREES]}

The full site index lives at https://hausfold.co/llms.txt; the machine-facing
surface (MCP endpoint, OpenAPI, markdown twins) is written down at
https://hausfold.co/developers/. Every page below also exists as markdown by
appending .md to its URL.

`;

  return new Response(header + llms(source).indexNode(node) + '\n');
}
