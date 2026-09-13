#!/usr/bin/env node
// The desktops gallery on `desktops/choosing`, rendered from the table the API
// serves.
//
// `worker-config.js`'s DESKTOPS is the one source of truth for the gallery
// (`/v1/desktops`, the `get_install_command` tool, the agent view, the A2A
// skill), so the page cannot be a second hand-written copy of it: a blurb
// reworded in the row would leave the page claiming the old one, and nothing
// would say so. This renders the block between the two markers on that page
// from the row, and `--check` fails on a hand edit.
//
// Why a generated block and not a React component reading the table: a
// component hides its prose from the search index and from `llms-full.txt`
// (AGENTS.md, "a component the prose could have been"). The blurbs are the
// most searchable sentences on the page, so they stay in the MDX.
//
// What is NOT generated: the prose around the block, the callout under it, and
// every other section of the page. The rule is the one `check-bar-tables.mjs`
// and `check-rooms.mjs` draw: the data's facts are the data's, the sentences
// about them are the page's.
//
// Usage:
//   node scripts/gen-desktops.mjs            # rewrite the block
//   node scripts/gen-desktops.mjs --check    # fail if it is out of step

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DESKTOPS, desktopRow } from '../worker-config.js';

const here = dirname(fileURLToPath(import.meta.url));
const PAGE = join(here, '../content/docs/haus/desktops/choosing.mdx');
const PAGE_NAME = 'content/docs/haus/desktops/choosing.mdx';
const DESKTOP_PAGES = join(here, '../content/docs/haus/desktops');
const ROOMS = join(here, '../src/data/rooms.json');

const START = '{/* desktops:start';
const END = '{/* desktops:end */}';

// The room registry, the same snapshot `check-rooms.mjs` keeps: it gives each
// room its title and its page, and it is what makes a typo in a row's `rooms`
// list a failure here rather than a dead link on the page.
const rooms = new Map(
  JSON.parse(readFileSync(ROOMS, 'utf8'))
    .rooms.filter((room) => room.kind === 'room')
    .map((room) => [room.key, room.title]),
);

// The page is hand-wrapped at 80 columns and the generated block has to read
// the same in a diff, so every paragraph is wrapped here rather than emitted as
// one long line. Markdown joins the lines back up, links included.
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

// A fence whose `#` comments line up, because two commands of different widths
// with ragged comments is the one thing a generated block can get visibly wrong.
// Past 80 columns the padding is what pushes the block into a sideways scroll,
// so a long command keeps its note on the line above instead.
function fence(lines) {
  const width = Math.max(...lines.map(([cmd]) => cmd.length));
  const notes = Math.max(...lines.map(([, note]) => note.length));
  const inline = width + 3 + 2 + notes <= 80;
  return [
    '```sh',
    ...lines.flatMap(([cmd, note]) =>
      inline ? [`${cmd.padEnd(width)}   # ${note}`] : [`# ${note}`, cmd],
    ),
    '```',
  ].join('\n');
}

// The card links the flakeref at the place a reader can read the file. Derived
// from the flakeref itself rather than from a second field, because a row that
// carried both could disagree with itself, and a row that carried neither used
// to render `https://github.com/undefined` and ship green.
//
// Only the two schemes that are a browsable repository are linked. bootstrap.sh
// also takes `file+https://…/writer.nix`, which is a file and not a page, and
// anything else is a scheme nobody has decided the markup for. Both refuse here
// rather than guess, the same way an `image` does.
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
      'teach sourceUrl in scripts/gen-desktops.mjs the shape.',
      '',
    ].join('\n'),
  );
}

