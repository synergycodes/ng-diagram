// Type-checks the TypeScript and HTML code blocks of the agent skills against the library build,
// with strict TypeScript and Angular strictTemplates.
// - A TypeScript block compiles as module code, as members of a component class, or as both: module
//   code, then class members, then module code again, split at blank lines.
//   Class members can use the services in HOST_MEMBERS through `this` without declaring them.
// - A scaffold in scaffolds/<skill>/ gives a block what it expects from the rest of the app. Without
//   the /* @snippet */ placeholder it goes before the block; with it, the block replaces the placeholder.
//   An HTML block always needs a scaffold: a component whose template holds the placeholder.
// - A block without imports gets the names it uses from ng-diagram or @angular/core imported for it.
//   A block with imports must import everything it uses, as code copied from the skill would.
// Usage: node src/check-snippets.mjs <skills-dir>
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoDir = resolve(pkgDir, '../..');
const outDir = join(pkgDir, '.snippets');
const scaffoldsDir = join(pkgDir, 'scaffolds');
const PLACEHOLDER = '/* @snippet */';
// The first module that exports a name wins.
const AUTO_IMPORT_MODULES = ['ng-diagram', '@angular/core'];
// DOM globals that the skills use for ng-diagram types: never reported missing, so imported by name.
const DOM_SHADOWED = ['Node'];
// The service names the skills use in class members.
const HOST_MEMBERS = {
  injector: 'SnippetCore.Injector',
  diagram: 'SnippetNgd.NgDiagramService',
  diagramService: 'SnippetNgd.NgDiagramService',
  modelService: 'SnippetNgd.NgDiagramModelService',
  nodeService: 'SnippetNgd.NgDiagramNodeService',
  groupsService: 'SnippetNgd.NgDiagramGroupsService',
  selection: 'SnippetNgd.NgDiagramSelectionService',
  selectionService: 'SnippetNgd.NgDiagramSelectionService',
  viewport: 'SnippetNgd.NgDiagramViewportService',
  viewportService: 'SnippetNgd.NgDiagramViewportService',
  clipboard: 'SnippetNgd.NgDiagramClipboardService',
};
// Namespace imports never clash with the block's own imports.
const HOST_IMPORTS = ["import * as SnippetCore from '@angular/core';", "import * as SnippetNgd from 'ng-diagram';"];
const HOST_HEAD = ["@SnippetCore.Component({ selector: 'snippet-host', template: '' })", 'class SnippetHost {'];
const COMPILER_OPTIONS = {
  target: 'ES2022',
  module: 'ES2022',
  moduleResolution: 'bundler',
  lib: ['ES2022', 'DOM', 'DOM.Iterable'],
  strict: true,
  noEmit: true,
  skipLibCheck: true,
  experimentalDecorators: true,
  useDefineForClassFields: false,
  types: [],
};
// Known errors: when a canary compiles, the setup is broken and the check proves nothing.
const TS_CANARY = 'skills-check--canary-ts.ts';
const TS_CANARY_SOURCE = `import { initializeModel } from 'ng-diagram';

export const notANumber: number = initializeModel();
`;
const CANARY = 'skills-check--canary-template.ts';
const CANARY_SOURCE = `import { Component } from '@angular/core';
import { NgDiagramComponent, initializeModel } from 'ng-diagram';

@Component({
  selector: 'skills-check-canary',
  imports: [NgDiagramComponent],
  template: '<ng-diagram [model]="model" [notAnInput]="1" />',
})
export class CanaryComponent {
  model = initializeModel();
}
`;

const skillsArg = process.argv[2];
if (!skillsArg) {
  console.error('usage: node src/check-snippets.mjs <skills-dir>');
  process.exit(2);
}
const skillsDir = resolve(skillsArg);
const problems = [];
const posix = (p) => p.split('\\').join('/');
const rel = (p) => posix(relative(repoDir, p));

