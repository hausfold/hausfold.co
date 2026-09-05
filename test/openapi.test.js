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

  it('describes the static agents surface: search index, llms files, design.md, auth.md', () => {
    for (const path of ['/api/search', '/llms.txt', '/llms-full.txt', '/design.md', '/auth.md']) {
      expect(spec.paths[path], path).toBeDefined();
    }
  });

  it('describes the versioned REST surface', () => {
    for (const path of [
      '/v1/search',
      '/v1/desktops',
      '/v1/apps',
      '/v1/releases/{app}',
      '/v1/batch',
      '/v1/jobs',
      '/v1/jobs/{id}',
      '/ask',
      '/.well-known/mcp/server-card.json',
    ]) {
      expect(spec.paths[path], path).toBeDefined();
    }
  });

  it('describes the agent instruction file at both of its spellings', () => {
    for (const path of ['/index.md', '/agent.txt']) {
      expect(spec.paths[path], path).toBeDefined();
    }
  });

  it('writes the content-negotiation contract down where a client reads it', () => {
    // The Worker's negotiation is not visible from a path list: an agent
    // learns it from info.description or not at all.
    for (const claim of ['Vary: Accept', 'text/markdown', 'q-values', '406']) {
      expect(spec.info.description, claim).toContain(claim);
    }
  });

  it('describes the agent discovery documents', () => {
    for (const path of ['/mcp.json', '/.well-known/mcp.json', '/.well-known/mcp', '/agent.txt', '/.well-known/oauth-protected-resource', '/.well-known/http-message-signatures-directory', '/mcp/docs']) {
      expect(spec.paths[path], path).toBeDefined();
      for (const [method, op] of Object.entries(spec.paths[path])) {
        expect(op.operationId, `${method} ${path}`).toBeDefined();
      }
    }
  });

  it('documents the sandbox flag on the /v1 reads and the batch body', () => {
    expect(spec.components.parameters.sandbox).toBeDefined();
    for (const path of ['/v1/search', '/v1/desktops', '/v1/apps', '/v1/releases/{app}']) {
      expect(spec.paths[path].get.parameters.some((p) => p.$ref === '#/components/parameters/sandbox'), path).toBe(true);
    }
    expect(spec.components.schemas.batchRequest.properties.sandbox).toBeDefined();
    expect(spec.info.description).toContain('sandbox');
  });

  it('carries the readOnly annotations the MCP surface advertises', () => {
    for (const tool of MCP_TOOLS) {
      expect(tool.annotations?.readOnlyHint, tool.name).toBe(true);
    }
    expect(spec.components.schemas.jsonRpcError).toBeDefined();
    expect(spec.components.schemas.jsonRpcResponse).toBeDefined();
  });

  it('every tool declares an outputSchema, and the spec says so', () => {
    // A tool added without one is a tool whose result a client has to parse
    // out of prose. The conformance half (a real payload against the schema)
    // is in test/mcp.test.js; this is the pin that the spec and the table
    // still describe the same contract.
    for (const tool of MCP_TOOLS) {
      expect(tool.outputSchema?.type, tool.name).toBe('object');
    }
    expect(spec.paths['/mcp'].post.description).toContain('outputSchema');
    expect(spec.components.schemas.jsonRpcResult.properties.result.description).toContain(
      'outputSchema',
    );
  });

  it('gives every operation an operationId (function-calling shape)', () => {
    const missing = [];
    for (const [path, ops] of Object.entries(spec.paths)) {
      for (const [method, op] of Object.entries(ops)) {
        if (typeof op !== 'object' || op.responses === undefined) continue; // parameters-only keys
        if (!op.operationId) missing.push(`${method.toUpperCase()} ${path}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('gives 4xx and 5xx responses a typed problem schema where errors are JSON', () => {
    // Every $ref to an error response resolves to problem+json content.
    for (const name of ['badRequest', 'unknownApp', 'unknownJob', 'rateLimited', 'upstreamUnavailable', 'indexUnavailable', 'methodNotAllowed', 'notFound']) {
      const r = spec.components.responses[name];
      expect(r.content['application/problem+json'].schema.$ref, name).toBe('#/components/schemas/problem');
    }
  });

  it('declares the deprecation policy in info.description', () => {
    expect(spec.info.description).toContain('Deprecation');
    expect(spec.info.description).toContain('Sunset');
  });

  it('public/auth.md exists, leads with a heading, and covers the auth.md sections', () => {
    const md = readFileSync(new URL('../public/auth.md', import.meta.url), 'utf8');
    expect(md.startsWith('# ')).toBe(true);
    expect(md.length).toBeGreaterThan(1000);
    for (const section of ['Discover', 'Pick a method', 'agent_auth', 'Register', 'Claim', 'Exchange', 'Use the access_token', 'Errors', 'Revocation']) {
      expect(md, section).toContain(section);
    }
    for (const keyword of ['agent_auth', 'identity_endpoint', 'identity_assertion', 'service_auth', 'id-jag', 'WWW-Authenticate', 'oauth-protected-resource', 'http-message-signatures-directory']) {
      expect(md, keyword).toContain(keyword);
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

  it('the WebMCP tool enum names every DOWNLOADABLE app (no silent drift)', () => {
    // webmcp.tsx is a browser bundle; it cannot import worker-config.js, so
    // it hand-writes the app enum. This test is the pin that keeps the two
    // in step: DOWNLOADABLE grows, the enum must grow with it.
    const webmcp = readFileSync(new URL('../src/components/webmcp.tsx', import.meta.url), 'utf8');
    for (const app of DOWNLOADABLE) {
      expect(webmcp, `enum should include '${app}'`).toContain(`'${app}'`);
    }
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
