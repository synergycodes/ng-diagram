import { readFile } from 'fs/promises';
import type { ApiSymbol } from '../types/index.js';

const IMPORT_PATH = 'ng-diagram';

export class ApiReportIndexer {
  private apiReportPath: string;
  private symbols: ApiSymbol[] = [];

  constructor(apiReportPath: string) {
    this.apiReportPath = apiReportPath;
  }

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
      return [];
    }

    const codeBlock = this.extractCodeBlock(content);
    if (!codeBlock) {
      console.warn('[ApiReportIndexer] No TypeScript code block found in API report');
      this.symbols = [];
      return [];
    }

    this.symbols = this.parseCodeBlock(codeBlock);
    return this.symbols;
  }

  getSymbols(): ApiSymbol[] {
    return this.symbols;
  }

  getSymbol(name: string): ApiSymbol | undefined {
    return this.symbols.find((s) => s.name === name);
  }

  private extractCodeBlock(content: string): string | null {
    const match = content.match(/```ts\n([\s\S]*?)```/);
    return match ? match[1] : null;
  }

  private parseCodeBlock(code: string): ApiSymbol[] {
    const lines = code.split('\n');
    const symbols: ApiSymbol[] = [];
    const symbolMap = new Map<string, ApiSymbol>();
    let isPublic = false;
    let isDeprecated = false;
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Skip import lines
      if (line.startsWith('import ') || line.startsWith('import *')) {
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
          const { name, kind, endIndex } = this.collectDeclaration(lines, i, nonExportedType.isBraceDelimited);
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

      const { endIndex } = this.collectDeclaration(lines, i, declInfo.isBraceDelimited);
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

    return symbols;
  }

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

  private parseNonExportedDeclaration(
    line: string
  ): { name: string; kind: ApiSymbol['kind']; isBraceDelimited: boolean } | null {
    // type Node_2<T> = ... (non-exported, used with re-export pattern)
    const match = line.match(/^type (\w+)/);
    if (match) return { name: match[1], kind: 'type', isBraceDelimited: false };

    return null;
  }

  private collectDeclaration(
    lines: string[],
    startIndex: number,
    isBraceDelimited: boolean
  ): { name: string; kind: string; endIndex: number } {
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
          return { name: '', kind: '', endIndex: j };
        }
      }

      // Fallback: unterminated block, return to end
      return { name: '', kind: '', endIndex: lines.length - 1 };
    }

    // Single-line or multi-line ending with ;
    for (let j = startIndex; j < lines.length; j++) {
      if (lines[j].trimEnd().endsWith(';')) {
        return { name: '', kind: '', endIndex: j };
      }
    }

    // Fallback
    return { name: '', kind: '', endIndex: startIndex };
  }

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
      if (trimmed.match(/^static ɵ/)) return false;

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
