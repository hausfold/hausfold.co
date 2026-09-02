#!/usr/bin/env node
// Bar vocabulary drift tripwire.
//
// The bar's two colour vocabularies are data in haus — the tone ladder
// (`modules/bar/tones.nix`) and the identity axis beside it
// (`modules/bar/marks.nix`), published as `docs/site-data/bar-{tones,marks}.json`.
// Those files' own headers carry the history and the shape; this one is only
// about what a check on THIS side can honestly hold.
//
// Two jobs, and the split is the whole design:
//
//   * the rung NAMES and their ORDER are held to the data EXACTLY, live, by
//     parsing the page. Those are not prose. The ladder runs quietest first and
//     the table is meant to be read down it, so a rung inserted in the middle,
//     dropped, or renamed is a page that misdescribes the vocabulary — and the
//     invariant the two axes exist to keep (identity and status never share a
//     hue) is unreadable if a mark is missing from the mark table.
//   * the `meaning` column is SNAPSHOTTED, not compared. haus writes for
//     someone editing the bar, so "Claude, Claude elsewhere, and VLC" is a list
//     of clients to them and a typo to a reader here. Nothing is secret about
//     it — haus is public, and the snapshot below commits those sentences
//     verbatim — the point is that they are wrong FOR A READER, and a check
//     that demanded them on the page would be a check demanding the page get
//     worse. Pinning nothing is the other bad answer: a rung's meaning could
//     invert with the page still claiming the old one. So: haus rewords, this
//     goes red, a human re-reads the row and decides what the page should say.
//
// That second half is `check-rice-bindings.mjs`'s contract exactly, and the
// same reason applies — prose gets a human pass, data gets an equality check.
//
// Usage:
//   node scripts/check-bar-tables.mjs --haus <haus-checkout>
//   node scripts/check-bar-tables.mjs --haus <haus-checkout> --update

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT = join(here, '../src/data/bar-tables.json');
const PAGE = join(here, '../content/docs/haus/rooms/bar-widgets.mdx');

const args = process.argv.slice(2);
const update = args.includes('--update');
const hausIdx = args.indexOf('--haus');
const haus = hausIdx >= 0 ? args[hausIdx + 1] : process.env.HAUS_DIR;
if (!haus || !existsSync(haus)) {
  console.error('usage: check-bar-tables.mjs --haus <haus-checkout> [--update]');
  process.exit(2);
}

// haus's published site data, so this repository never evaluates Nix.
function hausData(name) {
  const path = join(haus, 'docs/site-data', name);
  if (!existsSync(path)) {
    console.error(
      [
        `The haus checkout at ${haus} has no \`docs/site-data/${name}\`.`,
        '',
        'That file is generated and committed by haus (`nix build .#site-data`).',
        'Update the checkout and re-run.',
        '',
      ].join('\n'),
    );
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

const tones = hausData('bar-tones.json');
const marks = hausData('bar-marks.json');

// Only the two columns the page renders. `key` is the nebelung entry a rung
// resolves to and `stub` is a hex `test/barlib.bats` writes: both are real
// parts of the vocabulary and neither appears on the page, so pinning them here
// would redden this check for a change no reader could see. Same call
// check-rice-bindings makes when it snapshots resize-mode keys without their
// commands.
const columns = (rows) => rows.map(({ name, meaning }) => ({ name, meaning }));

// ---------------------------------------------------------------------------
// The page's own tables.
//
// Anchored on the SHAPE the page has — a GFM table whose first column header is
// literally `tone` or `mark` — rather than on a heading or an HTML comment. A
// marker is something you can move without moving the thing it marks, and the
// second column's header is a caption ("what it claims", "for") that an editor
// may reword without touching a single rung.
//
// `\\|` is a LITERAL pipe in a GFM cell, not a separator. No cell uses one
// today; splitting on it anyway would silently shear a row in half and report
// the fragment as the rung's name, which is the kind of wrong answer a
// tripwire must not give.
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

function pageTable(mdx, header) {
  // Fenced blocks are dropped first. This page teaches people to write widgets,
  // so it is mostly shell — and an example that happened to contain a `| tone |`
  // row would be found before the real table and reported as the page's answer.
  // Wrong-but-loud is still wrong when the message names the wrong file region.
  let fenced = false;
  const lines = mdx.split('\n').map((line) => {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      return '';
    }
    return fenced ? '' : line;
  });
  const isRow = (line) => line.trimStart().startsWith('|');
  // A HEADER row, not merely a cell that says `tone`: GFM requires the
  // delimiter row directly under it, so demanding one is what separates the
  // table's header from a row of some other table that happens to start with
  // the same word.
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
    const line = lines[i];
    if (!isRow(line)) break;
    const cell = cells(line.trim());
    rows.push({ name: bare(cell[0] ?? ''), meaning: (cell[1] ?? '').trim() });
  }
  return rows;
}

