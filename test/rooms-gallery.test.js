// The rooms gallery's two ends: the table in worker-config.js, and the blocks
// it renders into `content/docs/haus/rooms/index.mdx`.
//
// `npm test` is the gate this repo actually runs on a row change (worker.yml
// fires on worker-config.js), so the page check lives here as well as in
// `npm run rooms:check`, which is what docs.yml runs when only the content
// changed. Both call the same renderer, so there is one answer to "what should
// the page say", not two.
//
// The third link in the chain — is the snapshot still haus's room list? — is
// `scripts/check-rooms.mjs`, which needs a haus checkout and runs on a cron.
// What is checkable here without one is that ROOMS and the snapshot agree,
// which is the half that goes wrong when somebody edits a table by hand.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { ROOMS, ROOM_REGISTRY, roomRow } from '../worker-config.js';
import { renderCards, renderPublished, splice } from '../scripts/gen-rooms.mjs';

const PAGE = 'content/docs/haus/rooms/index.mdx';
const page = readFileSync(new URL(`../${PAGE}`, import.meta.url), 'utf8');
const snapshot = JSON.parse(
  readFileSync(new URL('../src/data/rooms.json', import.meta.url), 'utf8'),
);

// A room in somebody else's repo, to render the half the live table has no row
// for yet. A fixture rather than a row: a row in worker-config.js is a promise
// that hausfold has read the code, and this repo is not in a position to make
// that promise about an invented flakeref.
const FIXTURE = {
  photography: {
    icon: 'apps',
    flakeref: 'github:ada/photo-room',
    namespace: 'photography',
    title: 'Photography',
    author: 'ada',
    blurb: 'Lightroom, a tethering hotkey and a scratch disk that survives a rebuild.',
  },
};

describe('the rooms table', () => {
  it('is haus\'s room list, in haus\'s order', () => {
    const shipped = Object.keys(ROOMS).filter((key) => !ROOMS[key].flakeref);
    const registry = snapshot.rooms.filter((room) => room.kind === 'room').map((room) => room.key);
    // Order counts as much as membership: the gallery is read in the order
    // haus publishes, which is the order a person should meet the rooms in.
    expect(shipped).toEqual(registry);
    expect(Object.keys(ROOM_REGISTRY)).toEqual(registry);
  });

  // The gallery's order is internal-first, on the page, in the API and in the
  // table. `/v1/rooms` builds its two halves explicitly so a row in the wrong
  // place cannot break the API contract; this is the other half, and it keeps
  // the table itself readable in the order everything else presents.
  it('declares every room haus ships before every room somebody else wrote', () => {
    const kinds = Object.values(ROOMS).map((row) => (row.flakeref ? 'published' : 'shipped'));
    expect(kinds).toEqual([...kinds].sort().reverse());
  });

  it('gives every row what a card needs', () => {
    for (const [key, row] of Object.entries(ROOMS)) {
      expect(typeof row.author, key).toBe('string');
      expect(row.author.length, key).toBeGreaterThan(0);
      expect(row.blurb, key).toMatch(/\S/);
      // One sentence. A paragraph here is a page's job, and it would not fit a
      // card in the CLI or the palette either. haus's own blurb for this room
      // is often much longer, which is the whole reason this table exists.
      expect(row.blurb.length, key).toBeLessThan(200);
      expect(typeof row.icon, key).toBe('string');
    }
  });

  // The copy rule this repo holds everything reader-facing to, and these
  // sentences are as reader-facing as a landing page: they are what the card,
  // the page and /v1/rooms all say.
  it('writes no em dash in a blurb', () => {
    for (const [key, row] of Object.entries(ROOMS)) {
      expect(row.blurb, key).not.toContain('—');
    }
  });

  it('answers with the registry\'s facts for a room haus ships', () => {
    const bar = roomRow('bar');
    expect(bar.title).toBe('Bar');
    // Two namespaces, one room: the case that makes `namespaces` a list.
    expect(bar.namespaces).toEqual(['haus.menuBar', 'haus.bar']);
    expect(bar.docs).toBe('https://hausfold.co/docs/haus/rooms/bar');
    expect(bar.flakeref).toBeNull();
    // Nothing installs a room haus ships; its page names the option instead.
    expect(bar.command).toBeNull();
    expect(bar.author).toBe('hausfold');
  });

  // The interesting row, and the one the live table has none of yet.
  it('gives a room in somebody else\'s repo the line that pins it', () => {
    // roomRow reads a table, and the renderer hands it this one: the shape a
    // third-party row takes is checked here rather than on the live gallery.
    const block = renderPublished({ photography: FIXTURE.photography });
    expect(block).toContain('haus add --room --namespace photography github:ada/photo-room');
    expect(block).toContain('**By ada**');
    expect(block).toContain('https://github.com/ada/photo-room');
    // The namespace it claims is the name the reader writes, so the entry says
    // it rather than leaving it to be read off the command.
    expect(block).toContain('`haus.photography`');
  });

  it('refuses a flakeref it cannot turn into a link', () => {
    expect(() =>
      renderPublished({
        odd: { ...FIXTURE.photography, flakeref: 'file+https://example.com/photo.nix' },
      }),
    ).toThrow(/cannot turn into a link/);
  });

  it('refuses a room haus does not publish', () => {
    expect(() => renderCards({ ...ROOMS, invented: { icon: 'apps', author: 'x', blurb: 'y' } })).toThrow(
      /not haus's room list/,
    );
  });

  it('refuses an icon src/lib/icons.tsx does not declare', () => {
    const table = { ...ROOMS, apps: { ...ROOMS.apps, icon: 'no-such-icon' } };
    expect(() => renderCards(table)).toThrow(/does not declare/);
  });
});

describe(`${PAGE}'s gallery`, () => {
  it('is what the table renders, byte for byte', () => {
    // The failure message names the fix, because the next person to see this
    // red will have edited one of the two ends and not the other.
    expect(page, `run \`npm run rooms\` — ${PAGE} is out of step with ROOMS`).toBe(splice(page));
  });

  it('carries a card for every room haus ships', () => {
    for (const key of Object.keys(ROOM_REGISTRY)) {
      expect(page, key).toContain(`href="/docs/haus/rooms/${key}"`);
      expect(page, key).toContain(roomRow(key).blurb);
    }
  });

  // The two blocks are spliced independently, and a renderer that put the
  // published rooms inside the <Cards> grid would still round-trip. This is
  // the pin that they stay two.
  it('keeps the published rooms out of the catalogue grid', () => {
    const cards = page.slice(page.indexOf('<Cards>'), page.indexOf('</Cards>'));
    expect(cards).not.toContain('haus add --room');
  });
});
