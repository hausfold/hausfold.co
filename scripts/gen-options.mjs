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
// One sentence per named recursive validator. haus's registry carries it beside
// the name so the rule is stated wherever the name is rendered rather than only
// in the guide about writing a desktop, which is a different file in a
// different repository that nothing checks against this one.
//
// Absent, the class still renders and the sentence does not. Exiting instead
// would take the whole page out over a haus checkout that is merely older than
// this renderer, and the miss already surfaces the honest way: the page comes
// out short of its rule lines, `--check` reports it STALE, and regenerating
// against a current haus fixes it.
const VALIDATORS = GROUPS.validators ?? {};

// And one per host-only reason, carried the same way and for the same reason:
// the classification alone says a shared desktop may not set the leaf, which is
// the half a reader can already see from the option's name being someone's
// email address and cannot see at all when it is a font package. Degrades the
// same way — the row keeps its classification and loses its sentence.
const HOST_ONLY_REASONS = GROUPS.hostOnlyReasons ?? {};

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

// haus writes examples and little aligned tables inside its descriptions as
// indented blocks — two spaces, the way a Nix `''` string reads in an editor.
// Markdown needs FOUR to call that a code block, so all of them arrived here
// as running prose with their newlines collapsed: `haus.bar.bottom.items`'s
// five-line sample rendered as one 100-character line, and the two-column
// tables under `haus.displays` and `haus.appearance.largePrint` lost the
// column that made them tables.
//
// A paragraph whose every line is indented is fenced instead. Two exclusions
// keep it honest: a bulleted list is already valid Markdown at two spaces and
// is left alone, and a block only claims to be `nix` when every line of it
// closes the way Nix closes — on `;`, `{` or `}`, discounting a trailing
// comment. Everything else is fenced as plain text, which is what an aligned
// table wants anyway: a monospace box that keeps its columns.
const LIST_ITEM = /^\s*(?:[-*+]\s|\d+[.)]\s)/;
const NIX_LINE = /(?:[;{}])$/;

