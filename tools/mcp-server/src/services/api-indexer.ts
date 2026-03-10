import { readFile } from 'fs/promises';
import type { ApiSymbol } from '../types/index.js';

const IMPORT_PATH = 'ng-diagram';

/**
 * Parses API Extractor report files (.api.md) and extracts public TypeScript symbols.
 *
 * Reads the ```ts code block from an API report, identifies exported declarations
 * (interfaces, classes, functions, types, consts, enums), and builds a lookup index.
 * Handles visibility tags (@public, @internal, deprecated), re-export aliases
 * (`export { X as Y }`), and cleans Angular compiler artifacts from signatures.
 */
export class ApiReportIndexer {
  private apiReportPath: string;
  private symbols: ApiSymbol[] = [];
  private symbolMap = new Map<string, ApiSymbol>();

  /** @param apiReportPath Absolute path to the .api.md report file */
  constructor(apiReportPath: string) {
    this.apiReportPath = apiReportPath;
  }

  /**
   * Read and parse the API report, building the symbol index.
   * Safe to call multiple times — replaces the previous index.
   * @returns Array of parsed public API symbols (empty on read/parse failure)
   */
  async buildIndex(): Promise<ApiSymbol[]> {
    let content: string;
    try {
      content = await readFile(this.apiReportPath, 'utf-8');
    } catch (error) {
      console.warn(
        `[ApiReportIndexer] Failed to read API report at ${this.apiReportPath}:`,
        error instanceof Error ? error.message : error
      );
      this.symbols = [];
      this.symbolMap = new Map();
      return [];
    }

    const codeBlock = this.extractCodeBlock(content);
    if (!codeBlock) {
      console.warn('[ApiReportIndexer] No TypeScript code block found in API report');
      this.symbols = [];
      this.symbolMap = new Map();
      return [];
    }

    const { symbols, symbolMap } = this.parseCodeBlock(codeBlock);
    this.symbols = symbols;
    this.symbolMap = symbolMap;
    return this.symbols;
  }

  /** @returns All indexed symbols (empty before {@link buildIndex} is called) */
  getSymbols(): ApiSymbol[] {
    return this.symbols;
  }

  /**
   * Look up a symbol by exact name.
   * @param name Case-sensitive symbol name (e.g. `"NgDiagramComponent"`)
   * @returns The symbol, or `undefined` if not found
   */
  getSymbol(name: string): ApiSymbol | undefined {
    return this.symbolMap.get(name);
  }

  /**
   * Extract the first ```ts ... ``` fenced code block from the report markdown.
   * @returns The code block contents, or `null` if none found
   */
  private extractCodeBlock(content: string): string | null {
    const match = content.match(/```ts\n([\s\S]*?)```/);
    return match ? match[1] : null;
  }