if (!existsSync(join(pkgDir, 'node_modules/ng-diagram/dist/ng-diagram/index.d.ts'))) {
  console.error('ng-diagram is not built: run `pnpm build` (or `pnpm --filter ng-diagram build`) first.');
  process.exit(1);
}

const blocks = collectBlocks();
const scaffolds = loadScaffolds();
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// 1. Turn every block into a TypeScript file.
for (const s of scaffolds) {
  const owners = blocks.filter(
    (b) => b.skill === s.skill && b.doc === s.doc && b.code.some((l) => l.trim() === s.marker)
  );
  if (owners.length !== 1) {
    problems.push(`${rel(s.path)}: "${s.marker}" is in ${owners.length} code blocks of ${s.skill}/${s.doc}, not in 1`);
  } else if (owners[0].scaffold) {
    problems.push(`${rel(s.path)}: the block already has the scaffold ${rel(owners[0].scaffold.path)}`);
  } else {
    owners[0].scaffold = s;
  }
}
const files = [];
const counts = { module: 0, members: 0, mixed: 0, scaffold: 0 };
for (const block of blocks) {
  const where = `${block.skill}/${block.doc}:${block.line}`;
  const scaffold = block.scaffold;
  const prepared = prepare(block, scaffold);
  if (prepared.problem) {
    problems.push(`${where}: ${prepared.problem}`);
    continue;
  }
  counts[scaffold ? 'scaffold' : prepared.how]++;
  const name = `${block.skill}--${block.doc.replace(/\.md$/, '').replace('/', '_')}--${block.ordinal}.ts`;
  files.push({ path: posix(join(outDir, name)), block, ...prepared });
}

// 2. Import the names that blocks without imports use from ng-diagram or @angular/core.
const options = ts.convertCompilerOptionsFromJson(COMPILER_OPTIONS, outDir).options;
for (const f of files) writeFileSync(f.path, `${f.text}\nexport {};\n`);
const exported = exportedNames();
const tsCanary = posix(join(outDir, TS_CANARY));
writeFileSync(tsCanary, TS_CANARY_SOURCE);
const program = ts.createProgram([...files.map((f) => f.path), tsCanary], options);
if (!program.getSemanticDiagnostics(program.getSourceFile(tsCanary)).some((d) => d.code === 2322)) {
  problems.push('the TypeScript canary compiled; check the setup');
}
rmSync(tsCanary);
let autoImported = 0;
for (const f of files) {
  if (f.block.code.some((l) => /^import\s/.test(l))) continue;
  const missing = new Map();
  for (const d of program.getSemanticDiagnostics(program.getSourceFile(f.path))) {
    if (d.code !== 2304 && d.code !== 2552) continue;
    const name = ts.flattenDiagnosticMessageText(d.messageText, '\n').match(/Cannot find name '([^']+)'/)?.[1];
    const from = name && exported.get(name);
    if (from) missing.set(name, from);
  }
  for (const name of DOM_SHADOWED) {
    const imported = new RegExp(`import\\s*(type\\s*)?\\{[^}]*\\b${name}\\b[^}]*\\}`).test(f.text);
    if (!imported && new RegExp(`\\b${name}\\b`).test(f.text)) missing.set(name, 'ng-diagram');
  }
  if (!missing.size) continue;
  const imports = AUTO_IMPORT_MODULES.map((m) => [...missing].filter(([, from]) => from === m).map(([n]) => n))
    .map((names, i) => (names.length ? `import { ${names.sort().join(', ')} } from '${AUTO_IMPORT_MODULES[i]}';` : ''))
    .filter(Boolean);
  autoImported += missing.size;
  f.text = `${imports.join('\n')}\n${f.text}`;
  for (const s of f.segments) s.at += imports.length;
  writeFileSync(f.path, `${f.text}\nexport {};\n`);
}