function promoteIndentedBlocks(text) {
  return text
    .split(/\n[ \t]*\n/)
    .map((paragraph) => {
      const body = paragraph.split('\n').filter((line) => line.trim());
      if (body.length === 0) return paragraph;
      if (!body.every((line) => /^ {2,}\S/.test(line))) return paragraph;
      if (LIST_ITEM.test(body[0])) return paragraph;
      const indent = Math.min(...body.map((line) => line.match(/^ */)[0].length));
      const dedented = paragraph
        .split('\n')
        .map((line) => line.slice(indent))
        .join('\n')
        .replace(/^\n+|\n+$/g, '');
      const nix = body.every((line) => NIX_LINE.test(line.replace(/\s+#.*$/, '').trimEnd()));
      return `\`\`\`${nix ? 'nix' : 'text'}\n${dedented}\n\`\`\``;
    })
    .join('\n\n');
}

function docsLinks(value) {
  return value.replaceAll('](/internals/flakes/', '](/docs/haus/internals/flakes/');
}

// What a SHARED DESKTOP may do with this option, out of haus's registry: the
// same classification `checkDesktop` enforces, and the reason a desktop file
// can be trusted by reading it. Only the two interesting answers are rendered.
// Most options are plainly desktop-safe, and a line saying so under every one
// of them would be 250 rows of noise around the 54 that matter; the page intro
// says that unmarked means safe.
//
// Both interesting answers now carry their WHY from the same place. The
// host-only row used to state the classification alone, because the 43 of them
// are host-only for at least four different reasons — it names a person or a
// secret, it names hardware, it takes a `pkgs` value, or it is a command the
// machine would run — and one sentence written here would have been false on
// most of the rows it printed. haus carries the per-option reason in its
// registry now, beside `desktopSafe`, exactly as a validator's rule sits beside
// its name; this reads it rather than inventing one.
//
// An unclassified option renders with no line at all rather than taking the
// page down. haus's own room-registry check refuses one, but that is an
// invariant in another repository, and this file's whole design is that an
// older or odder haus degrades the render instead of stopping it.
function renderSafety(option) {
  const meta = NAMESPACES[groupOf(option.name)]?.options?.[option.name];
  if (!meta) return undefined;
  if (meta.desktopSafe === false) {
    const named =
      '**Host-only.** A shared desktop may not set it; only your host file can.';
    const why = HOST_ONLY_REASONS[meta.reason]?.why;
    return why ? `${named} ${why}` : named;
  }
  if (meta.desktopSafe !== 'recursive' || !meta.validator) return undefined;
  const rule = VALIDATORS[meta.validator]?.rule;
  const named = `**Desktop-safe per key** (\`${meta.validator}\`).`;
  return rule ? `${named} ${rule}` : named;
}

// --- anchors ---------------------------------------------------------
//
// Every option heading carries an explicit id (fumadocs' `[#id]` suffix)
// rather than taking the slugger's. Two reasons, both practical: the slugger
// DROPS dots, so `haus.bar.items.agents` came out `#hausbaritemsagents` and
// a hand-written link to one was unreadable and easy to get wrong; and this
// file has to emit links to those anchors itself — the per-namespace index
// and the cross-references below — which means it needs to know the id
// rather than guess it.
//
// Nothing outside this page linked to an option anchor when they changed;
// the room anchors those pages DO link to (`options#bar`) are h2s, and are
// deliberately left on the slugger.
const anchors = new Map();
{
  const taken = new Set();
  for (const option of [...options].sort((a, b) => a.name.localeCompare(b.name))) {
    // `<name>` and `*` stand in for keys nobody declared; they are legal in
    // an option's name and not in an id.
    const base = option.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    let id = base;
    for (let n = 2; taken.has(id); n += 1) id = `${base}-${n}`;
    taken.add(id);
    anchors.set(option.name, id);
  }
}
const anchorOf = (name) => anchors.get(name);

// --- one description, two options ------------------------------------
//
// haus declares some options from a shared description on purpose: every
// pill on the menu bar (`haus.bar.items.<pill>`) is also offered on the
// optional second bar (`haus.bar.bottom.items.<pill>`), and both leaves get
// the same paragraphs out of the module system because they describe the
// same readout. Rendered twice that is ~12,000 characters of exact
// duplication on one page, and — worse for a reader scrolling it — the same
// four-hundred-word essay met twice under two names.
//
// So a description that appears more than once is rendered ONCE, under the
// shortest of the names that share it, and the others cross-reference it.
// The rule is the description, not the namespace: this knows nothing about
// bars or pills, and a future pair of options sharing prose folds the same
// way with no change here.
//
// Only LONG shared descriptions fold. `The battery pill.` is shorter than
// the sentence that would point at it, and sending a reader up the page for
// four words is a worse page than printing them twice.
const SHARED_FOLD_OVER = 240;
const canonical = new Map();
{
  const byDescription = new Map();
  for (const option of options) {
    const key = (option.description ?? '').trim();
    if (key.length < SHARED_FOLD_OVER) continue;
    if (!byDescription.has(key)) byDescription.set(key, []);
    byDescription.get(key).push(option.name);
  }
  for (const names of byDescription.values()) {
    if (names.length < 2) continue;
    // Shortest name wins, alphabetical on a tie: the shorter address is the
    // plainer one (`haus.bar.items.agents` over `haus.bar.bottom.items.agents`),
    // which is the one a reader arrives at first from anywhere but this page.
    const owner = [...names].sort((a, b) => a.length - b.length || a.localeCompare(b))[0];
    for (const name of names) if (name !== owner) canonical.set(name, owner);
  }
}

// --- long descriptions -----------------------------------------------
//
// The prose on this page is haus's own: every paragraph under every option
// is that option's `description` in its `.nix` declaration, and this file
// may not rewrite a word of it. What it CAN do is decide how much of it a
// reader meets at once. Over half of haus's option descriptions run past 500
// characters and a couple of dozen past 2,000 — a reference page that opens
// every one of them at full length is a page you scroll past rather than
// read.
//
// So: the opening paragraph stays open, and the rest goes behind a
// disclosure. Nothing is removed — the text is in the HTML, in the search
// index, in `llms-full.txt` and in the page's Markdown. (Whether a browser's
// own find-in-page opens a closed `<details>` is the browser's call and not
// uniform, which is why the page promises search rather than ⌘F.)
//
// The real fix for a 2,000-character option description is upstream, in the
// `.nix` file that declares it. This is what makes the page readable in the
// meantime, and it gets quietly better as those descriptions get shorter:
// under the threshold, an option renders exactly as it always did.
const FOLD_OVER = 700;
const FOLD_MIN_REST = 240;
const LEDE_MIN = 260;
const PARAGRAPH_SPLIT_OVER = 900;

// A period that ends a sentence, and not one of the ones that don't. Inline
// code is masked first, so `media-control test` exits… cannot be a boundary.
const ABBREVIATION = /(?:\b(?:e\.g|i\.e|etc|vs|cf|approx|Mr|Mrs|Ms|Dr|St|no|al|Inc|Ltd)|\s[A-Z])\.$/;

function sentences(text) {
  // Inline code is masked with a sentinel that cannot occur in the prose, so
  // a period inside `media-control test` is not a sentence boundary, and
  // unmasking cannot collide with a number that was always in the text.
  const spans = [];
  const masked = text.replace(/`[^`\n]*`/g, (span) => {
    spans.push(span);
    return `\uE000${spans.length - 1}\uE000`;
  });
  const unmask = (value) => value.replace(/\uE000(\d+)\uE000/g, (_, index) => spans[index]);

  const out = [];
  const boundary = /[.!?]["')\]]?\s+/g;
  let start = 0;
  let match;
  while ((match = boundary.exec(masked))) {
    const head = masked.slice(start, match.index + 1);
    if (ABBREVIATION.test(head)) continue;
    if (!/[A-Z0-9"“(\uE000]/.test(masked[boundary.lastIndex] ?? '')) continue;
    out.push(unmask(masked.slice(start, boundary.lastIndex).trimEnd()));
    start = boundary.lastIndex;
  }
  if (start < masked.length) out.push(unmask(masked.slice(start)).trim());
  return out.filter(Boolean);
}

// Blank lines off either end, INDENTATION left alone. A plain `.trim()` here
// takes the leading spaces off the first line of whichever half it lands on,
// and an indented block that starts a half then stops looking indented to
// `promoteIndentedBlocks` — which is how four aligned tables came out as one
// run-on paragraph inside a `<details>`.
const trimBlankLines = (value) => value.replace(/^(?:[ \t]*\n)+/, '').replace(/\s+$/, '');

// What stays open, and what goes behind the disclosure. Returns `[lede, rest]`
// with an empty `rest` meaning "render it as one piece, as before".
function fold(description) {
  const text = trimBlankLines(description);
  // A fenced block is the one thing that cannot be cut in half by accident.
  // None of haus's descriptions carries one today; if one ever does, it
  // renders whole rather than wrongly.
  if (text.length <= FOLD_OVER || text.includes('```')) return [text, ''];

  const paragraphs = text.split(/\n\s*\n/);
  // A paragraph ending in a colon is announcing the next one — `haus.bar.logo.
  // gestures` opens "What the logo pill does when clicked:" and the list of
  // what it does is the paragraph after it. Folding between the two leaves a
  // sentence pointing at nothing, so keep taking paragraphs until one closes.
  let taken = 1;
  while (taken < paragraphs.length && /:$/.test(paragraphs[taken - 1].trimEnd())) taken += 1;
  let lede = trimBlankLines(paragraphs.slice(0, taken).join('\n\n'));
  let rest = trimBlankLines(paragraphs.slice(taken).join('\n\n'));

  // 17 of the long ones are a single unbroken paragraph, and they are the
  // longest on the page. Cut those at a sentence instead.
  if (!rest && lede.length > PARAGRAPH_SPLIT_OVER) {
    const parts = sentences(lede);
    let kept = 0;
    while (kept < parts.length - 1 && parts.slice(0, kept + 1).join(' ').length < LEDE_MIN) {
      kept += 1;
    }
    const head = parts.slice(0, kept + 1).join(' ');
    const tail = parts.slice(kept + 1).join(' ');
    if (tail.length >= FOLD_MIN_REST) {
      lede = head;
      rest = tail;
    }
  }

  if (rest.length < FOLD_MIN_REST) return [text, ''];
  return [lede, rest];
}

// An example that fits on the metadata line goes on it. The large majority of
// the examples on this page are one short token — `false`, `"24h"`, `12` —
// and each was arriving as a paragraph reading "Example:" over a bordered,
// syntax-highlighted figure with a copy button in the corner: five lines of
// furniture around one word, over and over. The handful that are a real Nix
// snippet still get the block, which is what the block is for.
const EXAMPLE_INLINE_MAX = 40;
const inlineExample = (example) =>
  example !== undefined && !example.includes('\n') && example.trim().length <= EXAMPLE_INLINE_MAX
    ? example.trim()
    : undefined;

function renderOption(option) {
  const anchor = anchorOf(option.name);
  const example = literal(option.example);
  const inline = inlineExample(example);
  const meta = [`\`${option.type}\``, renderDefault(option)];
  if (inline !== undefined) meta.push(`e.g. \`${inline}\``);
  const lines = [`#### \`${option.name}\` [#${anchor}]`, '', meta.join(' · '), ''];
  const safety = renderSafety(option);
  if (safety) lines.push(mdxText(safety), '');

  const owner = canonical.get(option.name);
  if (owner) {
    lines.push(
      `Described under [\`${owner}\`](#${anchorOf(owner)}). haus declares both ` +
        'from one description, and this page prints it once.',
      '',
    );
  } else {
    // Fold on the raw text, THEN fence its indented blocks: `fold` refuses to
    // cut a description that already carries a fence, and promoting first
    // would hand it one on every option that has a sample in it.
    const [lede, rest] = fold(option.description ?? '');
    lines.push(mdxText(promoteIndentedBlocks(lede)), '');
    if (rest) {
      lines.push(
        '<details className="hf-more">',
        '',
        // 100-odd disclosures on one page would otherwise share one
        // accessible name, and a screen reader's controls list would be a
        // column of identical "More detail" rows. The visible label stays
        // two words.
        `<summary>More detail<span className="sr-only"> on ${mdxText(option.name)}</span></summary>`,
        '',
        mdxText(promoteIndentedBlocks(rest)),
        '',
        '</details>',
        '',
      );
    }
    if (example !== undefined && inline === undefined) {
      lines.push('Example:', '', '```nix', example.trimEnd(), '```', '');
    }
  }

  const declaration = option.declarations?.[0];
  if (declaration) {
    lines.push(`<small>Declared in [\`${declaration}\`](${REPO}/${declaration}).</small>`, '');
  }
  return lines.join('\n');
}

// The namespace's own contents, as one line of links under its blurb. It is
// what the table of contents used to be: with every option in the sidebar
// the rail was one row per option and wrapped `haus.apps.videoPlayer.enable`
// across three lines, which is a list nobody reads. The TOC now stops at the
// namespace (`maxHeadingLevel: 3` in the frontmatter, honoured by the docs
// page), and the leaf names live here instead — beside the prose they point
// into, short because the namespace is already named above them.
//
// Under four options it is skipped: an index of three things sitting on top
// of the three things is furniture, not navigation.
const INDEX_OVER = 3;

function renderIndex(group, groupOptions) {
  if (groupOptions.length <= INDEX_OVER) return [];
  const prefix = `${PREFIX}.${group}.`;
  const links = groupOptions.map((option) => {
    const leaf = option.name.startsWith(prefix) ? option.name.slice(prefix.length) : option.name;
    // No `mdxText` here: the leaf goes inside a code span, and MDX does not
    // read JSX inside one — escaping `<name>` there prints the entity.
    return `[\`${leaf}\`](#${anchorOf(option.name)})`;
  });
  return ['<div className="hf-optindex">', '', links.join(' '), '', '</div>', ''];
}

function renderNamespace(group) {
  const heading = [`### ${PREFIX}.${group}`, ''];
  const blurb = NAMESPACES[group]?.blurb;
  if (blurb) heading.push(docsLinks(mdxText(blurb)), '');
  const groupOptions = groups.get(group).sort((a, b) => a.name.localeCompare(b.name));
  heading.push(...renderIndex(group, groupOptions), '');
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
  maxHeadingLevel: 3
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

Apply changes with \`haus rebuild\`. Each option lists its **type**, its
**default** and, where it fits on the line, an example under its name, and
links to the file that declares it. A long description opens on its first
paragraph and keeps the rest behind **More detail**; nothing is cut, and
search finds what is inside it.

{/* The scope hook for this page's layout. Every rule that turns an option
    heading into a ruled row hangs off \`.prose:has(.hf-options)\` in
    src/app/global.css, so nothing here reaches an ordinary docs page. The
    div draws nothing. */}

<div className="hf-options" />


A few also carry a line about what a **shared desktop** may do with them.
*Host-only* means [a desktop](/docs/haus/desktops/creating) may not set it, and
the reason why is stated beside it. *Desktop-safe per key* means the option
takes keys nobody declared, so a named rule decides which of them a desktop may
write; that rule is stated beside it too. Anything unmarked is plain
desktop-safe. This is the same classification \`haus.lib.checkDesktop\` enforces
before a desktop is evaluated.

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
