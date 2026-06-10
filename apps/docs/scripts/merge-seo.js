/**
 * merge-seo.js
 *
 * Merges the docs (Starlight) SEO files with the manually maintained main-site
 * (Webflow) SEO files into a single set of files served at the ngdiagram.dev root.
 *
 * Usage:
 *   node scripts/merge-seo.js --docs-dist <dir> --main-site <dir> --out <dir>
 *
 *   --docs-dist  Built docs output (apps/docs/dist). Reads:
 *                  <docs-dist>/docs/sitemap-0.xml
 *                  <docs-dist>/llms.txt
 *                  <docs-dist>/llms-full.txt
 *   --main-site  Manually maintained main-site source (seo-ngdiagram/main-site). Reads:
 *                  sitemap.xml, robots.txt, llms.txt, llms-full.txt
 *   --out        Output dir (seo-ngdiagram/dist). Writes:
 *                  sitemap.xml, robots.txt, llms.txt, llms-full.txt
 *
 * The output is fully derived from the inputs on every run (no appends), so
 * re-running the pipeline is idempotent.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const CANONICAL_ORIGIN = 'https://ngdiagram.dev';
const CANONICAL_SITEMAP_URL = `${CANONICAL_ORIGIN}/sitemap.xml`;

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      args[key] = argv[i + 1];
      i += 1;
    }
  }
  for (const required of ['docs-dist', 'main-site', 'out']) {
    if (!args[required]) {
      throw new Error(`Missing required argument --${required}`);
    }
  }
  return args;
}

// ---------------------------------------------------------------------------
// URL normalization
// ---------------------------------------------------------------------------

/**
 * Force https and strip a leading `www.` so every URL points at the canonical
 * ngdiagram.dev origin. Paths and trailing slashes are preserved exactly.
 */
function normalizeUrl(raw) {
  return raw
    .trim()
    .replace(/^http:\/\//i, 'https://')
    .replace(/^https:\/\/www\./i, 'https://');
}

// ---------------------------------------------------------------------------
// sitemap.xml — flatten docs + main-site into a single <urlset>
// ---------------------------------------------------------------------------

/** Extract `{ loc, lastmod }` entries from a sitemap's `<url>` blocks. */
function extractUrlEntries(xml) {
  const entries = [];
  const urlBlocks = xml.match(/<url\b[^>]*>[\s\S]*?<\/url>/gi) || [];
  for (const block of urlBlocks) {
    const locMatch = block.match(/<loc>\s*([\s\S]*?)\s*<\/loc>/i);
    if (!locMatch) continue;
    const lastmodMatch = block.match(/<lastmod>\s*([\s\S]*?)\s*<\/lastmod>/i);
    entries.push({
      loc: normalizeUrl(locMatch[1]),
      lastmod: lastmodMatch ? lastmodMatch[1].trim() : null,
    });
  }
  return entries;
}

function mergeSitemap(docsDist, mainSite) {
  const docsXml = readFileSync(join(docsDist, 'docs', 'sitemap-0.xml'), 'utf-8');
  const mainXml = readFileSync(join(mainSite, 'sitemap.xml'), 'utf-8');

  // Main-site URLs first, then docs URLs.
  const merged = [...extractUrlEntries(mainXml), ...extractUrlEntries(docsXml)];

  // Dedupe by normalized loc, keeping the first occurrence.
  const seen = new Set();
  const unique = [];
  for (const entry of merged) {
    if (seen.has(entry.loc)) continue;
    seen.add(entry.loc);
    unique.push(entry);
  }

  const body = unique
    .map((entry) => {
      const lastmod = entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : '';
      return `  <url>\n    <loc>${entry.loc}</loc>${lastmod}\n  </url>`;
    })
    .join('\n');

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `${body}\n` +
    '</urlset>\n'
  );
}

// ---------------------------------------------------------------------------
// robots.txt — main-site policy is canonical; force the correct Sitemap line
// ---------------------------------------------------------------------------

function mergeRobots(mainSite) {
  // The main-site robots.txt is the complete, canonical bot policy for the whole
  // domain. The docs robots.txt only contains `Allow: /` (no unique rules), so
  // there is nothing to merge from it — we just guarantee the Sitemap line points
  // at the canonical, flattened sitemap.
  const raw = readFileSync(join(mainSite, 'robots.txt'), 'utf-8');
  const sitemapLine = `Sitemap: ${CANONICAL_SITEMAP_URL}`;

  if (/^\s*Sitemap:.*$/im.test(raw)) {
    // Replace the first Sitemap line and drop any extras.
    let replaced = false;
    const lines = raw.split('\n').filter((line) => {
      if (!/^\s*Sitemap:/i.test(line)) return true;
      if (!replaced) {
        replaced = true;
        return true;
      }
      return false;
    });
    return lines.map((line) => (/^\s*Sitemap:/i.test(line) ? sitemapLine : line)).join('\n');
  }

  // No Sitemap line present — append one.
  return `${raw.replace(/\s*$/, '')}\n\n${sitemapLine}\n`;
}

// ---------------------------------------------------------------------------
// llms.txt / llms-full.txt — inject the main-site fragment into the docs file
// ---------------------------------------------------------------------------

/**
 * Insert `fragment` into `base` immediately before the line matching `marker`.
 * Throws if the marker is not found, so a format change in the docs generator
 * fails the build loudly instead of silently dropping main-site content.
 */
function insertBefore(base, marker, fragment, label) {
  const lines = base.split('\n');
  const idx = lines.findIndex((line) => marker.test(line));
  if (idx === -1) {
    throw new Error(`Could not find insertion point (${marker}) in ${label}`);
  }
  const block = `${fragment.trim()}\n`;
  lines.splice(idx, 0, block);
  return lines.join('\n');
}

function mergeLlms(docsDist, mainSite) {
  const base = readFileSync(join(docsDist, 'llms.txt'), 'utf-8');
  const fragment = readFileSync(join(mainSite, 'llms.txt'), 'utf-8');
  // Insert the main-site section before the first docs section heading.
  return insertBefore(base, /^## /, fragment, 'llms.txt');
}

function mergeLlmsFull(docsDist, mainSite) {
  const base = readFileSync(join(docsDist, 'llms-full.txt'), 'utf-8');
  const fragment = readFileSync(join(mainSite, 'llms-full.txt'), 'utf-8');
  // The docs body starts after the `---` separator that follows the header block.
  // Insert the main-site section right after that separator, ahead of the docs sections.
  const lines = base.split('\n');
  const sepIdx = lines.findIndex((line) => line.trim() === '---');
  if (sepIdx === -1) {
    throw new Error('Could not find header separator (---) in llms-full.txt');
  }
  lines.splice(sepIdx + 1, 0, `\n${fragment.trim()}\n`);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = parseArgs(process.argv.slice(2));
  const docsDist = args['docs-dist'];
  const mainSite = args['main-site'];
  const out = args.out;

  mkdirSync(out, { recursive: true });

  const outputs = {
    'sitemap.xml': mergeSitemap(docsDist, mainSite),
    'robots.txt': mergeRobots(mainSite),
    'llms.txt': mergeLlms(docsDist, mainSite),
    'llms-full.txt': mergeLlmsFull(docsDist, mainSite),
  };

  for (const [name, content] of Object.entries(outputs)) {
    writeFileSync(join(out, name), content, 'utf-8');
    console.log(`✅ merged ${name} (${(content.length / 1024).toFixed(1)} KB)`);
  }
}

main();
