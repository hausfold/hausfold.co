// The desktops gallery's two ends: the table in worker-config.js, and the block
// it renders into `content/docs/haus/desktops/choosing.mdx`.
//
// `npm test` is the gate this repo actually runs on a row change (worker.yml
// fires on worker-config.js), so the page check lives here as well as in
// `npm run desktops:check`, which is what docs.yml runs when only the content
// changed. Both call the same renderer, so there is one answer to "what should
// the page say", not two.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { DESKTOPS, INSTALLER_DESKTOPS, desktopRow } from '../worker-config.js';
import { renderGallery, splice } from '../scripts/gen-desktops.mjs';

const PAGE = 'content/docs/haus/desktops/choosing.mdx';
const page = readFileSync(new URL(`../${PAGE}`, import.meta.url), 'utf8');
const rooms = JSON.parse(readFileSync(new URL('../src/data/rooms.json', import.meta.url), 'utf8'));

describe('the desktops table', () => {
  it('gives every row what a card needs', () => {
    const keys = new Set(rooms.rooms.filter((r) => r.kind === 'room').map((r) => r.key));
    for (const [name, row] of Object.entries(DESKTOPS)) {
      expect(typeof row.author, name).toBe('string');
      expect(row.author.length, name).toBeGreaterThan(0);
      expect(row.blurb, name).toMatch(/\S/);
      // One sentence. A paragraph here is a page's job, and it would not fit a
      // card in the CLI or the palette either.
      expect(row.blurb.length, name).toBeLessThan(200);
      expect(Array.isArray(row.rooms), name).toBe(true);
      // A room key that isn't in haus's registry is a dead link on the page and
      // a lie in the API, so it fails here rather than at build.
      for (const key of row.rooms) expect(keys, `${name} -> ${key}`).toContain(key);
      expect(row.image ?? null, name).toBeNull();
    }
  });

  // The copy rule this repo holds everything reader-facing to, and these
  // sentences are as reader-facing as a landing page: they are what the card,
  // the page and the MCP tool all say.
  it('writes no em dash in a blurb', () => {
    for (const [name, row] of Object.entries(DESKTOPS)) {
      expect(row.blurb, name).not.toContain('—');
    }
  });

  it('keeps the two kinds of row apart: a URL here, or a flakeref', () => {
    for (const [name, row] of Object.entries(DESKTOPS)) {
      if (row.flakeref) {
        // No `pin`: there is no URL of ours for one to belong to.
        expect(row, name).not.toHaveProperty('pin');
        expect(INSTALLER_DESKTOPS, name).not.toHaveProperty(name);
        expect(desktopRow(name).command, name).toContain(`--desktop=${row.flakeref}`);
      } else {
        expect(row, name).toHaveProperty('pin');
        expect(INSTALLER_DESKTOPS, name).toHaveProperty(name);
        expect(desktopRow(name).command, name).toBe(
          `curl -fsSL https://hausfold.co/${name}.sh | bash`,
        );
      }
    }
  });
});

describe(`${PAGE}'s gallery`, () => {
  it('is what the table renders, byte for byte', () => {
    // The failure message names the fix, because the next person to see this
    // red will have edited one of the two ends and not the other.
    expect(page, `run \`npm run desktops\` — ${PAGE} is out of step with DESKTOPS`).toBe(
      splice(page, renderGallery()),
    );
  });

  it('carries every row, with the line that installs it', () => {
    for (const name of Object.keys(DESKTOPS)) {
      expect(page, name).toContain(desktopRow(name).command);
    }
  });

  it('never offers an installer URL for a desktop that has none', () => {
    for (const name of Object.keys(DESKTOPS)) {
      if (DESKTOPS[name].flakeref) expect(page, name).toContain(`no \`hausfold.co/${name}.sh\``);
    }
  });
});