function block(name) {
  const row = desktopRow(name);
  const { pin, flakeref } = { pin: null, flakeref: null, ...DESKTOPS[name] };
  const foundation = pin === null && flakeref === null;

  if (row.image) {
    throw new Error(
      [
        `The '${name}' row has an \`image\`, and this script does not know how to draw one.`,
        '',
        'The site ships no screenshots (AGENTS.md says why), and a page that holds',
        'an image needs `images: { unoptimized: true }` in next.config.mjs. Decide',
        'what a card shows first, then teach this script the markup.',
        '',
      ].join('\n'),
    );
  }

  for (const key of row.rooms) {
    if (!rooms.has(key)) {
      throw new Error(
        `The '${name}' row lists a room called '${key}', which is not in src/data/rooms.json. ` +
          `Use the registry's key (${[...rooms.keys()].join(', ')}).`,
      );
    }
  }

  // The foundation's heading is not its key: `haus` is the layer, and the
  // desktop this row means is the absence of one, which the CLI calls `none`.
  // It must also not read as `None: the foundation`, whose slug the page
  // already spends on the section that covers it in full.
  const heading = foundation ? 'The foundation' : name;

  const by = flakeref
    ? `**By ${row.author}**, at [\`${flakeref}\`](${sourceUrl(name, flakeref)}).`
    : `**By ${row.author}.**`;

  // "switches on", not "rooms", and the distinction is load-bearing: Appearance
  // has no switch of its own, so a desktop that decides a font and an accent
  // sets values in it without ever turning it on. A card headed "Rooms" would
  // contradict `desktops/hacker`, which counts Appearance among hacker's.
  const turns = row.rooms.length
    ? `Rooms it switches on: ${row.rooms.map((key) => `[${rooms.get(key)}](/docs/haus/rooms/${key})`).join(', ')}.`
    : 'It switches no room on, which is the whole of what it is.';

  // Where to read more. A desktop with a page here gets it; the foundation gets
  // the section above, which is the same page's long answer.
  const more = foundation
    ? ' [What you get, in full](#none-the-foundation).'
    : existsSync(join(DESKTOP_PAGES, `${name}.mdx`))
      ? ` [${name}'s own page](/docs/haus/desktops/${name}) has the first moves that make it click.`
      : '';

  // A flakeref row owes the reader the reason it has no short URL, because the
  // absence of one next to two that have it reads as an oversight otherwise.
  const caveat = flakeref
    ? `\n\nThere is no \`hausfold.co/${name}.sh\`: a short installer URL here is one hausfold ` +
      `publishes, and every other desktop installs by flakeref instead. ` +
      `\`haus show ${flakeref}\` prints what it would change before you pin it.`
    : '';

  const fresh = row.command;
  const already = flakeref
    ? `haus add ${flakeref} && haus rebuild`
    : `haus desktop ${pin ?? 'none'} && haus rebuild`;

  return [
    `### ${heading}`,
    '',
    wrap(`${by} ${row.blurb}`),
    '',
    `${turns}${more}${caveat}`.split('\n\n').map((p) => wrap(p)).join('\n\n'),
    '',
    fence([
      [fresh, 'a fresh Mac'],
      [already, 'one that has haus already'],
    ]),
  ].join('\n');
}

export function renderGallery() {
  return [
    `${START} — rendered from worker-config.js's DESKTOPS by \`npm run desktops\`.`,
    '    Edit the row, not this block: `npm run desktops:check` reverts a hand edit. */}',
    '',
    ...Object.keys(DESKTOPS).flatMap((name) => [block(name), '']),
    END,
  ].join('\n');
}

export function splice(page, gallery) {
  const from = page.indexOf(START);
  const to = page.indexOf(END);
  if (from < 0 || to < 0) {
    throw new Error(
      `${PAGE_NAME} has no \`${START} … ${END}\` block. That block is where the gallery goes; ` +
        'put the markers back rather than deleting the generated section.',
    );
  }
  return page.slice(0, from) + gallery + page.slice(to + END.length);
}

const main = process.argv[1] && process.argv[1].endsWith('gen-desktops.mjs');
if (main) {
  const check = process.argv.includes('--check');
  let page;
  let want;
  try {
    page = readFileSync(PAGE, 'utf8');
    want = splice(page, renderGallery());
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
  if (page === want) {
    console.log(`${PAGE_NAME} is in step with worker-config.js's DESKTOPS.`);
    process.exit(0);
  }
  if (check) {
    console.error(
      [
        `${PAGE_NAME}'s gallery is out of step with worker-config.js's DESKTOPS.`,
        '',
        'Either a row changed and the page was not re-rendered, or the block was',
        'edited by hand. The row is the source of truth, so:',
        '',
        '  npm run desktops',
        '',
      ].join('\n'),
    );
    process.exit(1);
  }
  writeFileSync(PAGE, want);
  console.log(`Rendered the gallery into ${PAGE_NAME}.`);
}
