/**
 * Unit tests for get_doc tool handler
 */

import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DocumentationIndexer } from '../src/services/indexer.js';
import { createGetDocHandler, GET_DOC_TOOL } from '../src/tools/get-doc/index.js';
import type { GetDocInput } from '../src/tools/get-doc/tool.types.js';
import type { IndexerConfig } from '../src/types/index.js';

describe('get_doc tool', () => {
  const testDir = join(process.cwd(), 'tests', 'fixtures', 'test-docs-getdoc');
  let indexer: DocumentationIndexer;
  let handler: ReturnType<typeof createGetDocHandler>;

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });

    const config: IndexerConfig = {
      docsPath: testDir,
      baseUrl: 'https://www.ngdiagram.dev',
      extensions: ['.md', '.mdx'],
    };
    indexer = new DocumentationIndexer(config);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('tool schema definition', () => {
    it('should have correct tool name', () => {
      expect(GET_DOC_TOOL.name).toBe('get_doc');
    });

    it('should have a description', () => {
      expect(GET_DOC_TOOL.description).toBeDefined();
      expect(GET_DOC_TOOL.description.length).toBeGreaterThan(0);
    });

    it('should define input schema with path parameter', () => {
      expect(GET_DOC_TOOL.inputSchema.properties.path).toBeDefined();
      expect(GET_DOC_TOOL.inputSchema.properties.path.type).toBe('string');
    });

    it('should mark path as required', () => {
      expect(GET_DOC_TOOL.inputSchema.required).toContain('path');
    });
  });

  describe('input validation', () => {
    beforeEach(async () => {
      await writeFile(join(testDir, 'test.md'), '# Test', 'utf-8');
      await indexer.buildIndex();
      handler = createGetDocHandler(indexer);
    });

    it('should reject empty string path', async () => {
      const input: GetDocInput = { path: '' };
      await expect(handler(input)).rejects.toThrow('Path parameter is required');
    });

    it('should reject whitespace-only path', async () => {
      const input: GetDocInput = { path: '   ' };
      await expect(handler(input)).rejects.toThrow('Path parameter cannot be empty');
    });

    it('should reject path with tabs and spaces', async () => {
      const input: GetDocInput = { path: '\t  \t  ' };
      await expect(handler(input)).rejects.toThrow('Path parameter cannot be empty');
    });
  });

  describe('successful retrieval', () => {
    it('should return correct title, body, and url', async () => {
      const content = `---
title: Palette Guide
description: Learn about palettes
---

This is the palette guide content.

## Colors

Color details here.
`;
      await writeFile(join(testDir, 'palette.md'), content, 'utf-8');
      await indexer.buildIndex();
      handler = createGetDocHandler(indexer);

      const result = await handler({ path: 'palette.md' });

      expect(result.title).toBe('Palette Guide');
      expect(result.url).toBe('https://www.ngdiagram.dev/docs/palette');
      expect(result.body).toContain('This is the palette guide content.');
      expect(result.body).toContain('## Colors');
    });

    it('should return body without frontmatter', async () => {
      const content = `---
title: Test Doc
description: A test document
---

Body content here.
`;
      await writeFile(join(testDir, 'test.md'), content, 'utf-8');
      await indexer.buildIndex();
      handler = createGetDocHandler(indexer);

      const result = await handler({ path: 'test.md' });

      expect(result.body).not.toContain('---');
      expect(result.body).not.toContain('title: Test Doc');
      expect(result.body).not.toContain('description: A test document');
      expect(result.body).toContain('Body content here.');
    });

    it('should handle nested paths', async () => {
      const nestedDir = join(testDir, 'guides');
      await mkdir(nestedDir, { recursive: true });

      const content = `---
title: Advanced Guide
---

Advanced content.
`;
      await writeFile(join(nestedDir, 'advanced.mdx'), content, 'utf-8');
      await indexer.buildIndex();
      handler = createGetDocHandler(indexer);

      const result = await handler({ path: 'guides/advanced.mdx' });

      expect(result.title).toBe('Advanced Guide');
      expect(result.body).toContain('Advanced content.');
      expect(result.url).toBe('https://www.ngdiagram.dev/docs/guides/advanced');
    });

    it('should use filename as title when frontmatter has no title', async () => {
      await writeFile(join(testDir, 'my-guide.md'), '# Some content', 'utf-8');
      await indexer.buildIndex();
      handler = createGetDocHandler(indexer);

      const result = await handler({ path: 'my-guide.md' });

      expect(result.title).toBe('My Guide');
    });
  });

  describe('document not found', () => {
    beforeEach(async () => {
      await writeFile(join(testDir, 'exists.md'), '# Exists', 'utf-8');
      await indexer.buildIndex();
      handler = createGetDocHandler(indexer);
    });

    it('should throw error for non-existent path', async () => {
      await expect(handler({ path: 'does-not-exist.md' })).rejects.toThrow('Document not found: does-not-exist.md');
    });

    it('should throw error with descriptive message including path', async () => {
      await expect(handler({ path: 'some/nested/missing.mdx' })).rejects.toThrow('some/nested/missing.mdx');
    });
  });

  describe('edge cases', () => {
    it('should handle .mdx extension', async () => {
      const content = `---
title: MDX Component
---

<MyComponent />
`;
      await writeFile(join(testDir, 'component.mdx'), content, 'utf-8');
      await indexer.buildIndex();
      handler = createGetDocHandler(indexer);

      const result = await handler({ path: 'component.mdx' });

      expect(result.title).toBe('MDX Component');
      expect(result.body).toContain('<MyComponent />');
    });

    it('should handle paths with backslashes by normalizing to forward slashes', async () => {
      const nestedDir = join(testDir, 'guides');
      await mkdir(nestedDir, { recursive: true });

      await writeFile(join(nestedDir, 'test.md'), '---\ntitle: Test\n---\n\nContent.', 'utf-8');
      await indexer.buildIndex();
      handler = createGetDocHandler(indexer);

      const result = await handler({ path: 'guides\\test.md' });

      expect(result.title).toBe('Test');
    });

    it('should handle empty file body', async () => {
      await writeFile(join(testDir, 'empty.md'), '', 'utf-8');
      await indexer.buildIndex();
      handler = createGetDocHandler(indexer);

      const result = await handler({ path: 'empty.md' });

      expect(result.title).toBe('Empty');
      expect(result.body).toBe('');
    });
  });
});
