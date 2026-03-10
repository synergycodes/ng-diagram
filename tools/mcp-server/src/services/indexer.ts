import { readdir, readFile } from 'fs/promises';
import matter from 'gray-matter';
import { basename, extname, join, relative } from 'path';
import type { DocumentPage, DocumentSection, IndexerConfig } from '../types/index.js';

/**
 * Scans a documentation directory for markdown files (.md/.mdx), extracts
 * YAML frontmatter (title, description) via gray-matter, and splits each
 * file into sections on `##` headings.
 *
 * Produces two outputs:
 * - A flat list of {@link DocumentSection} objects for full-text search indexing
 * - An internal page map (keyed by relative path) for full-page retrieval via {@link getPage}
 *
 * Symbolic links are skipped during directory scanning. Files that fail to
 * read or parse are logged and skipped without aborting the rest of the index.
 */
export class DocumentationIndexer {
  private config: IndexerConfig;
  private pages: Map<string, DocumentPage> = new Map();

  /** @param config Indexer configuration (docs path, file extensions, base URL) */
  constructor(config: IndexerConfig) {
    this.config = config;
  }

  /**
   * Scan the docs directory, parse all matching files, and build the section index.
   * Safe to call multiple times — replaces the previous index on each call.
   * @returns Flat array of all sections across all pages (empty on failure)
   */
  async buildIndex(): Promise<DocumentSection[]> {
    try {
      this.pages = new Map();
      const filePaths = await this.scanDirectory(this.config.docsPath);
      const sections: DocumentSection[] = [];

      for (const filePath of filePaths) {
        try {
          const fileSections = await this.processFile(filePath);
          sections.push(...fileSections);
        } catch (error) {
          console.warn(`Failed to process file ${filePath}:`, error instanceof Error ? error.message : error);
        }
      }

      return sections;
    } catch (error) {
      console.error(
        `Failed to build index from ${this.config.docsPath}:`,
        error instanceof Error ? error.message : error
      );
      return [];
    }
  }

  /**
   * Retrieve full page data by its relative path.
   * Backslashes are normalized to forward slashes before lookup.
   * @param path Relative path from docs root (e.g. `"guides/palette.mdx"`)
   * @returns Page data, or `undefined` if the path was not indexed
   */
  getPage(path: string): DocumentPage | undefined {
    const normalizedPath = path.replace(/\\/g, '/');
    return this.pages.get(normalizedPath);
  }

