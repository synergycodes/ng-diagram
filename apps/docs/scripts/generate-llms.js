import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsDir = join(__dirname, '../src/content/docs');
const publicDir = join(__dirname, '../public');

const BASE_URL = 'https://ngdiagram.dev/docs';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function collectFiles(dir, ext = ['.md', '.mdx']) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectFiles(full, ext));
    } else if (ext.includes(extname(full)) && !entry.startsWith('_')) {
      results.push(full);
    }
  }
  return results;
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { attrs: {}, body: raw };

  const attrs = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      // Remove surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      attrs[key] = val;
    }
  }
  const body = raw.slice(match[0].length).trim();
  return { attrs, body };
}

function stripMdx(body) {
  return (
    body
      // Remove import statements
      .replace(/^import\s+.*$/gm, '')
      // Remove JSX/Astro component tags (self-closing and paired)
      .replace(/<[A-Z][\w.]*\b[^>]*\/>/g, '')
      .replace(/<[A-Z][\w.]*\b[^>]*>[\s\S]*?<\/[A-Z][\w.]*>/g, '')
      // Remove empty lines left behind (collapse to max 2)
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

function fileToUrlPath(filePath) {
  let rel = relative(docsDir, filePath)
    .replace(/\\/g, '/')
    .replace(/\.(mdx?|md)$/, '');

  // Remove trailing /index
  if (rel.endsWith('/index') || rel === 'index') {
    rel = rel.replace(/\/?index$/, '');
  }

  // Starlight lowercases URL paths
  return rel.toLowerCase();
}

function fileToUrl(filePath) {
  const path = fileToUrlPath(filePath);
  return path ? `${BASE_URL}/${path}/` : `${BASE_URL}/`;
}

// ---------------------------------------------------------------------------
// Read & organise docs
// ---------------------------------------------------------------------------

const allFiles = collectFiles(docsDir);

function filesIn(subdir) {
  const dir = join(docsDir, subdir);
  return allFiles
    .filter((f) => f.startsWith(dir))
    .filter((f) => !relative(docsDir, f).replace(/\\/g, '/').endsWith('index.mdx'));
}

function readDoc(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  const { attrs, body } = parseFrontmatter(raw);
  return { filePath, attrs, body: stripMdx(body), url: fileToUrl(filePath) };
}

// Group files by section
const sections = [
  { title: 'Getting Started', dir: 'intro' },
  { title: 'Guides', dir: 'guides' },
  { title: 'Examples', dir: 'examples' },
  {
    title: 'API Reference',
    subsections: [
      { title: 'Components', dir: 'api/Components' },
      { title: 'Directives', dir: 'api/Directives' },
      { title: 'Services', dir: 'api/Services' },
      { title: 'Utilities', dir: 'api/Utilities' },
      { title: 'Types', dir: 'api/Types' },
      { title: 'Internals', dir: 'api/Internals' },
      { title: 'Other', dir: 'api/Other' },
    ],
  },
  { title: 'Policies', dir: 'policies' },
];

// ---------------------------------------------------------------------------
// Generate llms.txt (concise map)
// ---------------------------------------------------------------------------

function generateLlmsTxt() {
  const lines = [
    '# ngDiagram',
    '',
    '> A powerful Angular library for creating interactive diagrams, node-based editors, and visual programming interfaces.',
    '',
    `- Docs: ${BASE_URL}/`,
    '- GitHub: https://github.com/synergycodes/ng-diagram',
    '- NPM: https://www.npmjs.com/package/ng-diagram',
    '',
  ];

  for (const section of sections) {
    lines.push(`## ${section.title}`, '');

    if (section.subsections) {
      for (const sub of section.subsections) {
        const docs = filesIn(sub.dir).map(readDoc);
        if (docs.length === 0) continue;
        lines.push(`### ${sub.title}`, '');
        for (const doc of docs) {
          const title = doc.attrs.title || fileToUrlPath(doc.filePath);
          const desc = doc.attrs.description ? `: ${doc.attrs.description}` : '';
          lines.push(`- [${title}](${doc.url})${desc}`);
        }
        lines.push('');
      }
    } else {
      const docs = filesIn(section.dir).map(readDoc);
      for (const doc of docs) {
        const title = doc.attrs.title || fileToUrlPath(doc.filePath);
        const desc = doc.attrs.description ? `: ${doc.attrs.description}` : '';
        lines.push(`- [${title}](${doc.url})${desc}`);
      }
      lines.push('');
    }
  }

  lines.push(
    '## Optional',
    '',
    `- [llms-full.txt](${BASE_URL}/llms-full.txt): Full documentation content inlined for LLM context windows`,
    ''
  );

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Generate llms-full.txt (full content)
// ---------------------------------------------------------------------------

function generateLlmsFullTxt() {
  const lines = [
    '# ngDiagram — Full Documentation',
    '',
    '> A powerful Angular library for creating interactive diagrams, node-based editors, and visual programming interfaces.',
    '> Built for Angular. Supports custom nodes, custom edges, ports, groups, minimap, palette, routing, and more.',
    '',
    'Homepage: https://ngdiagram.dev',
    'GitHub: https://github.com/synergycodes/ng-diagram',
    'NPM: https://www.npmjs.com/package/ng-diagram',
    'License: Apache-2.0',
    '',
    '---',
    '',
  ];

  for (const section of sections) {
    const sectionDirs = section.subsections ? section.subsections : [section];

    lines.push(`# ${section.title}`, '');

    for (const sub of sectionDirs) {
      const dir = sub.dir;
      const docs = filesIn(dir).map(readDoc);
      if (docs.length === 0) continue;

      if (section.subsections) {
        lines.push(`## ${sub.title}`, '');
      }

      for (const doc of docs) {
        const heading = section.subsections ? '###' : '##';
        const title = doc.attrs.title || fileToUrlPath(doc.filePath);
        lines.push(`${heading} ${title}`, '');
        if (doc.attrs.description) {
          lines.push(`> ${doc.attrs.description}`, '');
        }
        lines.push(`URL: ${doc.url}`, '');
        lines.push(doc.body, '');
        lines.push('---', '');
      }
    }
  }

  // Append changelog
  const changelogPath = join(__dirname, '../../../CHANGELOG.md');
  try {
    const changelog = readFileSync(changelogPath, 'utf-8');
    lines.push('# Changelog', '', changelog, '');
  } catch {
    // Changelog not found — skip
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Write files
// ---------------------------------------------------------------------------

const llmsTxt = generateLlmsTxt();
const llmsFullTxt = generateLlmsFullTxt();

writeFileSync(join(publicDir, 'llms.txt'), llmsTxt, 'utf-8');
writeFileSync(join(publicDir, 'llms-full.txt'), llmsFullTxt, 'utf-8');

console.log(`✅ llms.txt generated (${(llmsTxt.length / 1024).toFixed(1)} KB)`);
console.log(`✅ llms-full.txt generated (${(llmsFullTxt.length / 1024).toFixed(1)} KB)`);