  /**
   * Walk through the code block line-by-line, tracking visibility tags
   * (`// @public`, `// @internal`, etc.) and collecting exported declarations.
   *
   * Also handles the API Extractor re-export pattern where an internal name
   * (e.g. `Node_2`) is later aliased via `export { Node_2 as Node }`.
   */
  private parseCodeBlock(code: string): { symbols: ApiSymbol[]; symbolMap: Map<string, ApiSymbol> } {
    const lines = code.split('\n');
    const symbols: ApiSymbol[] = [];
    const symbolMap = new Map<string, ApiSymbol>();
    let isPublic = false;
    let isDeprecated = false;
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Skip import lines
      if (line.startsWith('import ')) {
        i++;
        continue;
      }

      // Skip Warning comment lines
      if (line.startsWith('// Warning:')) {
        i++;
        continue;
      }

      // Skip empty comment-only lines between warning and tag
      if (line === '//') {
        i++;
        continue;
      }

      // Check for visibility tags
      if (line.startsWith('// @')) {
        const tagMatch = line.match(/^\/\/ (@\w+(?:\s+@\w+)*)/);
        if (tagMatch) {
          const tags = tagMatch[1];
          isPublic = tags.includes('@public');
          isDeprecated = tags.includes('@deprecated');
        }
        i++;
        continue;
      }

      // Handle re-export: export { X as Y }
      const reExportMatch = line.match(/^export \{ (\w+) as (\w+) \}/);
      if (reExportMatch) {
        const [, originalName, aliasName] = reExportMatch;
        const existing = symbolMap.get(originalName);
        if (existing) {
          symbolMap.delete(originalName);
          existing.name = aliasName;
          symbolMap.set(aliasName, existing);
        }
        i++;
        isPublic = false;
        isDeprecated = false;
        continue;
      }

      // Skip non-public declarations
      if (!isPublic) {
        i++;
        continue;
      }

      // Skip non-exported type declarations (except for re-export targets like Node_2)
      // Parse exported declarations
      const declInfo = this.parseDeclarationStart(line);
      if (!declInfo) {
        // Also check for non-exported type declarations (for re-export pattern like `type Node_2`)
        const nonExportedType = this.parseNonExportedDeclaration(line);
        if (nonExportedType) {
          const endIndex = this.collectDeclarationEnd(lines, i, nonExportedType.isBraceDelimited);
          const rawSignature = lines.slice(i, endIndex + 1).join('\n');
          const signature = this.cleanSignature(rawSignature);
          const symbol: ApiSymbol = {
            name: nonExportedType.name,
            kind: nonExportedType.kind,
            signature,
            importPath: IMPORT_PATH,
          };
          if (isDeprecated) {
            symbol.jsDoc = '@deprecated';
          }
          symbols.push(symbol);
          symbolMap.set(nonExportedType.name, symbol);
          i = endIndex + 1;
          isPublic = false;
          isDeprecated = false;
          continue;
        }

        i++;
        continue;
      }

      const endIndex = this.collectDeclarationEnd(lines, i, declInfo.isBraceDelimited);
      const rawSignature = lines.slice(i, endIndex + 1).join('\n');
      const signature = this.cleanSignature(rawSignature);

      const symbol: ApiSymbol = {
        name: declInfo.name,
        kind: declInfo.kind,
        signature,
        importPath: IMPORT_PATH,
      };
      if (isDeprecated) {
        symbol.jsDoc = '@deprecated';
      }

      symbols.push(symbol);
      symbolMap.set(declInfo.name, symbol);
      i = endIndex + 1;
      isPublic = false;
      isDeprecated = false;
    }

