/**
 * Unit tests for DocumentationIndexer
 */

import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DocumentationIndexer } from '../src/services/indexer.js';
import type { IndexerConfig } from '../src/types/index.js';

describe('DocumentationIndexer', () => {
  const testDir = join(process.cwd(), 'tests', 'fixtures', 'test-docs');
  let indexer: DocumentationIndexer;

  beforeEach(async () => {
    // Create test directory structure
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    await rm(testDir, { recursive: true, force: true });
  });

  describe('frontmatter extraction', () => {
    it('should extract title and description from valid YAML frontmatter', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: "https://www.ngdiagram.dev",
        extensions: ['.md', '.mdx'],
      };
      indexer = new DocumentationIndexer(config);

      const content = `---
title: Test Document
description: This is a test description
---

# Content here`;

      await writeFile(join(testDir, 'test.md'), content, 'utf-8');

      const documents = await indexer.buildIndex();

      expect(documents).toHaveLength(1);
      expect(documents[0].title).toBe('Test Document');
      expect(documents[0].description).toBe('This is a test description');
    });

    it('should fallback to filename when frontmatter is missing', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: "https://www.ngdiagram.dev",
        extensions: ['.md', '.mdx'],
      };
      indexer = new DocumentationIndexer(config);

      const content = `# Just content without frontmatter`;

      await writeFile(join(testDir, 'my-test-file.md'), content, 'utf-8');

      const documents = await indexer.buildIndex();

      expect(documents).toHaveLength(1);
      expect(documents[0].title).toBe('My Test File');
      expect(documents[0].description).toBeUndefined();
    });

    it('should handle malformed YAML frontmatter gracefully', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: "https://www.ngdiagram.dev",
        extensions: ['.md', '.mdx'],
      };
      indexer = new DocumentationIndexer(config);

      const content = `---
title: Test Document
description: [invalid yaml: {
---

# Content here`;

      await writeFile(join(testDir, 'malformed.md'), content, 'utf-8');

      const documents = await indexer.buildIndex();

      expect(documents).toHaveLength(1);
      // Should fallback to filename when frontmatter parsing fails
      expect(documents[0].title).toBe('Malformed');
    });
  });

  describe('URL generation', () => {
    it('should generate URL from simple file path', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: "https://www.ngdiagram.dev",
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      await writeFile(join(testDir, 'guide.md'), '# Guide', 'utf-8');

      const documents = await indexer.buildIndex();

      expect(documents[0].url).toBe('https://www.ngdiagram.dev/docs/guide');
    });

    it('should generate URL from nested file path', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: "https://www.ngdiagram.dev",
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      const nestedDir = join(testDir, 'guides', 'advanced');
      await mkdir(nestedDir, { recursive: true });
      await writeFile(join(nestedDir, 'palette.md'), '# Palette', 'utf-8');

      const documents = await indexer.buildIndex();

      expect(documents[0].url).toBe('https://www.ngdiagram.dev/docs/guides/advanced/palette');
    });

    it('should handle index.md files correctly', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: "https://www.ngdiagram.dev",
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      await writeFile(join(testDir, 'index.md'), '# Index', 'utf-8');

      const documents = await indexer.buildIndex();

      expect(documents[0].url).toBe('https://www.ngdiagram.dev/docs');
    });

    it('should handle nested index.md files correctly', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: "https://www.ngdiagram.dev",
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      const nestedDir = join(testDir, 'guides');
      await mkdir(nestedDir, { recursive: true });
      await writeFile(join(nestedDir, 'index.md'), '# Guides Index', 'utf-8');

      const documents = await indexer.buildIndex();

      expect(documents[0].url).toBe('https://www.ngdiagram.dev/docs/guides');
    });

    it('should handle .mdx extension correctly', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: "https://www.ngdiagram.dev",
        extensions: ['.mdx'],
      };
      indexer = new DocumentationIndexer(config);

      await writeFile(join(testDir, 'component.mdx'), '# Component', 'utf-8');

      const documents = await indexer.buildIndex();

      expect(documents[0].url).toBe('https://www.ngdiagram.dev/docs/component');
    });
  });

  describe('file extension filtering', () => {
    it('should only index .md files when configured', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: "https://www.ngdiagram.dev",
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      await writeFile(join(testDir, 'doc1.md'), '# Doc 1', 'utf-8');
      await writeFile(join(testDir, 'doc2.mdx'), '# Doc 2', 'utf-8');
      await writeFile(join(testDir, 'doc3.txt'), '# Doc 3', 'utf-8');

      const documents = await indexer.buildIndex();

      expect(documents).toHaveLength(1);
      expect(documents[0].path).toBe('doc1.md');
    });

    it('should only index .mdx files when configured', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: "https://www.ngdiagram.dev",
        extensions: ['.mdx'],
      };
      indexer = new DocumentationIndexer(config);

      await writeFile(join(testDir, 'doc1.md'), '# Doc 1', 'utf-8');
      await writeFile(join(testDir, 'doc2.mdx'), '# Doc 2', 'utf-8');
      await writeFile(join(testDir, 'doc3.txt'), '# Doc 3', 'utf-8');

      const documents = await indexer.buildIndex();

      expect(documents).toHaveLength(1);
      expect(documents[0].path).toBe('doc2.mdx');
    });

    it('should index both .md and .mdx files when configured', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: "https://www.ngdiagram.dev",
        extensions: ['.md', '.mdx'],
      };
      indexer = new DocumentationIndexer(config);

      await writeFile(join(testDir, 'doc1.md'), '# Doc 1', 'utf-8');
      await writeFile(join(testDir, 'doc2.mdx'), '# Doc 2', 'utf-8');
      await writeFile(join(testDir, 'doc3.txt'), '# Doc 3', 'utf-8');

      const documents = await indexer.buildIndex();

      expect(documents).toHaveLength(2);
      const paths = documents.map((d) => d.path).sort();
      expect(paths).toEqual(['doc1.md', 'doc2.mdx']);
    });

    it('should not index files with other extensions', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: "https://www.ngdiagram.dev",
        extensions: ['.md', '.mdx'],
      };
      indexer = new DocumentationIndexer(config);

      await writeFile(join(testDir, 'readme.txt'), '# Readme', 'utf-8');
      await writeFile(join(testDir, 'config.json'), '{}', 'utf-8');
      await writeFile(join(testDir, 'script.js'), 'console.log("test")', 'utf-8');

      const documents = await indexer.buildIndex();

      expect(documents).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should handle missing documentation directory', async () => {
      const config: IndexerConfig = {
        docsPath: join(testDir, 'non-existent'),
        baseUrl: "https://www.ngdiagram.dev",
        extensions: ['.md', '.mdx'],
      };
      indexer = new DocumentationIndexer(config);

      const documents = await indexer.buildIndex();

      expect(documents).toEqual([]);
    });

    it('should skip unreadable files and continue indexing', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: "https://www.ngdiagram.dev",
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      await writeFile(join(testDir, 'good.md'), '# Good', 'utf-8');
      await writeFile(join(testDir, 'also-good.md'), '# Also Good', 'utf-8');

      const documents = await indexer.buildIndex();

      // Both files should be indexed successfully
      expect(documents).toHaveLength(2);
    });

    it('should handle empty files', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: "https://www.ngdiagram.dev",
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      await writeFile(join(testDir, 'empty.md'), '', 'utf-8');

      const documents = await indexer.buildIndex();

      expect(documents).toHaveLength(1);
      expect(documents[0].title).toBe('Empty');
      expect(documents[0].content).toBe('');
    });
  });

  describe('content preservation', () => {
    it('should preserve full document content', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: "https://www.ngdiagram.dev",
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      const content = `---
title: Full Document
---

# Heading

This is a paragraph with **bold** and *italic* text.

## Subheading

- List item 1
- List item 2

\`\`\`typescript
const code = 'example';
\`\`\`
`;

      await writeFile(join(testDir, 'full.md'), content, 'utf-8');

      const documents = await indexer.buildIndex();

      expect(documents[0].content).toBe(content);
    });
  });

  describe('recursive directory scanning', () => {
    it('should scan nested directories recursively', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: "https://www.ngdiagram.dev",
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      // Create nested structure
      await mkdir(join(testDir, 'level1', 'level2', 'level3'), { recursive: true });
      await writeFile(join(testDir, 'root.md'), '# Root', 'utf-8');
      await writeFile(join(testDir, 'level1', 'doc1.md'), '# Doc 1', 'utf-8');
      await writeFile(join(testDir, 'level1', 'level2', 'doc2.md'), '# Doc 2', 'utf-8');
      await writeFile(join(testDir, 'level1', 'level2', 'level3', 'doc3.md'), '# Doc 3', 'utf-8');

      const documents = await indexer.buildIndex();

      expect(documents).toHaveLength(4);
      const paths = documents.map((d) => d.path).sort();
      expect(paths).toContain('root.md');
      expect(paths).toContain('level1/doc1.md');
      expect(paths).toContain('level1/level2/doc2.md');
      expect(paths).toContain('level1/level2/level3/doc3.md');
    });
  });
});
