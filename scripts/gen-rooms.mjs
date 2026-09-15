#!/usr/bin/env node
// The rooms gallery on `rooms/index`, rendered from the table the API serves.
//
// `worker-config.js`'s ROOMS is the one source of truth for the gallery
// (`/v1/rooms`, and this page), so the page cannot be a second hand-written
// copy of it: a sentence reworded in the row would leave the page claiming the
// old one, and nothing would say so. This renders the two blocks between their
// markers from the table, and `--check` fails on a hand edit.
//
// Two blocks rather than one, because the page is not a gallery with prose
// around it — it is a page about rooms with two lists in it, and the section
// between them ("The names you write") answers a different question:
//
//   rooms:start … rooms:end            the cards, one per room haus ships
//   rooms:published:start … :end       the rooms somebody else wrote
//
// What is NOT generated: the lede, the namespace table, the prose about what a
// room somebody else wrote costs you, and everything else on the page.
//
// The seam moved when this landed, and it is worth being explicit about where
// it is now. `check-rooms.mjs` snapshots haus's own blurbs and refuses to put
// them on a card, because they are written for the options reference; the card
// sentence was the page's answer to that. It is the TABLE's answer now, for one
// reason: `/v1/rooms` needs it too, and a sentence written twice is a sentence
// that disagrees with itself. So the facts are still haus's, the sentence about
// them is still ours, and "ours" is `worker-config.js` rather than the MDX.
//
// Why a generated block and not a React component reading the table: a
// component hides its prose from the search index and from `llms-full.txt`
// (AGENTS.md, "a component the prose could have been"). These sentences are
// among the most searchable on the site, so they stay in the MDX.
//
// Usage:
//   node scripts/gen-rooms.mjs            # rewrite both blocks
//   node scripts/gen-rooms.mjs --check    # fail if either is out of step

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOMS, ROOM_REGISTRY, roomRow } from '../worker-config.js';

const here = dirname(fileURLToPath(import.meta.url));
const PAGE = join(here, '../content/docs/haus/rooms/index.mdx');
const PAGE_NAME = 'content/docs/haus/rooms/index.mdx';
const ICONS = join(here, '../src/lib/icons.tsx');

const CARDS_START = '{/* rooms:start';
const CARDS_END = '{/* rooms:end */}';
const PUBLISHED_START = '{/* rooms:published:start';
const PUBLISHED_END = '{/* rooms:published:end */}';

// The icon vocabulary, read out of the TypeScript rather than imported from
// it: this is a node script and `src/lib/icons.tsx` is a React module. A name
// that isn't in it prints `[icons] unknown icon` at build and renders nothing,
// which is the silent failure worth one regex here.
const iconNames = new Set(
  [...readFileSync(ICONS, 'utf8').matchAll(/^ {2}'?([a-zA-Z-]+)'?: \{ icon:/gm)].map((m) => m[1]),
);

// The page is hand-wrapped at 80 columns and a generated block has to read the
// same in a diff. Markdown joins the lines back up, links included.
function wrap(text, width = 80) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && `${line} ${word}`.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.join('\n');
}

// A card's `description` is a double-quoted JSX attribute, so a quote in a
// sentence would end the attribute and take the rest of the card with it. It
// refuses rather than escaping, because the fix is to write the sentence
// without one.
function attr(name, value) {
  if (value.includes('"')) {
    throw new Error(
      `The '${name}' row's blurb contains a double quote, which would end the JSX attribute:\n\n  ${value}\n\n` +
        'Rewrite the sentence without one in worker-config.js.\n',
    );
  }
  return value;
}

// The repository a flakeref points at, so the card links the place a reader can
// read the code before pinning it. Same two schemes `gen-desktops.mjs` links,
// and the same refusal for anything else: a room is code, and a card that
// cannot point at it is not a card worth rendering.
function sourceUrl(name, flakeref) {
  if (flakeref.startsWith('github:')) {
    return `https://github.com/${flakeref.slice('github:'.length)}`;
  }
  if (flakeref.startsWith('git+https://')) return flakeref.slice('git+'.length);
  throw new Error(
    [
      `The '${name}' row's flakeref is '${flakeref}', which this script cannot turn into a link.`,
      '',
      'It links github:owner/repo and git+https://… because both are a page a',
      'reader can open. Decide what the card should point at for this one, then',
      'teach sourceUrl in scripts/gen-rooms.mjs the shape.',
      '',
    ].join('\n'),
  );
}

const shipped = (rooms) => Object.keys(rooms).filter((key) => !rooms[key].flakeref);
const published = (rooms) => Object.keys(rooms).filter((key) => rooms[key].flakeref);

