import { readFile, readdir } from 'fs/promises';
import { extname, join, relative, resolve } from 'path';

interface SnippetFile {
  relativePath: string;
  content: string;
  language: string;
}

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.html': 'html',
  '.scss': 'scss',
  '.css': 'css',
  '.json': 'json',
};

/** Sort priority: lower number = shown first in CodeViewer output. */
const EXTENSION_PRIORITY: Record<string, number> = {
  '.ts': 0,
  '.html': 1,
  '.css': 2,
  '.scss': 2,
};

/**
 * Reads example source files referenced by `<CodeSnippet>` and `<CodeViewer>`
 * tags in documentation MDX. Handles section extraction (`sectionId`) and
 * strips Starlight annotation comments before returning the code.
 */
export class SnippetReader {
  constructor(private examplesPath: string) {}

  /**
   * Read a single source file relative to the examples directory.
   * Optionally extracts a named section and strips all annotations.
   *
   * @param relativePath File path relative to the examples directory
   * @param sectionId Optional section to extract (between `@section-start:id` / `@section-end:id`)
   * @returns Snippet content and language, or `null` if the file cannot be read
   */
  async readFile(relativePath: string, sectionId?: string): Promise<{ content: string; language: string } | null> {
    try {
      const normalizedPath = relativePath.replace(/^\//, '');
      const absolutePath = this.resolveSafePath(normalizedPath);

      let content = await readFile(absolutePath, 'utf-8');

      if (sectionId) {
        content = this.extractSection(content, sectionId);
      }

      content = stripAnnotations(content);

      const language = EXTENSION_LANGUAGE_MAP[extname(normalizedPath)] ?? '';

      return { content, language };
    } catch {
      console.warn(`[SnippetReader] File not found: ${relativePath}`);
      return null;
    }
  }

  /**
   * Read all files in a directory (for `<CodeViewer>`).
   * Excludes `.astro` files and sorts by extension priority then alphabetically.
   *
   * @param dirName Directory path relative to the examples directory
   * @returns Array of snippet files, or empty array if the directory cannot be read
   */
  async readDirectory(dirName: string): Promise<SnippetFile[]> {
    try {
      const absoluteDir = this.resolveSafePath(dirName);

      const filePaths = await this.scanDirectoryRecursively(absoluteDir);
      const results: SnippetFile[] = [];

      for (const filePath of filePaths) {
        const ext = extname(filePath);
        if (ext === '.astro') continue;

        try {
          const raw = await readFile(filePath, 'utf-8');
          const content = stripAnnotations(raw);
          const language = EXTENSION_LANGUAGE_MAP[ext] ?? '';
          const relPath = relative(absoluteDir, filePath).replace(/\\/g, '/');

          results.push({ relativePath: relPath, content, language });
        } catch {
          console.warn(`[SnippetReader] Failed to read file: ${filePath}`);
        }
      }

      results.sort((a, b) => {
        const extA = extname(a.relativePath);
        const extB = extname(b.relativePath);
        const priorityA = EXTENSION_PRIORITY[extA] ?? 99;
        const priorityB = EXTENSION_PRIORITY[extB] ?? 99;
        if (priorityA !== priorityB) return priorityA - priorityB;
        return a.relativePath.localeCompare(b.relativePath);
      });

      return results;
    } catch {
      console.warn(`[SnippetReader] Directory not found: ${dirName}`);
      return [];
    }
  }

  /**
   * Extract content between `@section-start:id` and `@section-end:id` markers.
   * The markers themselves are removed from the output.
   */
  private extractSection(content: string, sectionId: string): string {
    const escaped = escapeRegex(sectionId);
    const startPattern = new RegExp(
      `(?:^[ \\t]*\\/\\/\\s*@section-start:${escaped}\\s*$)|(?:^[ \\t]*<!--\\s*@section-start:${escaped}\\s*-->\\s*$)`,
      'm'
    );
    const endPattern = new RegExp(
      `(?:^[ \\t]*\\/\\/\\s*@section-end:${escaped}\\s*$)|(?:^[ \\t]*<!--\\s*@section-end:${escaped}\\s*-->\\s*$)`,
      'm'
    );

    const startMatch = startPattern.exec(content);
    if (!startMatch) {
      console.warn(`[SnippetReader] Section not found: ${sectionId}`);
      return content;
    }

    const afterStart = startMatch.index + startMatch[0].length;
    const remaining = content.substring(afterStart);
    const endMatch = endPattern.exec(remaining);

    if (!endMatch) {
      console.warn(`[SnippetReader] Section end not found: ${sectionId}`);
      return remaining.trim();
    }

    return remaining.substring(0, endMatch.index).trim();
  }

  /**
   * Validate a relative path and resolve it to an absolute path within the
   * examples directory. Throws if the path is unsafe (traversal, absolute, null bytes)
   * or escapes the examples directory after resolution.
   */
  private resolveSafePath(path: string): string {
    if (path.includes('\0')) {
      throw new Error('Path contains null bytes');
    }
    if (path.includes('..')) {
      throw new Error('Path contains ".." segments');
    }
    if (/^[/\\]/.test(path) || /^[a-zA-Z]:/.test(path)) {
      throw new Error('Absolute paths are not allowed');
    }

    const absolutePath = join(this.examplesPath, path);
    const resolved = resolve(absolutePath);
    const resolvedBase = resolve(this.examplesPath);

    if (!resolved.startsWith(resolvedBase)) {
      throw new Error(`Path escapes examples directory: ${path}`);
    }

    return absolutePath;
  }

  /** Recursively collect all file paths in a directory, skipping symbolic links. */
  private async scanDirectoryRecursively(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isSymbolicLink()) continue;

        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          const subFiles = await this.scanDirectoryRecursively(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch {
      console.warn(`[SnippetReader] Failed to scan directory: ${dir}`);
    }

    return files;
  }
}

/**
 * Strip all Starlight annotation comments from source code.
 *
 * Handled annotations:
 * - `// @section-start(:id)?` / `// @section-end(:id)?`
 * - `// @mark-start(:id)?` / `// @mark-end(:id)?`
 * - `// @mark-substring:...`
 * - `// @collapse-start` / `// @collapse-end`
 * - HTML comment equivalents: `<!-- @annotation -->`
 * - CSS block comment equivalents: `/* @annotation * /`
 *
 * After stripping, consecutive blank lines are collapsed to a single blank line.
 */
export function stripAnnotations(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (
      /^\/\/\s*@(section-start|section-end|mark-start|mark-end|mark-substring|collapse-start|collapse-end)\b/.test(
        trimmed
      )
    ) {
      continue;
    }

    if (
      /^<!--\s*@(section-start|section-end|mark-start|mark-end|mark-substring|collapse-start|collapse-end)\b.*-->$/.test(
        trimmed
      )
    ) {
      continue;
    }

    if (
      /^\/\*\s*@(section-start|section-end|mark-start|mark-end|mark-substring|collapse-start|collapse-end)\b.*\*\/$/.test(
        trimmed
      )
    ) {
      continue;
    }

    result.push(line);
  }

  return collapseBlankLines(result.join('\n'));
}

/** Collapse runs of 2+ blank lines into a single blank line. */
function collapseBlankLines(content: string): string {
  return content.replace(/\n{3,}/g, '\n\n');
}

/** Escape special regex characters in a string. */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
