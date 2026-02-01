/**
 * Documentation indexer for scanning and processing documentation files
 */

import { readdir, readFile } from 'fs/promises';
import matter from 'gray-matter';
import { basename, extname, join, relative } from 'path';
import type { DocumentMetadata, IndexerConfig } from '../types/index.js';

/**
 * Documentation indexer that scans and indexes markdown files
 */
export class DocumentationIndexer {
  private config: IndexerConfig;

  constructor(config: IndexerConfig) {
    this.config = config;
  }

  /**
   * Build the documentation index by scanning and processing all files
   * @returns Array of indexed document metadata
   */
  async buildIndex(): Promise<DocumentMetadata[]> {
    try {
      const filePaths = await this.scanDirectory(this.config.docsPath);
      const documents: DocumentMetadata[] = [];

      for (const filePath of filePaths) {
        try {
          const doc = await this.processFile(filePath);
          if (doc) {
            documents.push(doc);
          }
        } catch (error) {
          console.warn(`Failed to process file ${filePath}:`, error instanceof Error ? error.message : error);
        }
      }

      return documents;
    } catch (error) {
      console.error(
        `Failed to build index from ${this.config.docsPath}:`,
        error instanceof Error ? error.message : error
      );
      return [];
    }
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
   * Process a single documentation file
   * @param filePath Absolute path to the file
   * @returns Document metadata or null if processing fails
   */
  private async processFile(filePath: string): Promise<DocumentMetadata | null> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const { title, description } = this.extractFrontmatter(content);
      const relativePath = relative(this.config.docsPath, filePath);
      const url = this.generateUrl(relativePath);

      return {
        path: relativePath,
        title: title || this.getFilenameAsTitle(filePath),
        description,
        content,
        url,
      };
    } catch (error) {
      console.warn(`Failed to read file ${filePath}:`, error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * Extract frontmatter metadata from file content
   * @param content File content
   * @returns Extracted title and description
   */
  private extractFrontmatter(content: string): { title?: string; description?: string } {
    try {
      const parsed = matter(content);
      return {
        title: parsed.data.title,
        description: parsed.data.description,
      };
    } catch (error) {
      console.warn('Failed to parse frontmatter:', error instanceof Error ? error.message : error);
      return {};
    }
  }

  /**
   * Generate documentation URL from file path
   * @param filePath Relative file path from docs root
   * @returns Documentation URL path
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

    // Prepend /docs prefix
    return urlPath ? `/docs/${urlPath}` : '/docs';
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
