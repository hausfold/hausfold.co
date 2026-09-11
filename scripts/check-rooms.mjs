#!/usr/bin/env node
// Room catalogue drift tripwire.
//
// The room catalogue is data in haus — `modules/options-groups.nix`, published
// as `docs/site-data/groups.json` and held to the evaluated option tree by
// haus's own `room-registry` flake check. This side of the boundary renders it
// three times: the cards on `rooms/index.mdx`, the namespace table under them,
// and the ---Rooms--- group in `content/docs/haus/meta.json`. Nothing used to
// compare any of the three with anything, which is how the sidebar group came
// to hold pages that are not rooms and a hand-typed table on the layer's front
// page came to be the census.
//
// Three live checks and one snapshot, and the split is the same one
// `check-bar-tables.mjs` makes:
//
//   * the room LIST — names, order, and the page each one points at — is held
//     to the data exactly. A room added to haus with no page here is the case
//     this exists for: `rooms/creating.mdx` has told authors they owe a page
//     since the day it was written, and nothing checked it.
//   * the ---Rooms--- group is held to the same list, so the group stays one
//     row per room plus the catalogue at its head. That is the invariant the
//     old AGENTS.md rule ("count the table, never the sidebar group") existed
//     to work around.
//   * the NAMESPACES each room owns are held exactly, in the registry's own
//     order, including the two owners that are not rooms (the shared surfaces
//     and the host). A namespace with no row is a `haus.*` name the site cannot
//     resolve to anything.
//   * the BLURBS are SNAPSHOTTED, not compared. haus's sentences are written
//     for the options reference and say things like "a shared surface below",
//     which is a layout cue there and nonsense on a card. The page's own gloss
//     is the page's. Pinning nothing is the other bad answer: a room's meaning
//     could change with the card still claiming the old one. So: haus rewords,
//     this goes red, a human re-reads the card and decides what it should say.
//
// Usage:
//   node scripts/check-rooms.mjs --haus <haus-checkout>
//   node scripts/check-rooms.mjs --haus <haus-checkout> --update

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT = join(here, '../src/data/rooms.json');
const PAGE = join(here, '../content/docs/haus/rooms/index.mdx');
const META = join(here, '../content/docs/haus/meta.json');
const ROOMS_DIR = join(here, '../content/docs/haus/rooms');
const PAGE_NAME = 'rooms/index.mdx';

const args = process.argv.slice(2);
const update = args.includes('--update');
const hausIdx = args.indexOf('--haus');
const haus = hausIdx >= 0 ? args[hausIdx + 1] : process.env.HAUS_DIR;
if (!haus || !existsSync(haus)) {
  console.error('usage: check-rooms.mjs --haus <haus-checkout> [--update]');
  process.exit(2);
}

// haus's published site data, so this repository never evaluates Nix.
const dataPath = join(haus, 'docs/site-data/groups.json');
if (!existsSync(dataPath)) {
  console.error(
    [
      `The haus checkout at ${haus} has no \`docs/site-data/groups.json\`.`,
      '',
      'That file is the room registry, generated and committed by haus',
      '(`nix build .#site-data`). Update the checkout and re-run.',
      '',
    ].join('\n'),
  );
  process.exit(1);
}

const registry = JSON.parse(readFileSync(dataPath, 'utf8')).rooms;

// Every owner the registry publishes, in its own reading order: the rooms
// first, then the two that are not rooms. `kind` is what separates them, and
// the page needs both halves — a reader looking up `haus.roster` is served by
// the shared row exactly as one looking up `haus.bar` is served by the Bar's.
const owners = Object.entries(registry)
  .map(([key, value]) => ({ key, ...value }))
  .sort((a, b) => a.order - b.order);
const rooms = owners.filter((owner) => owner.kind === 'room');

