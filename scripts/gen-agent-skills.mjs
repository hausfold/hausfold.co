// Generates public/.well-known/agent-skills/index.json from the SKILL.md
// files beside it, per the Agent Skills Discovery draft (v0.2.0): one entry
// per skill, with the SHA-256 of the SKILL.md bytes and the frontmatter's
// own name/description, so the index cannot disagree with the artifacts.
//
// Runs as the first half of `npm run build` — the committed index.json is a
// checked-in artifact, and a skill edit that skips the build leaves it stale,
// which is why the check matters: verify digests rather than trust them.
//
// Offline, node-only, and deterministic (fixed order, 2-space JSON).

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../public/.well-known/agent-skills/', import.meta.url).pathname;
const NAME_OK = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const entries = [];
for (const dir of readdirSync(ROOT, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  const file = join(ROOT, dir.name, 'SKILL.md');
  let raw;
  try {
    raw = readFileSync(file);
  } catch {
    continue; // a directory without a SKILL.md is not a skill; skip it
  }
  const text = raw.toString('utf8');
  const front = text.match(/^---\n([\s\S]*?)\n---/);
  if (!front) throw new Error(`${file}: SKILL.md without YAML frontmatter`);
  const field = (key) => {
    const m = front[1].match(new RegExp(`^${key}: (.+)$`, 'm'));
    if (!m) throw new Error(`${file}: missing '${key}' in frontmatter`);
    return m[1].trim();
  };
  const name = field('name');
  if (name !== dir.name || !NAME_OK.test(name)) {
    throw new Error(`${file}: frontmatter name '${name}' must match its directory and the Agent Skills naming rules`);
  }
  entries.push({
    name,
    type: 'skill-md',
    description: field('description'),
    url: `/.well-known/agent-skills/${name}/SKILL.md`,
    digest: `sha256:${createHash('sha256').update(raw).digest('hex')}`,
  });
}
entries.sort((a, b) => a.name.localeCompare(b.name));

const out = {
  $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
  skills: entries,
};
writeFileSync(join(ROOT, 'index.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`agent-skills index: ${entries.length} skill(s) written`);
