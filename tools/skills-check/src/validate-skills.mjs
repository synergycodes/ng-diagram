// Structural lint for the agent skills in /skills.
// Usage: node src/validate-skills.mjs <skills-dir>
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2];
if (!root) {
  console.error('usage: node src/validate-skills.mjs <skills-dir>');
  process.exit(2);
}

const FOOTER = '## Verify before you answer';
const LICENSE = 'Apache-2.0';
const ALLOWED_KEYS = new Set(['name', 'description', 'license']);
// The skills are public: no internal tools, tickets or local paths.
const FORBIDDEN = [
  /claude-plugin-marketplace/i,
  /ng-diagram-maintainer/i,
  /\bNGD-\d+/,
  /clickup/i,
  /[A-Z]:\\Users\\/i,
  /Desktop[\\/]Synergy/i,
  /scratchpad/i,
  /verification log/i,
];
// Backticked `ng-diagram-*` names that are library elements or CSS classes, not skills.
const LIBRARY_NAMES =
  /^ng-diagram-(canvas|port|marker|palette-item|palette-item-preview|base-edge|base-edge-label|default-edge-label|background|minimap|node-resize-adornment|node-rotate-adornment|base-node-template|edge--temporary|edge--dangling|node-wrapper|node-selected|group-highlight|port-hoverable|port-hoverable-over-node|docs)$/;

const skills = readdirSync(root)
  .filter((d) => statSync(join(root, d)).isDirectory())
  .sort();
const names = new Set(skills);
let problems = 0;
const rows = [];

const warn = (skill, msg) => {
  problems++;
  console.log(`  [${skill}] ${msg}`);
};

for (const skill of skills) {
  const file = join(root, skill, 'SKILL.md');
  if (!existsSync(file)) {
    warn(skill, 'missing SKILL.md');
    continue;
  }
  const text = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const lines = text.split('\n');
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fm) {
    warn(skill, 'missing frontmatter');
    continue;
  }
  const fields = new Map();
  for (const line of fm[1].split('\n')) {
    const m = line.match(/^([a-zA-Z-]+):\s*(.*)$/);
    if (m) fields.set(m[1], m[2].trim());
  }
  const name = fields.get('name') ?? '';
  const desc = (fields.get('description') ?? '').replace(/^["']|["']$/g, '');

  // Agent Skills spec: 1-64 chars, lowercase letters, digits and single hyphens, equal to the folder name.
  if (name !== skill) warn(skill, `frontmatter name "${name}" != folder`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) || name.length > 64) warn(skill, `invalid name "${name}"`);
  if (!desc) warn(skill, 'missing description');
  // Stricter than the spec (1024): all descriptions share the agent's skill listing budget.
  if (desc.length > 400) warn(skill, `description too long (${desc.length} chars, max 400)`);
  if (!/^Use when/.test(desc)) warn(skill, 'description does not start with "Use when"');
  if (!/ng-diagram/i.test(desc)) warn(skill, 'description does not mention ng-diagram');
  if (fields.get('license') !== LICENSE) warn(skill, `license must be ${LICENSE}`);
  const extra = [...fields.keys()].filter((k) => !ALLOWED_KEYS.has(k));
  if (extra.length) warn(skill, `extra frontmatter keys: ${extra.join(', ')}`);
  if (!text.includes(FOOTER)) warn(skill, 'missing standard footer');
  if (lines.length > 300) warn(skill, `SKILL.md has ${lines.length} lines (> 300)`);

  // Cross-references to sibling skills must exist.
  for (const m of text.matchAll(/`(ng-diagram-[a-z-]+)`/g)) {
    const ref = m[1];
    if (ref !== skill && !names.has(ref) && !LIBRARY_NAMES.test(ref)) {
      warn(skill, `reference to unknown skill or name: ${ref}`);
    }
  }

  // references/ files mentioned must exist; long ones need a table of contents.
  for (const line of lines) {
    for (const m of line.matchAll(/references\/([A-Za-z0-9._-]+\.md)/g)) {
      if (existsSync(join(root, skill, 'references', m[1]))) continue;
      // A reference owned by another skill is fine when that skill is named on the same line.
      const owners = [...line.matchAll(/`(ng-diagram-[a-z-]+)`/g)].map((o) => o[1]).filter((o) => o !== skill);
      if (owners.some((o) => existsSync(join(root, o, 'references', m[1])))) continue;
      warn(skill, `missing reference file references/${m[1]}`);
    }
  }
  const refDir = join(root, skill, 'references');
  let refLines = 0;
  if (existsSync(refDir)) {
    for (const f of readdirSync(refDir)) {
      const rt = readFileSync(join(refDir, f), 'utf8').replace(/\r\n/g, '\n');
      const rl = rt.split('\n').length;
      refLines += rl;
      const head = rt.split('\n').slice(0, 25).join('\n');
      if (rl > 150 && !/contents/i.test(head) && !/\]\(#/.test(head)) {
        warn(skill, `references/${f} has ${rl} lines but no table of contents near the top`);
      }
      if (!text.includes(`references/${f}`)) warn(skill, `references/${f} is not referenced from SKILL.md`);
      for (const re of FORBIDDEN) if (re.test(rt)) warn(skill, `references/${f} contains forbidden pattern ${re}`);
    }
  }

  for (const re of FORBIDDEN) if (re.test(text)) warn(skill, `contains forbidden pattern ${re}`);

  rows.push({ skill, lines: lines.length, desc: desc.length, refLines });
}

// The README skill map lists every skill.
const readme = join(root, 'README.md');
if (existsSync(readme)) {
  const text = readFileSync(readme, 'utf8');
  for (const skill of skills) if (!text.includes(`\`${skill}\``)) warn('README.md', `skill map misses ${skill}`);
}

console.log('\nskill | SKILL.md lines | description chars | reference lines');
for (const r of rows) console.log(`${r.skill} | ${r.lines} | ${r.desc} | ${r.refLines}`);
const totalDesc = rows.reduce((s, r) => s + r.desc, 0);
console.log(`\n${rows.length} skills, total description chars: ${totalDesc}, problems: ${problems}`);
process.exitCode = problems ? 1 : 0;