// The page a room owns. The registry key IS the slug, which is not a
// coincidence to be relied on quietly: this line is the assumption, and the
// existence check below is what fails when a future room breaks it.
const hrefOf = (room) => `/docs/haus/rooms/${room.key}`;
const nsOf = (owner) => owner.namespaces.map((ns) => `haus.${ns}`);

const problems = [];

// ---------------------------------------------------------------------------
// The cards.
//
// Anchored on the `<Cards>` element rather than on a heading: the heading above
// it is prose an editor may reword, the element is the thing that renders the
// catalogue. Attributes are read with a tolerant regex because this is our own
// MDX, written in one shape, and a real JSX parse would buy nothing the
// equality below could not already catch.
//
// The card's own `/>` is matched at the start of a line (`m`), NOT as the first
// `/>` after `<Card`: every card carries `icon={<Icon name="…" />}`, so a lazy
// match to the first one ends the card at its icon and reads every attribute as
// empty. That failure is silent in the worst way — thirteen cards, all blank.
const mdx = readFileSync(PAGE, 'utf8');
const cardsBlock = /<Cards>([\s\S]*?)<\/Cards>/.exec(mdx);
if (!cardsBlock) {
  problems.push(
    `${PAGE_NAME} has no <Cards> block — this script finds the catalogue by that element, ` +
      `so removing it hides the catalogue rather than failing loudly.`,
  );
} else {
  const cards = [...cardsBlock[1].matchAll(/<Card\b([\s\S]*?)^\s*\/>$/gm)].map((match) => ({
    title: /\btitle="([^"]*)"/.exec(match[1])?.[1] ?? '',
    href: /\bhref="([^"]*)"/.exec(match[1])?.[1] ?? '',
    description: /\bdescription="([^"]*)"/.exec(match[1])?.[1] ?? '',
  }));

  const want = rooms.map((room) => `${room.title} -> ${hrefOf(room)}`);
  const got = cards.map((card) => `${card.title} -> ${card.href}`);
  if (JSON.stringify(want) !== JSON.stringify(got)) {
    problems.push(
      [
        `the cards on ${PAGE_NAME} are not haus's rooms.`,
        `    haus: ${want.join(', ')}`,
        `    page: ${got.join(', ')}`,
        `  Titles, links AND order all count: the catalogue is read in the order haus`,
        `  publishes, which is the order a person should meet the rooms in.`,
      ].join('\n'),
    );
  }

  const blank = cards.filter((card) => !card.description).map((card) => card.title);
  if (blank.length) problems.push(`these cards have no description: ${blank.join(', ')}`);
}

// A room's page has to exist. This is the check `rooms/creating.mdx`'s "a new
// room owes a docs page" callout has always described and never had.
for (const room of rooms) {
  if (!existsSync(join(ROOMS_DIR, `${room.key}.mdx`))) {
    problems.push(
      `haus publishes the ${room.title} room and this repository has no ` +
        `content/docs/haus/rooms/${room.key}.mdx for it.`,
    );
  }
}