  /**
   * Recursively scan a directory for documentation files.
   * Symbolic links are skipped to prevent cycles. Only regular files whose
   * extension matches {@link IndexerConfig.extensions} are collected.
   * @param dir Absolute directory path to scan
   * @returns Absolute file paths matching the configured extensions
   */
  private async scanDirectory(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isSymbolicLink()) {
          continue;
        }

        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          const subFiles = await this.scanDirectory(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          // Skip files starting with underscore (e.g. _meta.yml, _readme.md)
          if (entry.name.startsWith('_')) {
            continue;
          }
          const ext = extname(entry.name);
          if (this.config.extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to scan directory ${dir}:`, error instanceof Error ? error.message : error);
    }

    return files;
  }

  /**
   * Read a single documentation file, extract frontmatter, store full-page
   * data in the page map, and split the body into sections.
   *
   * If frontmatter parsing fails (malformed YAML), the raw content is used
   * as the body and the filename is used as the title.
   * @param filePath Absolute path to the markdown file
   * @returns Sections produced from this file (empty on read failure)
   */
  private async processFile(filePath: string): Promise<DocumentSection[]> {
    try {
      const rawContent = await readFile(filePath, 'utf-8');
      const relativePath = relative(this.config.docsPath, filePath);
      const baseUrl = this.generateUrl(relativePath);

      let title: string | undefined;
      let description: string | undefined;
      let body: string;

      try {
        const parsed = matter(rawContent);
        title = parsed.data.title;
        description = parsed.data.description;
        body = parsed.content;
      } catch {
        // Fallback if frontmatter parsing fails
        body = rawContent;
      }

      const pageTitle = title || this.getFilenameAsTitle(filePath);
      const normalizedPath = relativePath.replace(/\\/g, '/');

      this.pages.set(normalizedPath, {
        title: pageTitle,
        body: body.trim(),
        url: baseUrl,
      });

      return this.splitIntoSections(body, pageTitle, description, normalizedPath, baseUrl);
    } catch (error) {
      console.warn(`Failed to read file ${filePath}:`, error instanceof Error ? error.message : error);
      return [];
    }
  }

  /**
   * Split a markdown body into sections on `##` headings.
   *
   * - Pages with no `##` headings produce a single section (sectionTitle = pageTitle).
   * - Content before the first `##` becomes an "Introduction" section (if non-empty).
   * - `###` and deeper headings are kept within their parent `##` section.
   * - The `description` is attached only to the first section of the page.
   *
   * @param body Markdown body with frontmatter already stripped
   * @param pageTitle Title of the parent page
   * @param description Page description from frontmatter (may be undefined)
   * @param path Relative path from docs root (forward slashes)
   * @param baseUrl Full page URL without anchor
   * @returns One or more sections for this page
   */
  private splitIntoSections(
    body: string,
    pageTitle: string,
    description: string | undefined,
    path: string,
    baseUrl: string
  ): DocumentSection[] {
    const headingRegex = /^## (.+)$/gm;
    const headings: { title: string; index: number }[] = [];

    let match: RegExpExecArray | null;
    while ((match = headingRegex.exec(body)) !== null) {
      headings.push({ title: match[1], index: match.index });
    }

    // No ## headings → single section with sectionTitle = pageTitle
    if (headings.length === 0) {
      return [
        {
          pageTitle,
          sectionTitle: pageTitle,
          content: body.trim(),
          path,
          url: baseUrl,
          description,
        },
      ];
    }

    const sections: DocumentSection[] = [];

    // Content before the first ## heading → "Introduction" section (if non-empty)
    const introContent = body.substring(0, headings[0].index).trim();
    if (introContent) {
      sections.push({
        pageTitle,
        sectionTitle: 'Introduction',
        content: introContent,
        path,
        url: baseUrl,
        description,
      });
    }

    // Each ## heading starts a section
    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i];
      const nextIndex = i + 1 < headings.length ? headings[i + 1].index : body.length;
      const sectionContent = body.substring(heading.index, nextIndex).trim();
      const anchor = this.generateAnchor(heading.title);

      sections.push({
        pageTitle,
        sectionTitle: heading.title,
        content: sectionContent,
        path,
        url: `${baseUrl}#${anchor}`,
        // description only on the first section
        ...(sections.length === 0 ? { description } : {}),
      });
    }

    return sections;
  }

  /**
   * Generate a URL-friendly anchor slug from a heading title.
   *
   * Transformation pipeline:
   * 1. Lowercase
   * 2. Strip non-alphanumeric characters (keep spaces and hyphens)
   * 3. Replace spaces with hyphens
   * 4. Collapse consecutive hyphens
   * 5. Trim leading/trailing hyphens
   *
   * @example generateAnchor("Heading with Special Characters!@#") → "heading-with-special-characters"
   */
  private generateAnchor(heading: string): string {
    return heading
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/ /g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Generate a full documentation URL from a relative file path.
   *
   * Strips the `.md`/`.mdx` extension, normalizes backslashes to forward
   * slashes, and handles `index` files (e.g. `guides/index.md` → `/docs/guides`).
   *
   * @param filePath Relative file path from docs root (e.g. `"guides/palette.mdx"`)
   * @returns Full URL (e.g. `"https://www.ngdiagram.dev/docs/guides/palette"`)
   */
  private generateUrl(filePath: string): string {
    // Remove file extension
    let urlPath = filePath.replace(/\.(md|mdx)$/, '');

    // Convert backslashes to forward slashes (Windows compatibility)
    urlPath = urlPath.replace(/\\/g, '/');

    // Handle index files
    if (urlPath.endsWith('/index') || urlPath === 'index') {
      urlPath = urlPath.replace(/\/index$/, '').replace(/^index$/, '');
    }

    // Lowercase the URL path for consistent routing
    urlPath = urlPath.toLowerCase();

    // Build full URL with base URL
    const path = urlPath ? `/docs/${urlPath}` : '/docs';
    return `${this.config.baseUrl}${path}`;
  }

  /**
   * Derive a human-readable title from a filename when frontmatter has no title.
   * Converts kebab-case and snake_case to Title Case.
   * @example getFilenameAsTitle("/docs/my-cool-doc.md") → "My Cool Doc"
   * @param filePath Absolute or relative file path
   * @returns Title-cased filename without extension
   */
  private getFilenameAsTitle(filePath: string): string {
    const filename = basename(filePath, extname(filePath));
    // Convert kebab-case or snake_case to Title Case
    return filename
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