    return { symbols, symbolMap };
  }

  /**
   * Try to parse the start of an exported declaration from a single line.
   * Matches patterns like `export interface Foo`, `export class Bar`, etc.
   * @returns Parsed declaration info, or `null` if the line is not a declaration start
   */
  private parseDeclarationStart(
    line: string
  ): { name: string; kind: ApiSymbol['kind']; isBraceDelimited: boolean } | null {
    // export interface Foo {
    let match = line.match(/^export interface (\w+)/);
    if (match) return { name: match[1], kind: 'interface', isBraceDelimited: true };

    // export class Foo {
    match = line.match(/^export class (\w+)/);
    if (match) return { name: match[1], kind: 'class', isBraceDelimited: true };

    // export function foo(
    match = line.match(/^export function (\w+)/);
    if (match) return { name: match[1], kind: 'function', isBraceDelimited: false };

    // export type Foo = ...
    match = line.match(/^export type (\w+)/);
    if (match) return { name: match[1], kind: 'type', isBraceDelimited: false };

    // export const foo = ... or export const foo: ...
    match = line.match(/^export const (\w+)/);
    if (match) return { name: match[1], kind: 'const', isBraceDelimited: false };

    // export enum Foo {
    match = line.match(/^export enum (\w+)/);
    if (match) return { name: match[1], kind: 'enum', isBraceDelimited: true };

    return null;
  }

  /**
   * Try to parse the start of a non-exported declaration (e.g. `type Node_2 = ...`).
   * These appear in API reports when the public name is aliased via
   * `export { Node_2 as Node }`.
   * @returns Parsed declaration info, or `null` if the line is not a declaration start
   */
  private parseNonExportedDeclaration(
    line: string
  ): { name: string; kind: ApiSymbol['kind']; isBraceDelimited: boolean } | null {
    let match = line.match(/^interface (\w+)/);
    if (match) return { name: match[1], kind: 'interface', isBraceDelimited: true };

    match = line.match(/^class (\w+)/);
    if (match) return { name: match[1], kind: 'class', isBraceDelimited: true };

    match = line.match(/^type (\w+)/);
    if (match) return { name: match[1], kind: 'type', isBraceDelimited: false };

    match = line.match(/^enum (\w+)/);
    if (match) return { name: match[1], kind: 'enum', isBraceDelimited: true };

    return null;
  }

  /**
   * Find the line index where a declaration ends.
   *
   * For brace-delimited declarations (interfaces, classes, enums), counts
   * `{` / `}` to find the matching closing brace. For semicolon-terminated
   * declarations (functions, types, consts), scans forward for a line ending
   * with `;`.
   *
   * Note: brace counting does not account for braces inside string literals
   * or comments — this is safe for API Extractor output but not general TS.
   *
   * @param lines All lines of the code block
   * @param startIndex Line index where the declaration starts
   * @param isBraceDelimited Whether the declaration uses `{ }` (true) or `;` (false)
   * @returns Line index of the last line of the declaration
   */
  private collectDeclarationEnd(lines: string[], startIndex: number, isBraceDelimited: boolean): number {
    if (isBraceDelimited) {
      let braceDepth = 0;
      let foundOpen = false;

      for (let j = startIndex; j < lines.length; j++) {
        const line = lines[j];
        for (const ch of line) {
          if (ch === '{') {
            braceDepth++;
            foundOpen = true;
          } else if (ch === '}') {
            braceDepth--;
          }
        }
        if (foundOpen && braceDepth === 0) {
          return j;
        }
      }

      // Fallback: unterminated block, return to end
      return lines.length - 1;
    }

    // Single-line or multi-line ending with ;
    for (let j = startIndex; j < lines.length; j++) {
      if (lines[j].trimEnd().endsWith(';')) {
        return j;
      }
    }

    // Fallback
    return startIndex;
  }

  /**
   * Clean a raw declaration signature for public consumption.
   *
   * - Strips the `export ` keyword prefix
   * - Removes Angular compiler artifacts (`static ɵcmp`, `static ɵfac`, etc.)
   * - Removes `// (undocumented)` and `// @internal` comment lines
   * - Collapses consecutive blank lines
   */
  private cleanSignature(raw: string): string {
    let lines = raw.split('\n');

    // Remove 'export ' prefix from first line
    if (lines.length > 0 && lines[0].startsWith('export ')) {
      lines[0] = lines[0].slice('export '.length);
    }

    // Filter out lines
    lines = lines.filter((line) => {
      const trimmed = line.trim();

      // Remove Angular compiler artifact lines (static ɵ...)
      if (trimmed.match(/^(\/\/ \(undocumented\)\s*)?static ɵ/)) return false;

      // Remove // (undocumented) comments
      if (trimmed === '// (undocumented)') return false;

      // Remove // @internal (undocumented) and // @internal comments within bodies
      if (trimmed === '// @internal (undocumented)') return false;
      if (trimmed === '// @internal') return false;

      return true;
    });

    // Collapse consecutive empty lines into single empty line
    const collapsed: string[] = [];
    let prevEmpty = false;
    for (const line of lines) {
      const isEmpty = line.trim() === '';
      if (isEmpty && prevEmpty) continue;
      collapsed.push(line);
      prevEmpty = isEmpty;
    }

    return collapsed.join('\n').trim();
  }
}