// ---------------------------------------------------------------------------
// The cards: one per room haus ships, in haus's own order.
//
// The order is the registry's, not this table's, and the check below is what
// makes that true rather than a coincidence. A room haus publishes with no row
// here fails loudly, because `rooms/creating` has told authors they owe a card
// since the day it was written.
export function renderCards(rooms = ROOMS) {
  const keys = shipped(rooms);
  const want = Object.keys(ROOM_REGISTRY);
  if (JSON.stringify(keys) !== JSON.stringify(want)) {
    throw new Error(
      [
        "worker-config.js's ROOMS is not haus's room list.",
        `    haus:  ${want.join(', ')}`,
        `    ROOMS: ${keys.join(', ')}`,
        '',
        'Every room haus publishes owes a row, in haus\'s order, and a row for a',
        'room haus does not publish is a card pointing at a page that is not there.',
        'The registry is src/data/rooms.json, refreshed by',
        '`npm run rooms:drift:update -- --haus <haus-checkout>`.',
        '',
      ].join('\n'),
    );
  }

  const cards = keys.map((key) => {
    const row = roomRow(key, rooms);
    const { icon } = rooms[key];
    if (!iconNames.has(icon)) {
      throw new Error(
        `The '${key}' row asks for the '${icon}' icon, which src/lib/icons.tsx does not declare. ` +
          'Add it there, or use a name it already has.',
      );
    }
    return [
      '  <Card',
      `    icon={<Icon name="${icon}" />}`,
      `    title="${attr(key, row.title)}"`,
      `    href="/docs/haus/rooms/${key}"`,
      `    description="${attr(key, row.blurb)}"`,
      '  />',
    ].join('\n');
  });

  return [
    `${CARDS_START} — rendered from worker-config.js's ROOMS by \`npm run rooms\`.`,
    '    Edit the row, not this block: `npm run rooms:check` reverts a hand edit. */}',
    '',
    '<Cards>',
    ...cards,
    '</Cards>',
    '',
    CARDS_END,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// The rooms somebody else wrote.
//
// Each is a heading, who wrote it, what it is for, the namespace it claims and
// the line that pins it. Not a `<Card>`: a room in somebody else's repo has no
// page here to link, and the command is the whole point of the entry.
export function renderPublished(rooms = ROOMS) {
  const keys = published(rooms);
  const body = keys.length
    ? keys.flatMap((key) => {
        const row = roomRow(key, rooms);
        const url = sourceUrl(key, row.flakeref);
        return [
          `### ${row.title}`,
          '',
          wrap(
            `**By ${row.author}**, at [\`${row.flakeref}\`](${url}). ${row.blurb}`,
          ),
          '',
          wrap(
            `It claims \`${row.namespaces[0]}\`, so that is the name you write in your host file.`,
          ),
          '',
          // One line, not two: `haus show` is in the prose above, where the
          // page explains that on a room it can only classify and stop.
          '```sh',
          row.command,
          '```',
          '',
        ];
      })
    : [
        // Self-contained on purpose: a generated sentence that points at
        // "the two commands above" is falsified the day somebody edits the
        // prose outside the block, and nothing would catch that.
        wrap(
          'Nobody else\'s room is listed here yet. hausfold reads one before ' +
            'listing it, which is still not vouching for it, and `haus add --room` ' +
            'takes any flakeref in the meantime.',
        ),
        '',
      ];

  return [
    `${PUBLISHED_START} — rendered from worker-config.js's ROOMS by \`npm run rooms\`.`,
    '    Edit the row, not this block: `npm run rooms:check` reverts a hand edit. */}',
    '',
    ...body,
    PUBLISHED_END,
  ].join('\n');
}

function spliceOne(page, start, end, block, name) {
  const from = page.indexOf(start);
  const to = page.indexOf(end);
  if (from < 0 || to < 0) {
    throw new Error(
      `${PAGE_NAME} has no \`${start} … ${end}\` block. That block is where the ${name} goes; ` +
        'put the markers back rather than deleting the generated section.',
    );
  }
  return page.slice(0, from) + block + page.slice(to + end.length);
}

export function splice(page, rooms = ROOMS) {
  const withCards = spliceOne(page, CARDS_START, CARDS_END, renderCards(rooms), 'catalogue');
  return spliceOne(
    withCards,
    PUBLISHED_START,
    PUBLISHED_END,
    renderPublished(rooms),
    'published rooms',
  );
}

const main = process.argv[1] && process.argv[1].endsWith('gen-rooms.mjs');
if (main) {
  const check = process.argv.includes('--check');
  let page;
  let want;
  try {
    page = readFileSync(PAGE, 'utf8');
    want = splice(page);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
  if (page === want) {
    console.log(`${PAGE_NAME} is in step with worker-config.js's ROOMS.`);
    process.exit(0);
  }
  if (check) {
    console.error(
      [
        `${PAGE_NAME}'s gallery is out of step with worker-config.js's ROOMS.`,
        '',
        'Either a row changed and the page was not re-rendered, or a block was',
        'edited by hand. The row is the source of truth, so:',
        '',
        '  npm run rooms',
        '',
      ].join('\n'),
    );
    process.exit(1);
  }
  writeFileSync(PAGE, want);
  console.log(`Rendered the gallery into ${PAGE_NAME}.`);
}