const mdx = readFileSync(PAGE, 'utf8');
const pageTones = pageTable(mdx, 'tone');
const pageMarks = pageTable(mdx, 'mark');

const problems = [];

// The live half: names and order, exactly.
for (const [label, data, page] of [
  ['tone', tones, pageTones],
  ['mark', marks, pageMarks],
]) {
  if (page === null) {
    problems.push(
      `bar-widgets.mdx has no \`| ${label} |\` table — this script finds each one by its ` +
        `first column header, so a renamed header hides the table rather than failing loudly.`,
    );
    continue;
  }
  const want = data.map((row) => row.name);
  const got = page.map((row) => row.name);
  if (JSON.stringify(want) !== JSON.stringify(got)) {
    problems.push(
      [
        `the ${label} table on bar-widgets.mdx does not match haus's ${label} list.`,
        `    haus: ${want.join(', ')}`,
        `    page: ${got.join(', ')}`,
        `  Names AND order both count — the ladder runs quietest first and the table is`,
        `  meant to read down it.`,
      ].join('\n'),
    );
  }
  const blank = page.filter((row) => !row.meaning).map((row) => row.name);
  if (blank.length) {
    problems.push(`the ${label} table has empty cells for: ${blank.join(', ')}`);
  }
}

if (problems.length) {
  console.error("✗ the bar vocabulary tables on bar-widgets.mdx disagree with haus.\n");
  for (const problem of problems) console.error(`  ${problem}`);
  console.error(`
The two lists are data in haus (\`modules/bar/{tones,marks}.nix\`), published as
\`docs/site-data/bar-{tones,marks}.json\`. Fix the page:

  content/docs/haus/rooms/bar-widgets.mdx   ("Tones, not colours")

then refresh the snapshot:
  node scripts/check-bar-tables.mjs --haus <haus-checkout> --update`);
  process.exit(1);
}

// The snapshot half: the wording haus carries, so a rewrite there reaches a
// human here.
const current =
  JSON.stringify(
    {
      _note: 'Generated by scripts/check-bar-tables.mjs --update. Do not edit by hand.',
      tones: columns(tones),
      marks: columns(marks),
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
  console.log('bar tones and marks unchanged — the tables are as current as the last human pass.');
  process.exit(0);
}

console.error("✗ haus's bar vocabulary moved since the docs were last checked.\n");
const before = JSON.parse(committed);
const after = JSON.parse(current);
// Counted, because a report with no rows in it reads as a bug in the check
// rather than as drift. ORDER is the case that gets there: a rung moved in the
// ladder, with the page corrected in the same pass, passes the live half and
// changes no name and no meaning — so every loop below finds nothing to say.
let said = 0;
for (const axis of ['tones', 'marks']) {
  const kind = axis.slice(0, -1);
  const was = new Map(before[axis].map((row) => [row.name, row.meaning]));
  const now = new Map(after[axis].map((row) => [row.name, row.meaning]));
  for (const [name, meaning] of now) {
    if (!was.has(name)) {
      console.error(`  added ${kind}: ${name} — ${meaning}`);
      said++;
    } else if (was.get(name) !== meaning) {
      console.error(`  reworded ${kind}: ${name}`);
      console.error(`    was: ${was.get(name)}`);
      console.error(`    now: ${meaning}`);
      said++;
    }
  }
  for (const name of was.keys()) {
    if (!now.has(name)) {
      console.error(`  removed ${kind}: ${name}`);
      said++;
    }
  }
  const wasOrder = before[axis].map((row) => row.name);
  const nowOrder = after[axis].map((row) => row.name);
  if (
    JSON.stringify(wasOrder) !== JSON.stringify(nowOrder) &&
    JSON.stringify([...wasOrder].sort()) === JSON.stringify([...nowOrder].sort())
  ) {
    console.error(`  reordered ${axis}: the same rungs, in a new sequence`);
    console.error(`    was: ${wasOrder.join(', ')}`);
    console.error(`    now: ${nowOrder.join(', ')}`);
    said++;
  }
}
if (!said) {
  console.error('  the snapshot differs but no row does — most likely its own shape moved.');
  console.error(`    diff ${SNAPSHOT} against a fresh --update to see what.`);
}
console.error(`
The page's wording is the page's — it is shorter than haus's on purpose, since
haus writes for someone editing the bar. Re-read the rows above against

  content/docs/haus/rooms/bar-widgets.mdx   ("Tones, not colours")

edit whatever actually changed, then refresh the snapshot:
  node scripts/check-bar-tables.mjs --haus <haus-checkout> --update`);
process.exit(1);
