#!/usr/bin/env node
// Renders content/docs/haus/reference/options.mdx from haus's module system.
//
// haus renders its own module system to JSON (nixosOptionsDoc over the
// per-room option files) and commits it at docs/site-data/. This script reads
// those files, so the module system remains the single source of truth for
// every type, default, example and description on the page.
//
// Narrative guides stay hand-written. This is the reference only.
//
// Usage:
//   node scripts/gen-options.mjs --haus <haus-checkout>
//   node scripts/gen-options.mjs --haus <haus-checkout> --check
//
// Needs a haus checkout and nothing else: no Nix, flake pin or nixpkgs fetch.
// haus's site-data-current flake check keeps the committed JSON honest on the
// side of the repository boundary that owns the derivation.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const PAGE = join(here, '../content/docs/haus/reference/options.mdx');
const REPO = 'https://github.com/hausfold/haus/blob/main';

const args = process.argv.slice(2);
const check = args.includes('--check');
const hausIdx = args.indexOf('--haus');
const haus = hausIdx >= 0 ? args[hausIdx + 1] : process.env.HAUS_DIR;
if (!haus || !existsSync(haus)) {
  console.error('usage: gen-options.mjs --haus <haus-checkout> [--check]');
  process.exit(2);
}

// docs/site-data/ is haus's published surface: generated from its module
// system, committed, and pinned by its own site-data-current flake check. A
// checkout is all this repository needs.
const SITE_DATA = join(haus, 'docs/site-data');
function hausFile(name, why) {
  const path = join(SITE_DATA, name);
  if (!existsSync(path)) {
    console.error(
      `The haus checkout at ${haus} has no \`docs/site-data/${name}\`.\n\n` +
        `${why}\n\n` +
        'That directory is generated and committed by haus (`nix build .#site-data`).\n' +
        'Update the checkout and re-run.\n',
    );
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

const raw = hausFile('options.json', 'That file is what this page is rendered from.');

// The room registry: which room owns each namespace, the order a person should
// meet them in, and a sentence about each. The module system cannot produce any
// of it — it has no notion of "identity first, policy last", no place for a
// sentence about a whole namespace, and no idea that `haus.bar` and
// `haus.menuBar` are one room with two addresses. haus publishes it beside
// options.json so every consumer groups the surface the same way.
const GROUPS = hausFile(
  'groups.json',
  'That file carries the room registry this page is laid out from.',
);
// `groups.json` still carries a flat `<namespace>: { order, blurb }` alias at
// its top level for an older renderer. Read the versioned tables instead: the
// aliases are editorial only, and the owner — which room a namespace is in —
// exists nowhere but `namespaces`.
const NAMESPACES = GROUPS.namespaces ?? {};
const ROOMS = GROUPS.rooms;
if (!ROOMS) {
  console.error(
    'groups.json carries no `rooms` table.\n\n' +
      'The haus checkout predates the room registry. Update it and re-run.\n',
  );
  process.exit(1);
}

// A generated cross-repository artifact fails by emptying, not by erroring.
// Keep a hard floor here so a namespace disagreement cannot produce a valid
// page with a title, an intro and zero options.
const NS = 'haus.';
const PREFIX = 'haus';
if (!Object.keys(raw).some((name) => name.startsWith(NS))) {
  console.error(
    'options.json carries no `haus.*` keys.\n\n' +
      'That is a broken render, not a layer with no options. Fix the namespace\n' +
      'agreement rather than committing an empty page.\n',
  );
  process.exit(1);
}

const options = Object.entries(raw)
  .filter(([name]) => name.startsWith(NS))
  .map(([name, option]) => ({ name, ...option }));

// Second path segment is the namespace: haus.git.name -> git.
const groupOf = (name) => name.split('.')[1];

const groups = new Map();
for (const option of options) {
  const group = groupOf(option.name);
  if (!groups.has(group)) groups.set(group, []);
  groups.get(group).push(option);
}

// A namespace without an explicit order lands alphabetically after the ordered
// ones rather than disappearing.
const orderOf = (group) => NAMESPACES[group]?.order ?? Number.MAX_SAFE_INTEGER;
const ordered = [...groups.keys()].sort(
  (a, b) => orderOf(a) - orderOf(b) || a.localeCompare(b),
);

// The page is laid out by ROOM — the unit the product model names and the one
// the sidebar is organised around — with each room's namespaces under it in
// their own reading order. A namespace whose room the registry doesn't know
// still renders, in a trailing room of its own, because a reference page that
// silently drops options is worse than one with an ugly heading.
const roomOf = (group) => NAMESPACES[group]?.owner ?? group;
const roomOrder = (room) => ROOMS[room]?.order ?? Number.MAX_SAFE_INTEGER;
const rooms = new Map();
for (const group of ordered) {
  const room = roomOf(group);
  if (!rooms.has(room)) rooms.set(room, []);
  rooms.get(room).push(group);
}
const orderedRooms = [...rooms.keys()].sort(
  (a, b) => roomOrder(a) - roomOrder(b) || a.localeCompare(b),
);
const roomTitle = (room) => ROOMS[room]?.title ?? room;

const literal = (value) =>
  value && typeof value === 'object' && 'text' in value ? value.text : undefined;

function renderDefault(option) {
  const value = literal(option.default);
  if (value === undefined) return 'no default';
  const oneLine = value.replace(/\s+/g, ' ').trim();
  return oneLine.length > 60 ? 'see below' : `default \`${oneLine}\``;
}

// Fumadocs parses the output as MDX rather than Markdown. Literal braces and
// angle brackets in prose are therefore JSX unless escaped. Preserve code
// spans and fenced blocks byte-for-byte; encode those characters everywhere
// else so descriptions authored in Nix remain prose in the generated page.
function mdxText(value) {
  return value
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((part, index) =>
      index % 2 === 1
        ? part
        : part.replaceAll('{', '&#123;').replaceAll('}', '&#125;').replaceAll('<', '&lt;'),
    )
    .join('');
}

function docsLinks(value) {
  return value.replaceAll('](/internals/flakes/', '](/docs/haus/internals/flakes/');
}

function renderOption(option) {
  const lines = [
    `#### \`${option.name}\``,
    '',
    `\`${option.type}\` · ${renderDefault(option)}`,
    '',
  ];
  lines.push(mdxText((option.description ?? '').trimEnd()), '');
  const example = literal(option.example);
  if (example !== undefined) {
    lines.push('Example:', '', '```nix', example.trimEnd(), '```', '');
  }
  const declaration = option.declarations?.[0];
  if (declaration) {
    lines.push(`<small>Declared in [\`${declaration}\`](${REPO}/${declaration}).</small>`, '');
  }
  return lines.join('\n');
}

function renderNamespace(group) {
  const heading = [`### ${PREFIX}.${group}`, ''];
  const blurb = NAMESPACES[group]?.blurb;
  if (blurb) heading.push(docsLinks(mdxText(blurb)), '', '');
  const groupOptions = groups.get(group).sort((a, b) => a.name.localeCompare(b.name));
  return heading.join('\n') + groupOptions.map(renderOption).join('\n');
}

const body = orderedRooms
  .map((room) => {
    const heading = [`## ${roomTitle(room)}`, ''];
    const blurb = ROOMS[room]?.blurb;
    if (blurb) heading.push(docsLinks(mdxText(blurb)), '', '');
    return heading.join('\n') + rooms.get(room).map(renderNamespace).join('\n');
  })
  .join('\n');

const page = `---
title: ${PREFIX}.* options
description: Every option you can set in your host file — types, defaults, and what each one changes.
icon: options
tableOfContents:
  maxHeadingLevel: 2
related:
  - title: "Customize a desktop"
    description: "The practical guide to choosing settings, switching rooms off, and overriding a desktop from your host file."
    href: "/docs/haus/desktops/customizing"
    icon: "dials"
  - title: "The haus CLI"
    description: "Apply, inspect, change, and undo those options from the command line."
    href: "/docs/haus/reference/haus"
    icon: "wrench"
---

{/* GENERATED FILE — do not edit by hand.

     Rendered from haus's own module system by scripts/gen-options.mjs.
     To change an option's description, edit its declaration in haus and
     regenerate:

         node scripts/gen-options.mjs --haus /path/to/haus

     CI re-renders this and fails if it differs, so a hand edit here is
     guaranteed to be reverted. */}

These are the \`${PREFIX}.*\` options you set in your host file at
\`~/.config/nix/hosts/<hostname>/default.nix\`. Everything here is optional
unless noted; the defaults are a complete, working system.

The page is grouped by **room** — the same rooms the sidebar is organised
around — and each room lists the \`${PREFIX}.*\` namespaces it owns. A room
can own more than one: the Bar room is \`${PREFIX}.bar\` (its own bar) *and*
\`${PREFIX}.menuBar\` (macOS's).

Apply changes with \`haus rebuild\`. Each option lists its **type** and
**default** under its name, and links to the file that declares it.

${body}
`;

const current = existsSync(PAGE) ? readFileSync(PAGE, 'utf8') : '';
if (check) {
  if (current === page) {
    console.log(`options reference is current (${options.length} options).`);
    process.exit(0);
  }
  console.error(
    'options reference is STALE.\n\n' +
      'haus options changed and this page was not regenerated. Run:\n' +
      '  node scripts/gen-options.mjs --haus <haus-checkout>\n' +
      'and commit the result. Do not edit the page by hand.\n',
  );
  process.exit(1);
}

writeFileSync(PAGE, page);
console.log(
  `wrote ${PAGE} (${options.length} options, ${ordered.length} namespaces, ` +
    `${orderedRooms.length} rooms).`,
);
