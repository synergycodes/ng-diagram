import { readdir, readFile } from 'fs/promises';
import matter from 'gray-matter';
import { basename, extname, join, relative } from 'path';
import type { DocumentPage, DocumentSection, IndexerConfig } from '../types/index.js';

export class DocumentationIndexer {
  private config: IndexerConfig;
  private pages: Map<string, DocumentPage> = new Map();

  constructor(config: IndexerConfig) {
    this.config = config;
  }

  /**
   * Build the documentation index by scanning and processing all files
   * @returns Array of indexed document sections
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
   * Get full page data by relative path
   * @param path Relative path from docs root (forward slashes)
   * @returns Page data or undefined if not found
   */
  getPage(path: string): DocumentPage | undefined {
    const normalizedPath = path.replace(/\\/g, '/');
    return this.pages.get(normalizedPath);
  }

  /**
   * Recursively scan directory for documentation files
   * @param dir Directory to scan
   * @returns Array of file paths matching configured extensions
   */
  private async scanDirectory(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          const subFiles = await this.scanDirectory(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
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
   * Process a single documentation file into sections
   * @param filePath Absolute path to the file
   * @returns Array of document sections
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
   * Split markdown body into sections based on ## headings
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
   * Generate a URL-friendly anchor slug from a heading
   * lowercase → strip non-alphanumeric (keep spaces/hyphens) → spaces to hyphens → collapse consecutive hyphens
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
   * Generate documentation URL from file path
   * @param filePath Relative file path from docs root
   * @returns Full documentation URL
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

    // Build full URL with base URL
    const path = urlPath ? `/docs/${urlPath}` : '/docs';
    return `${this.config.baseUrl}${path}`;
  }

  /**
   * Get filename without extension as fallback title
   * @param filePath File path
   * @returns Filename without extension
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
