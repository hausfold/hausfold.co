// The OpenAPI spec at public/openapi.json is a hand-maintained snapshot of
// worker.js's routing surface. Nothing in CI diffs the spec against the live
// Worker (a scanner reads it from the CDN), so these tests are the drift
// tripwire: a desktop added to DESKTOPS, an app added to DOWNLOADABLE, or an
// MCP tool renamed must update the spec in the same commit or a test goes
// red. The values live in worker-config.js, the module the Worker itself
// imports.
//
// Unlike the Worker tests this one reads the spec off disk, so it runs with
// no stubs at all.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import worker from '../worker.js';
import { DESKTOPS, DOWNLOADABLE, MCP_TOOLS } from '../worker-config.js';

const spec = JSON.parse(readFileSync(new URL('../public/openapi.json', import.meta.url), 'utf8'));

describe('openapi.json vs worker.js', () => {
  it('parses and is OpenAPI 3.1', () => {
    expect(spec.openapi).toMatch(/^3\.1\./);
  });

  it('declares an install route for every desktop in DESKTOPS', () => {
    expect(Object.keys(DESKTOPS).sort()).toEqual(['everyday', 'hacker', 'haus', 'minimal']);
    for (const desktop of Object.keys(DESKTOPS)) {
      expect(spec.paths[`/${desktop}.sh`]).toBeDefined();
    }
  });

  it('constrains the app path parameter to DOWNLOADABLE', () => {
    expect([...DOWNLOADABLE].sort()).toEqual([...spec.components.parameters.app.schema.enum].sort());
  });

  it('describes the MCP endpoint as POST (plus preflight)', () => {
    expect(Object.keys(spec.paths['/mcp']).sort()).toEqual(['options', 'post']);
  });

  it('describes the static agents surface: search index, llms files, design.md', () => {
    for (const path of ['/api/search', '/llms.txt', '/llms-full.txt', '/design.md']) {
      expect(spec.paths[path], path).toBeDefined();
    }
  });

  it('points contact and externalDocs at the developers page', () => {
    expect(spec.info.contact.url).toBe('https://hausfold.co/developers/');
    expect(spec.externalDocs.url).toBe('https://hausfold.co/developers/');
  });

  it('the worker tool table is what the spec documents', () => {
    expect(MCP_TOOLS.map((t) => t.name)).toEqual([
      'get_install_command',
      'get_latest_release',
      'search_docs',
    ]);
    // The spec's MCP description names the contract the tool table keeps:
    // stateless, JSON responses. Update it when either changes.
    expect(spec.paths['/mcp'].post.description).toContain('Stateless');
  });

  it('worker.js actually routes /mcp', () => {
    // Cheap smoke: an OPTIONS preflight must reach serveMcp and get 204, not
    // fall through to the assets fallback. Proves the route line exists
    // rather than that a string exists in the file.
    return worker.fetch(new Request('https://hausfold.co/mcp', { method: 'OPTIONS' }), {}).then(
      (res) => {
        expect(res.status).toBe(204);
      },
    );
  });

  it('no em dashes anywhere a scanner or an agent reads the spec', () => {
    // House copy rule: reader-facing text carries no em dashes. The spec is
    // copy an agent reads.
    expect(JSON.stringify(spec)).not.toMatch(/—|–/);
  });
});
