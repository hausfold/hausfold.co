// The OpenAI app submission, held to the server it describes.
//
// `scripts/submit-openai-app.sh` carries the copy that goes in OpenAI's app
// portal: the starter prompts, the test cases, and one justification per tool
// per annotation flag. None of it is served by anything, so nothing else in
// this suite would notice it going stale — and a submission that describes a
// server that no longer exists is found by a human reviewer, weeks later.
//
// The seam is `MCP_TOOLS`. Three tools is why there are nine justifications:
// every tool answers Read Only, Open World and Destructive. A fourth tool
// means three more, and the values it states have to be the values the server
// actually reports, not a plausible guess.
//
// The parse is the weak point of a test like this, so it is asserted first:
// a regex that quietly matched nothing would leave every check below passing
// over an empty list.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MCP_TOOLS } from '../worker-config.js';

const script = readFileSync(
  fileURLToPath(new URL('../scripts/submit-openai-app.sh', import.meta.url)),
  'utf8',
);

// Pull a bash array literal out of the script. Entries are double-quoted and
// may carry \" and \` escapes; fields within an entry are separated by the
// literal tab the script's `IFS=$'\t' read` splits on.
function bashArray(name) {
  const block = script.match(new RegExp(`^${name}=\\(\\n([\\s\\S]*?)^\\)$`, 'm'));
  if (!block) throw new Error(`${name}=( … ) not found in submit-openai-app.sh`);
  return [...block[1].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) =>
    m[1].replace(/\\(["`$\\])/g, '$1').split('\t'),
  );
}

const STARTERS = bashArray('STARTERS');
const POSITIVE = bashArray('POSITIVE');
const NEGATIVE = bashArray('NEGATIVE');
const ANNOTATIONS = bashArray('ANNOTATIONS');

// "Read Only" reads readOnlyHint, and so on. The portal asks for a reason
// beside each value it read off the server, so a justification that states
// the opposite value is worse than a missing one.
const FLAGS = {
  'Read Only': 'readOnlyHint',
  'Open World': 'openWorldHint',
  Destructive: 'destructiveHint',
};

const toolNames = MCP_TOOLS.map((t) => t.name);

describe('the arrays parse at all', () => {
  it('finds every one of them, non-empty', () => {
    expect(STARTERS.length).toBeGreaterThan(0);
    expect(POSITIVE.length).toBeGreaterThan(0);
    expect(NEGATIVE.length).toBeGreaterThan(0);
    expect(ANNOTATIONS.length).toBeGreaterThan(0);
  });

  it('splits each row into the fields its step reads', () => {
    // step_starters reads one field; step_testing reads four and three;
    // step_annotations reads three.
    for (const row of STARTERS) expect(row).toHaveLength(1);
    for (const row of POSITIVE) expect(row).toHaveLength(4);
    for (const row of NEGATIVE) expect(row).toHaveLength(3);
    for (const row of ANNOTATIONS) expect(row).toHaveLength(3);
  });

  it('leaves no field empty', () => {
    for (const row of [...STARTERS, ...POSITIVE, ...NEGATIVE, ...ANNOTATIONS])
      for (const field of row) expect(field.trim()).not.toBe('');
  });
});

describe('the annotation justifications track MCP_TOOLS', () => {
  it('names every tool the server has, and no tool it does not', () => {
    expect([...new Set(ANNOTATIONS.map((r) => r[0]))].sort()).toEqual([...toolNames].sort());
  });

  it('answers all three flags for each tool, exactly once each', () => {
    for (const name of toolNames) {
      const flags = ANNOTATIONS.filter((r) => r[0] === name).map((r) => r[1].split(':')[0].trim());
      expect(flags.sort(), `flags justified for ${name}`).toEqual(Object.keys(FLAGS).sort());
    }
  });

  it('states the value the server actually reports', () => {
    for (const [name, flag, why] of ANNOTATIONS) {
      const [label, stated] = flag.split(':').map((s) => s.trim());
      const tool = MCP_TOOLS.find((t) => t.name === name);
      const actual = tool.annotations[FLAGS[label]];
      expect(stated, `${name} · ${label}`).toBe(actual ? 'True' : 'False');
      // A justification is prose for a human reviewer, not a restatement.
      expect(why.length, `${name} · ${label} justification`).toBeGreaterThan(40);
    }
  });
});

describe('the test cases exercise every tool', () => {
  it('reaches each tool from at least one positive case', () => {
    for (const name of toolNames) {
      const hit = POSITIVE.some((row) => row.join(' ').includes(name));
      expect(hit, `no positive test case calls ${name}`).toBe(true);
    }
  });

  it('probes each tool in the check step, so the submission is verified before it is filed', () => {
    const step = script.match(/^step_check\(\) \{$([\s\S]*?)^\}$/m);
    expect(step, 'step_check() not found').not.toBeNull();
    for (const name of toolNames)
      expect(step[1], `check never probes ${name}`).toContain(name);
  });
});

describe('the copy holds its own rules', () => {
  it('keeps em dashes out of anything the portal shows a reader', () => {
    // House style: the script's comments and terminal output may use them,
    // the submitted strings may not.
    for (const row of [...STARTERS, ...POSITIVE, ...NEGATIVE, ...ANNOTATIONS])
      for (const field of row) expect(field).not.toContain('—');
  });
});
