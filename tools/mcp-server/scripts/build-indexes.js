/**
 * Pre-builds search indexes during the build phase so the MCP server
 * can load them on startup instead of re-parsing source files.
 *
 * Produces four files in dist/data/:
 *   - docs-search-index.json  (MiniSearch index for search_docs)
 *   - docs-pages.json         (pages map for get_doc)
 *   - symbol-search-index.json (MiniSearch index for search_symbols)
 *   - symbol-map.json         (symbol map for get_symbol)
 *
 * Must run AFTER tsc (imports compiled JS from dist/).
 */

import { existsSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dist = resolve(__dirname, '../dist');
const dataDir = resolve(dist, 'data');

// Import compiled services and constants from dist/ (use file:// URLs for Windows compatibility)
const { DocumentationIndexer } = await import(pathToFileURL(resolve(dist, 'services/indexer.js')).href);
const { ApiReportIndexer } = await import(pathToFileURL(resolve(dist, 'services/api-indexer.js')).href);
const { SearchEngine } = await import(pathToFileURL(resolve(dist, 'services/search.js')).href);
const { SymbolSearchEngine } = await import(pathToFileURL(resolve(dist, 'services/symbol-search.js')).href);
const { INDEX_FILE_NAMES } = await import(pathToFileURL(resolve(dist, 'types/index.js')).href);

// Paths to bundled source data (already copied by bundle-data.js)
const docsPath = resolve(dataDir, 'docs');
const apiReportPath = resolve(dataDir, 'ng-diagram.api.md');
const examplesPath = resolve(dataDir, 'examples');

// --- Build documentation index ---

if (!existsSync(docsPath)) {
  console.error(`[build-indexes] docs not found at ${docsPath}, skipping`);
  process.exit(1);
}

const indexer = new DocumentationIndexer({
  docsPath,
  extensions: ['.md', '.mdx'],
  baseUrl: 'https://www.ngdiagram.dev',
  examplesPath: existsSync(examplesPath) ? examplesPath : undefined,
});

const sections = await indexer.buildIndex();
const searchEngine = new SearchEngine(sections);

writeFileSync(resolve(dataDir, INDEX_FILE_NAMES.docsSearch), searchEngine.toJSON(), 'utf-8');
writeFileSync(resolve(dataDir, INDEX_FILE_NAMES.docsPages), indexer.pagesToJSON(), 'utf-8');
console.log(`[build-indexes] Built docs index: ${sections.length} sections`);

// --- Build API symbol index ---

if (existsSync(apiReportPath)) {
  const apiIndexer = new ApiReportIndexer(apiReportPath);
  const symbols = await apiIndexer.buildIndex();
  const symbolSearch = new SymbolSearchEngine(symbols);

  writeFileSync(resolve(dataDir, INDEX_FILE_NAMES.symbolSearch), symbolSearch.toJSON(), 'utf-8');
  writeFileSync(resolve(dataDir, INDEX_FILE_NAMES.symbolMap), apiIndexer.symbolsToJSON(), 'utf-8');
  console.log(`[build-indexes] Built symbol index: ${symbols.length} symbols`);
} else {
  console.warn(`[build-indexes] API report not found at ${apiReportPath}, skipping symbol index`);
}