// 3. Compile everything with the Angular compiler.
writeFileSync(join(outDir, CANARY), CANARY_SOURCE);
writeFileSync(
  join(outDir, 'tsconfig.json'),
  JSON.stringify(
    {
      compilerOptions: { ...COMPILER_OPTIONS, outDir: 'out' },
      angularCompilerOptions: { strictTemplates: true, strictInjectionParameters: true },
      files: [...files.map((f) => basename(f.path)), CANARY],
    },
    null,
    2
  )
);
const require = createRequire(join(pkgDir, 'package.json'));
const cliPackage = require.resolve('@angular/compiler-cli/package.json');
const ngc = join(dirname(cliPackage), JSON.parse(readFileSync(cliPackage, 'utf8')).bin.ngc);
const run = spawnSync(process.execPath, [ngc, '-p', 'tsconfig.json'], { cwd: outDir, encoding: 'utf8' });
const output = `${run.stdout ?? ''}${run.stderr ?? ''}`;

const byName = new Map(files.map((f) => [basename(f.path), f]));
const errors = [];
const canaryCodes = new Set();
let current = null;
// Pretty format "file:line:col - error TS1234: message" with a code frame, or plain "file(line,col): error ...".
for (const raw of output.split(/\r?\n/)) {
  const line = raw.replace(/\x1b\[[0-9;]*m/g, '');
  const m =
    line.match(/^(.+?):(\d+):(\d+) - error (TS\d+|NG\d+): (.*)$/) ??
    line.match(/^(.+?)\((\d+),(\d+)\): error (TS\d+|NG\d+): (.*)$/);
  if (!m) {
    const frame = /^\s*\d+\s/.test(line) || /^\s+~+\s*$/.test(line) || /^\s*$/.test(line);
    // Continuation lines of a multi-line message; other output is printed as it is.
    if (current && !frame) current.push(`    ${line.trim()}`);
    else if (current === null && !frame) console.log(`ngc: ${line}`);
    continue;
  }
  const [, file, lineNo, col, code, message] = m;
  if (basename(file) === CANARY) {
    canaryCodes.add(code);
    current = [];
    continue;
  }
  current = [`${locate(byName.get(basename(file)), Number(lineNo), file)}:${col} - error ${code}: ${message}`];
  errors.push(current);
}
// ngc reports template errors only when no file has TypeScript errors.
const tsErrors = errors.some((e) => / - error TS\d+:/.test(e[0]));
if (tsErrors) console.log('Templates are checked only after all TypeScript errors are fixed.');
else if (!canaryCodes.has('NG8002')) problems.push('the template canary compiled; check the setup');

for (const e of errors) console.log(e.join('\n'));
for (const p of problems) console.log(`  ${p}`);
const html = blocks.filter((b) => b.lang === 'html').length;
console.log(
  `\n${files.length} of ${blocks.length} blocks compiled (${blocks.length - html} TypeScript, ${html} HTML): ` +
    `${counts.module} as module code, ${counts.members} as class members, ${counts.mixed} mixed, ` +
    `${counts.scaffold} with a scaffold; ${autoImported} names imported automatically. ` +
    `Errors: ${errors.length}, problems: ${problems.length}.`
);
process.exitCode = errors.length || problems.length ? 1 : 0;

function collectBlocks() {
  const result = [];
  const skills = readdirSync(skillsDir)
    .filter((d) => !d.startsWith('.') && statSync(join(skillsDir, d)).isDirectory())
    .sort();
  for (const skill of skills) {
    const docs = ['SKILL.md'];
    const refDir = join(skillsDir, skill, 'references');
    if (existsSync(refDir)) {
      docs.push(
        ...readdirSync(refDir)
          .filter((f) => f.endsWith('.md'))
          .sort()
          .map((f) => `references/${f}`)
      );
    }
    for (const doc of docs) {
      const lines = readFileSync(join(skillsDir, skill, doc), 'utf8')
        .replace(/\r\n/g, '\n')
        .split('\n');
      let ordinal = 0;
      for (let i = 0; i < lines.length; i++) {
        const open = lines[i].match(/^(\s*)```(\w*)\s*$/);
        if (!open) continue;
        let end = i + 1;
        while (end < lines.length && !/^\s*```\s*$/.test(lines[end])) end++;
        const lang = open[2] === 'ts' ? 'typescript' : open[2];
        if (lang === 'typescript' || lang === 'html') {
          // A fence inside a list item is indented: drop that indentation from the code.
          const code = lines.slice(i + 1, end).map((l) => (l.startsWith(open[1]) ? l.slice(open[1].length) : l));
          ordinal++;
          result.push({ skill, doc, lang, ordinal, line: i + 2, code });
        }
        i = end;
      }
    }
  }
  return result;
}

// scaffolds/<skill>/*.ts: "// snippet: <a line that only this block has>", optional
// "// doc: references/<file>.md" (default SKILL.md), then the code.
function loadScaffolds() {
  const result = [];
  if (!existsSync(scaffoldsDir)) return result;
  for (const skill of readdirSync(scaffoldsDir).sort()) {
    for (const file of readdirSync(join(scaffoldsDir, skill))
      .filter((f) => f.endsWith('.ts'))
      .sort()) {
      const path = join(scaffoldsDir, skill, file);
      const text = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
      const header = text.match(/^\/\/ snippet: (.+)\n(?:\/\/ doc: (.+)\n)?/);
      if (!header) {
        problems.push(`${rel(path)}: the first line must be "// snippet: <a line of the code block>"`);
        continue;
      }
      const doc = header[2]?.trim() ?? 'SKILL.md';
      const body = text.slice(header[0].length).replace(/\n+$/, '');
      result.push({ path, skill, doc, marker: header[1].trim(), body });
    }
  }
  return result;
}

// Returns the file text and where the block's lines are in it (segments), or a problem.
function prepare(block, scaffold) {
  const scaffoldLines = scaffold ? scaffold.body.split('\n') : [];
  const placeholder = scaffold ? scaffold.body.indexOf(PLACEHOLDER) : -1;
  if (placeholder !== -1) {
    if (block.lang === 'html' && block.code.some((l) => /`|\$\{/.test(l))) {
      return { problem: 'a backtick or ${ cannot go into a template' };
    }
    // The block goes on lines of its own, also when Prettier puts the placeholder inside a line.
    const before = scaffold.body.slice(0, placeholder);
    const after = scaffold.body.slice(placeholder + PLACEHOLDER.length);
    const text = [before, ...block.code, after].join('\n');
    return { text, segments: [{ at: before.split('\n').length, from: 0, len: block.code.length }] };
  }
  if (block.lang === 'html') return { problem: 'an HTML block needs a scaffold (see tools/skills-check/README.md)' };
  const parts = shape(block.code);
  if (!parts) return { problem: 'the block does not parse; add a scaffold (see tools/skills-check/README.md)' };

  const members = parts.find((p) => p.kind === 'members');
  const out = [...(members ? HOST_IMPORTS : []), ...scaffoldLines];
  const segments = [];
  for (const part of parts) {
    const lines = block.code.slice(part.from, part.to);
    if (part.kind === 'members') {
      // Declare the services that the members use through `this` but do not declare themselves.
      const source = ts.createSourceFile('m.ts', ['class C {', ...lines, '}'].join('\n'), ts.ScriptTarget.ES2022, true);
      const declared = new Set(source.statements[0].members.map((m) => m.name?.getText(source)));
      const used = new Set([...lines.join('\n').matchAll(/\bthis\.(\w+)/g)].map((m) => m[1]));
      const services = Object.entries(HOST_MEMBERS)
        .filter(([name]) => used.has(name) && !declared.has(name))
        .map(([name, type]) => `  readonly ${name} = SnippetCore.inject(${type});`);
      out.push(...HOST_HEAD, ...services);
      segments.push({ at: out.length, from: part.from, len: lines.length });
      out.push(...lines, '}');
    } else {
      segments.push({ at: out.length, from: part.from, len: lines.length });
      out.push(...lines);
    }
  }
  const how = parts.length > 1 ? 'mixed' : members ? 'members' : 'module';
  return { text: out.join('\n'), segments, how };
}

// Splits a block into module code and class members: [{ kind, from, to }], or null.
function shape(lines) {
  const code = lines.join('\n');
  const asModule = parses(code);
  if (asModule && !looksLikeClassMembers(asModule)) return [{ kind: 'module', from: 0, to: lines.length }];
  if (parsesAsMembers(lines)) return [{ kind: 'members', from: 0, to: lines.length }];
  // Module code, then class members, then module code again, split at blank lines.
  const cuts = [0, ...lines.flatMap((l, i) => (l.trim() === '' ? [i] : [])), lines.length];
  for (const k of cuts) {
    for (const m of [...cuts].reverse()) {
      if (m <= k || !lines.slice(k, m).some((l) => l.trim())) continue;
      const head = lines.slice(0, k);
      const tail = lines.slice(m);
      if (head.length && !parses(head.join('\n'))) continue;
      if (tail.length && !parses(tail.join('\n'))) continue;
      if (!parsesAsMembers(lines.slice(k, m))) continue;
      return [
        ...(k > 0 ? [{ kind: 'module', from: 0, to: k }] : []),
        { kind: 'members', from: k, to: m },
        ...(m < lines.length ? [{ kind: 'module', from: m, to: lines.length }] : []),
      ];
    }
  }
  return asModule ? [{ kind: 'module', from: 0, to: lines.length }] : null;
}

// Returns the parsed source file when the code has no syntax errors.
function parses(code) {
  const { diagnostics } = ts.transpileModule(code, {
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, experimentalDecorators: true },
  });
  return diagnostics.length ? null : ts.createSourceFile('block.ts', code, ts.ScriptTarget.ES2022, true);
}

function parsesAsMembers(lines) {
  const source = parses(['class C {', ...lines, '}'].join('\n'));
  if (!source || source.statements.length !== 1) return false;
  // `export`, `default` and `const` parse as modifiers of a class member, but start module code.
  const moduleOnly = [ts.SyntaxKind.ExportKeyword, ts.SyntaxKind.DefaultKeyword, ts.SyntaxKind.ConstKeyword];
  return source.statements[0].members.every(
    (m) => !(ts.canHaveModifiers(m) ? (ts.getModifiers(m) ?? []) : []).some((mod) => moduleOnly.includes(mod.kind))
  );
}

// Top-level `name: Type = value` (a label) or `name = value` read as statements are class fields.
function looksLikeClassMembers(source) {
  return source.statements.some(
    (s) =>
      ts.isLabeledStatement(s) ||
      (ts.isExpressionStatement(s) &&
        ts.isBinaryExpression(s.expression) &&
        s.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        ts.isIdentifier(s.expression.left))
  );
}

function exportedNames() {
  const probe = posix(join(outDir, 'skills-check--exports.ts'));
  writeFileSync(probe, `${AUTO_IMPORT_MODULES.map((m, i) => `import * as m${i} from '${m}';`).join('\n')}\n`);
  const probeProgram = ts.createProgram([probe], options);
  const checker = probeProgram.getTypeChecker();
  const names = new Map();
  for (const statement of probeProgram.getSourceFile(probe).statements) {
    const symbol = checker.getSymbolAtLocation(statement.moduleSpecifier);
    if (!symbol) throw new Error(`cannot resolve ${statement.moduleSpecifier.text}`);
    for (const e of checker.getExportsOfModule(symbol))
      if (!names.has(e.name)) names.set(e.name, statement.moduleSpecifier.text);
  }
  rmSync(probe);
  return names;
}

// Maps a line of a generated file back to the skill's markdown file.
function locate(file, line, fallback) {
  if (!file) return fallback;
  const index = line - 1;
  const segment = file.segments.find((s) => index >= s.at && index < s.at + s.len);
  if (segment)
    return `skills/${file.block.skill}/${file.block.doc}:${file.block.line + segment.from + index - segment.at}`;
  return `${rel(file.path)}:${line} (scaffold or import of the block at skills/${file.block.skill}/${file.block.doc}:${file.block.line})`;
}
