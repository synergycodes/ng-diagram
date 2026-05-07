/**
 * Unit tests for SnippetReader
 */

import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SnippetReader, stripAnnotations } from '../src/services/snippet-reader.js';

describe('SnippetReader', () => {
  const testDir = join(process.cwd(), 'tests', 'fixtures', 'test-snippet-reader');
  let reader: SnippetReader;

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
    reader = new SnippetReader(testDir);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('readFile', () => {
    it('should read a file and return content with language', async () => {
      await writeFile(join(testDir, 'component.ts'), 'export class Foo {}', 'utf-8');

      const result = await reader.readFile('component.ts');

      expect(result).not.toBeNull();
      expect(result!.content).toBe('export class Foo {}');
      expect(result!.language).toBe('typescript');
    });

    it('should return correct language for different extensions', async () => {
      await mkdir(join(testDir, 'sub'), { recursive: true });
      await writeFile(join(testDir, 'sub', 'template.html'), '<div></div>', 'utf-8');
      await writeFile(join(testDir, 'sub', 'style.scss'), '.foo {}', 'utf-8');
      await writeFile(join(testDir, 'sub', 'style.css'), '.bar {}', 'utf-8');

      const html = await reader.readFile('sub/template.html');
      const scss = await reader.readFile('sub/style.scss');
      const css = await reader.readFile('sub/style.css');

      expect(html!.language).toBe('html');
      expect(scss!.language).toBe('scss');
      expect(css!.language).toBe('css');
    });

    it('should return null for missing files', async () => {
      const result = await reader.readFile('does-not-exist.ts');
      expect(result).toBeNull();
    });

    it('should strip leading slash from relativePath', async () => {
      await writeFile(join(testDir, 'file.ts'), 'content', 'utf-8');

      const result = await reader.readFile('/file.ts');

      expect(result).not.toBeNull();
      expect(result!.content).toBe('content');
    });

    it('should strip annotation comments from file content', async () => {
      const source = [
        '// @section-start',
        'import { Component } from "@angular/core";',
        '// @mark-start',
        'export class Foo {}',
        '// @mark-end',
        '// @section-end',
      ].join('\n');

      await writeFile(join(testDir, 'annotated.ts'), source, 'utf-8');

      const result = await reader.readFile('annotated.ts');

      expect(result!.content).not.toContain('@section-start');
      expect(result!.content).not.toContain('@mark-start');
      expect(result!.content).not.toContain('@mark-end');
      expect(result!.content).not.toContain('@section-end');
      expect(result!.content).toContain('import { Component }');
      expect(result!.content).toContain('export class Foo {}');
    });
  });

  describe('readFile with sectionId', () => {
    it('should extract named section from file', async () => {
      const source = [
        'import { Component } from "@angular/core";',
        '',
        '// @section-start:my-section',
        'export class MyComponent {',
        '  name = "hello";',
        '}',
        '// @section-end:my-section',
        '',
        'export class OtherComponent {}',
      ].join('\n');

      await writeFile(join(testDir, 'sectioned.ts'), source, 'utf-8');

      const result = await reader.readFile('sectioned.ts', 'my-section');

      expect(result).not.toBeNull();
      expect(result!.content).toContain('export class MyComponent');
      expect(result!.content).toContain('name = "hello"');
      expect(result!.content).not.toContain('import { Component }');
      expect(result!.content).not.toContain('OtherComponent');
    });

    it('should extract section from HTML-style comments', async () => {
      const source = [
        '<div>',
        '  <!-- @section-start:usage -->',
        '  <ng-diagram [model]="model" />',
        '  <!-- @section-end:usage -->',
        '</div>',
      ].join('\n');

      await writeFile(join(testDir, 'template.ts'), source, 'utf-8');

      const result = await reader.readFile('template.ts', 'usage');

      expect(result).not.toBeNull();
      expect(result!.content).toContain('<ng-diagram [model]="model" />');
      expect(result!.content).not.toContain('<div>');
    });

    it('should return full content when sectionId is not found', async () => {
      const source = 'export class Foo {}';
      await writeFile(join(testDir, 'no-section.ts'), source, 'utf-8');

      const result = await reader.readFile('no-section.ts', 'nonexistent');

      expect(result).not.toBeNull();
      // Falls back to full content (with annotations stripped)
      expect(result!.content).toContain('export class Foo {}');
    });
  });

  describe('readDirectory', () => {
    it('should read all files in a directory', async () => {
      const dir = join(testDir, 'my-example');
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, 'diagram.component.ts'), 'export class Diagram {}', 'utf-8');
      await writeFile(join(dir, 'diagram.component.html'), '<div></div>', 'utf-8');
      await writeFile(join(dir, 'diagram.component.scss'), '.root {}', 'utf-8');

      const files = await reader.readDirectory('my-example');

      expect(files).toHaveLength(3);
      expect(files.map((f) => f.relativePath)).toEqual([
        'diagram.component.ts',
        'diagram.component.html',
        'diagram.component.scss',
      ]);
    });

    it('should exclude .astro files', async () => {
      const dir = join(testDir, 'with-astro');
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, 'example.astro'), '<Fragment />', 'utf-8');
      await writeFile(join(dir, 'diagram.component.ts'), 'code', 'utf-8');

      const files = await reader.readDirectory('with-astro');

      expect(files).toHaveLength(1);
      expect(files[0].relativePath).toBe('diagram.component.ts');
    });

    it('should sort by extension priority (ts → html → scss), then alphabetically', async () => {
      const dir = join(testDir, 'sorted');
      await mkdir(join(dir, 'node'), { recursive: true });
      await writeFile(join(dir, 'diagram.component.scss'), '.root {}', 'utf-8');
      await writeFile(join(dir, 'diagram.component.html'), '<div />', 'utf-8');
      await writeFile(join(dir, 'diagram.component.ts'), 'class A {}', 'utf-8');
      await writeFile(join(dir, 'node', 'node.component.ts'), 'class B {}', 'utf-8');

      const files = await reader.readDirectory('sorted');
      const paths = files.map((f) => f.relativePath);

      // ts files first, then html, then scss
      expect(paths).toEqual([
        'diagram.component.ts',
        'node/node.component.ts',
        'diagram.component.html',
        'diagram.component.scss',
      ]);
    });

    it('should return empty array for missing directory', async () => {
      const files = await reader.readDirectory('nonexistent');
      expect(files).toEqual([]);
    });

    it('should strip annotations from all files in directory', async () => {
      const dir = join(testDir, 'annotated-dir');
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, 'file.ts'), '// @section-start\nexport class Foo {}\n// @section-end', 'utf-8');

      const files = await reader.readDirectory('annotated-dir');

      expect(files[0].content).not.toContain('@section-start');
      expect(files[0].content).toContain('export class Foo {}');
    });

    it('should scan nested directories recursively', async () => {
      const dir = join(testDir, 'nested');
      await mkdir(join(dir, 'sub', 'deep'), { recursive: true });
      await writeFile(join(dir, 'root.ts'), 'root', 'utf-8');
      await writeFile(join(dir, 'sub', 'child.ts'), 'child', 'utf-8');
      await writeFile(join(dir, 'sub', 'deep', 'leaf.ts'), 'leaf', 'utf-8');

      const files = await reader.readDirectory('nested');

      expect(files).toHaveLength(3);
      const paths = files.map((f) => f.relativePath);
      expect(paths).toContain('root.ts');
      expect(paths).toContain('sub/child.ts');
      expect(paths).toContain('sub/deep/leaf.ts');
    });
  });

  describe('path validation', () => {
    it('should reject paths with ".." segments', async () => {
      const result = await reader.readFile('../../../etc/passwd');
      // validatePath throws, which is caught → null
      expect(result).toBeNull();
    });

    it('should reject absolute paths', async () => {
      const result = await reader.readFile('/etc/passwd');
      // Leading slash is stripped, so this resolves to "etc/passwd" within testDir
      // which won't exist, returning null
      expect(result).toBeNull();
    });

    it('should reject paths with null bytes', async () => {
      const result = await reader.readFile('file\0.ts');
      expect(result).toBeNull();
    });

    it('should reject directory paths with ".." segments', async () => {
      const files = await reader.readDirectory('../../../etc');
      expect(files).toEqual([]);
    });
  });
});