// ---------------------------------------------------------------------------
// The namespace table.
//
// Same GFM parsing rules `check-bar-tables.mjs` reasons about: fenced blocks
// dropped first, a header row proven by the delimiter row under it, `\|` a
// literal pipe rather than a separator.
const SEP = '\u0000';
function cells(line) {
  return line
    .replace(/\\\|/g, SEP)
    .replace(/^\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((cell) => cell.replaceAll(SEP, '|').trim());
}
const bare = (cell) => cell.replace(/`/g, '').trim();
// `[Apps](/docs/haus/rooms/apps)` splits into its text and its target; a plain
// `Shared surfaces` has no target, which is correct — the two owners that are
// not rooms have no page to link to. The TARGET is compared too, not only the
// text: a row reading "Bar" while pointing at the Shelf is a wrong answer the
// reader acts on, and the whole point of this table is resolving a name to the
// right page.
const linkCell = (cell) => {
  const link = /^\[([^\]]*)\]\(([^)]*)\)$/.exec(cell.trim());
  return link ? { text: link[1], href: link[2] } : { text: cell.trim(), href: '' };
};

function pageTable(source, header) {
  let fenced = false;
  const lines = source.split('\n').map((line) => {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      return '';
    }
    return fenced ? '' : line;
  });
  const isRow = (line) => line.trimStart().startsWith('|');
  const isHead = (i) =>
    isRow(lines[i]) &&
    bare(cells(lines[i].trim())[0]) === header &&
    isRow(lines[i + 1] ?? '') &&
    cells((lines[i + 1] ?? '').trim()).every((cell) => /^:?-{1,}:?$/.test(cell));

  const start = lines.findIndex((_, i) => isHead(i));
  if (start < 0) return null;

  const rows = [];
  // +2 skips the header row and the `|---|---|` separator under it.
  for (let i = start + 2; i < lines.length; i++) {
    if (!isRow(lines[i])) break;
    const cell = cells(lines[i].trim());
    const owner = linkCell(cell[0] ?? '');
    rows.push({
      room: owner.text,
      href: owner.href,
      namespaces: (cell[1] ?? '')
        .split(',')
        .map((ns) => bare(ns))
        .filter(Boolean),
    });
  }
  return rows;
}

const table = pageTable(mdx, 'Room');
if (table === null) {
  problems.push(
    `${PAGE_NAME} has no \`| Room |\` table — this script finds it by its first column ` +
      `header, so renaming that column hides the table rather than failing loudly.`,
  );
} else {
  const want = owners.map(
    (owner) =>
      `${owner.title} -> ${owner.kind === 'room' ? hrefOf(owner) : '(no page)'}: ` +
      nsOf(owner).join(', '),
  );
  const got = table.map(
    (row) => `${row.room} -> ${row.href || '(no page)'}: ${row.namespaces.join(', ')}`,
  );
  if (JSON.stringify(want) !== JSON.stringify(got)) {
    problems.push(
      [
        `the namespace table on ${PAGE_NAME} does not match haus's registry.`,
        ...want.map((line, i) => `    haus: ${line}\n    page: ${got[i] ?? '(no row)'}`),
        ...got.slice(want.length).map((line) => `    page has an extra row: ${line}`),
        `  Every public haus.* namespace has an owner in the registry, and this table is`,
        `  where a reader resolves one. Rooms first, in the registry's order, then the`,
        `  shared surfaces and the host.`,
      ].join('\n'),
    );
  }
}

// ---------------------------------------------------------------------------
// The sidebar group.
//
// One row per room, plus the catalogue at its head, and nothing else. A page
// about rooms in general belongs in ---Build on it---; a shared surface belongs
// in ---Reference---.
const meta = JSON.parse(readFileSync(META, 'utf8'));
const from = meta.pages.indexOf('---Rooms---');
if (from < 0) {
  problems.push('content/docs/haus/meta.json has no `---Rooms---` separator.');
} else {
  const rest = meta.pages.slice(from + 1);
  const stop = rest.findIndex((page) => page.startsWith('---'));
  const group = stop < 0 ? rest : rest.slice(0, stop);
  const want = ['rooms/index', ...rooms.map((room) => `rooms/${room.key}`)];
  if (JSON.stringify(want) !== JSON.stringify(group)) {
    problems.push(
      [
        'the ---Rooms--- group in content/docs/haus/meta.json is not one row per room.',
        `    want: ${want.join(', ')}`,
        `    have: ${group.join(', ')}`,
        `  The group names the rooms, so everything in it is a room and every room is in`,
        `  it. Pages ABOUT rooms go in ---Build on it---.`,
      ].join('\n'),
    );
  }
}