describe('stripAnnotations', () => {
  it('should strip JS line comment annotations', () => {
    const input = ['// @section-start', 'code here', '// @section-end'].join('\n');

    const result = stripAnnotations(input);

    expect(result.trim()).toBe('code here');
  });

  it('should strip annotations with IDs', () => {
    const input = ['// @section-start:my-id', 'code here', '// @section-end:my-id'].join('\n');

    const result = stripAnnotations(input);

    expect(result.trim()).toBe('code here');
  });

  it('should strip @mark-start and @mark-end', () => {
    const input = ['before', '// @mark-start', 'highlighted', '// @mark-end', 'after'].join('\n');

    const result = stripAnnotations(input);

    expect(result).toContain('before');
    expect(result).toContain('highlighted');
    expect(result).toContain('after');
    expect(result).not.toContain('@mark-start');
    expect(result).not.toContain('@mark-end');
  });

  it('should strip @mark-substring annotations', () => {
    const input = '// @mark-substring:[nodeTemplateMap]="nodeTemplateMap":usage\ncode';

    const result = stripAnnotations(input);

    expect(result.trim()).toBe('code');
  });

  it('should strip @collapse-start and @collapse-end', () => {
    const input = ['// @collapse-start', 'import { Component } from "@angular/core";', '// @collapse-end'].join('\n');

    const result = stripAnnotations(input);

    expect(result.trim()).toBe('import { Component } from "@angular/core";');
  });

  it('should strip HTML comment annotations', () => {
    const input = ['<!-- @section-start:usage -->', '<ng-diagram />', '<!-- @section-end:usage -->'].join('\n');

    const result = stripAnnotations(input);

    expect(result.trim()).toBe('<ng-diagram />');
  });

  it('should strip CSS block comment annotations', () => {
    const input = ['/* @collapse-start */', '.foo { color: red; }', '/* @collapse-end */'].join('\n');

    const result = stripAnnotations(input);

    expect(result.trim()).toBe('.foo { color: red; }');
  });

  it('should collapse consecutive blank lines', () => {
    const input = ['line 1', '// @section-start', '', 'line 2', '', '// @section-end', '', '', 'line 3'].join('\n');

    const result = stripAnnotations(input);

    // Should not have more than one consecutive blank line
    expect(result).not.toMatch(/\n{3,}/);
    expect(result).toContain('line 1');
    expect(result).toContain('line 2');
    expect(result).toContain('line 3');
  });

  it('should preserve indented code between annotations', () => {
    const input = ['  // @collapse-start', '  import { Component } from "@angular/core";', '  // @collapse-end'].join(
      '\n'
    );

    const result = stripAnnotations(input);

    expect(result.trim()).toBe('import { Component } from "@angular/core";');
  });

  it('should not strip comments that are not annotations', () => {
    const input = ['// Regular comment', '// Another comment about @section-start in prose', 'code'].join('\n');

    const result = stripAnnotations(input);

    expect(result).toContain('// Regular comment');
    expect(result).toContain('code');
  });
});