if (problems.length) {
  console.error('✗ the room catalogue disagrees with haus.\n');
  for (const problem of problems) console.error(`  ${problem}`);
  console.error(`
The catalogue is data in haus (\`modules/options-groups.nix\`), published as
\`docs/site-data/groups.json\`. Fix this side:

  content/docs/haus/rooms/index.mdx     the cards and the namespace table
  content/docs/haus/meta.json           the ---Rooms--- group
  content/docs/haus/rooms/<room>.mdx    a page for a room that has none

then refresh the snapshot:
  node scripts/check-rooms.mjs --haus <haus-checkout> --update`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// The snapshot half: the sentence haus carries for each room, so a rewrite
// upstream reaches a human here.
const current =
  JSON.stringify(
    {
      _note: 'Generated by scripts/check-rooms.mjs --update. Do not edit by hand.',
      rooms: owners.map(({ key, title, kind, namespaces, blurb }) => ({
        key,
        title,
        kind,
        namespaces,
        blurb,
      })),
    },
    null,
    2,
  ) + '\n';

if (update) {
  writeFileSync(SNAPSHOT, current);
  console.log(`snapshot refreshed: ${SNAPSHOT}`);
  process.exit(0);
}

let committed = '';
try {
  committed = readFileSync(SNAPSHOT, 'utf8');
} catch {
  console.error(`no snapshot at ${SNAPSHOT} — run with --update once to create it.`);
  process.exit(1);
}

if (committed === current) {
  console.log('rooms unchanged — the catalogue is as current as the last human pass.');
  process.exit(0);
}

console.error("✗ haus's room registry moved since the docs were last checked.\n");
const before = JSON.parse(committed).rooms;
const after = JSON.parse(current).rooms;
// Counted, for the same reason check-bar-tables counts: a report with no rows
// in it reads as a bug in the check rather than as drift. ORDER is the case
// that gets there, with every name and sentence unchanged.
let said = 0;
const was = new Map(before.map((room) => [room.key, room]));
const now = new Map(after.map((room) => [room.key, room]));
for (const [key, room] of now) {
  const old = was.get(key);
  if (!old) {
    console.error(`  added room: ${room.title} — ${room.blurb}`);
    said++;
    continue;
  }
  if (old.title !== room.title) {
    console.error(`  renamed room: ${old.title} -> ${room.title}`);
    said++;
  }
  if (JSON.stringify(old.namespaces) !== JSON.stringify(room.namespaces)) {
    console.error(`  ${room.title}'s namespaces moved`);
    console.error(`    was: ${old.namespaces.join(', ')}`);
    console.error(`    now: ${room.namespaces.join(', ')}`);
    said++;
  }
  if (old.blurb !== room.blurb) {
    console.error(`  reworded room: ${room.title}`);
    console.error(`    was: ${old.blurb}`);
    console.error(`    now: ${room.blurb}`);
    said++;
  }
}
for (const [key, room] of was) {
  if (!now.has(key)) {
    console.error(`  removed room: ${room.title}`);
    said++;
  }
}
const wasOrder = before.map((room) => room.key);
const nowOrder = after.map((room) => room.key);
if (
  JSON.stringify(wasOrder) !== JSON.stringify(nowOrder) &&
  JSON.stringify([...wasOrder].sort()) === JSON.stringify([...nowOrder].sort())
) {
  console.error('  reordered: the same rooms, in a new sequence');
  console.error(`    was: ${wasOrder.join(', ')}`);
  console.error(`    now: ${nowOrder.join(', ')}`);
  said++;
}
if (!said) {
  console.error('  the snapshot differs but no room does — most likely its own shape moved.');
  console.error(`    diff ${SNAPSHOT} against a fresh --update to see what.`);
}
console.error(`
The cards' wording is this page's, not haus's: haus writes its blurbs for the
options reference, where "a shared surface below" points at the next section.
Re-read the rows above against

  content/docs/haus/rooms/index.mdx

edit whatever actually changed, then refresh the snapshot:
  node scripts/check-rooms.mjs --haus <haus-checkout> --update`);
process.exit(1);
