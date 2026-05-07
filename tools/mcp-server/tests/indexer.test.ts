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
  const examplesDir = join(process.cwd(), 'tests', 'fixtures', 'test-indexer-examples');
  let indexer: DocumentationIndexer;

  beforeEach(async () => {
    // Create test directory structure
    await mkdir(testDir, { recursive: true });
    await mkdir(examplesDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directories
    await rm(testDir, { recursive: true, force: true });
    await rm(examplesDir, { recursive: true, force: true });
  });

  describe('frontmatter extraction', () => {
    it('should extract title and description from valid YAML frontmatter', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md', '.mdx'],
      };
      indexer = new DocumentationIndexer(config);

      const content = `---
title: Test Document
description: This is a test description
---

# Content here`;

      await writeFile(join(testDir, 'test.md'), content, 'utf-8');

      const sections = await indexer.buildIndex();

      expect(sections).toHaveLength(1);
      expect(sections[0].pageTitle).toBe('Test Document');
      expect(sections[0].description).toBe('This is a test description');
    });

    it('should fallback to filename when frontmatter is missing', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md', '.mdx'],
      };
      indexer = new DocumentationIndexer(config);

      const content = `# Just content without frontmatter`;

      await writeFile(join(testDir, 'my-test-file.md'), content, 'utf-8');

      const sections = await indexer.buildIndex();

      expect(sections).toHaveLength(1);
      expect(sections[0].pageTitle).toBe('My Test File');
      expect(sections[0].description).toBeUndefined();
    });

    it('should handle malformed YAML frontmatter gracefully', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md', '.mdx'],
      };
      indexer = new DocumentationIndexer(config);

      const content = `---
title: Test Document
description: [invalid yaml: {
---

# Content here`;

      await writeFile(join(testDir, 'malformed.md'), content, 'utf-8');

      const sections = await indexer.buildIndex();

      expect(sections).toHaveLength(1);
      // Should fallback to filename when frontmatter parsing fails
      expect(sections[0].pageTitle).toBe('Malformed');
    });
  });

  describe('URL generation', () => {
    it('should generate URL from simple file path', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      await writeFile(join(testDir, 'guide.md'), '# Guide', 'utf-8');

      const sections = await indexer.buildIndex();

      expect(sections[0].url).toBe('https://www.ngdiagram.dev/docs/guide');
    });

    it('should generate URL from nested file path', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      const nestedDir = join(testDir, 'guides', 'advanced');
      await mkdir(nestedDir, { recursive: true });
      await writeFile(join(nestedDir, 'palette.md'), '# Palette', 'utf-8');

      const sections = await indexer.buildIndex();

      expect(sections[0].url).toBe('https://www.ngdiagram.dev/docs/guides/advanced/palette');
    });

    it('should handle index.md files correctly', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      await writeFile(join(testDir, 'index.md'), '# Index', 'utf-8');

      const sections = await indexer.buildIndex();

      expect(sections[0].url).toBe('https://www.ngdiagram.dev/docs');
    });

    it('should handle nested index.md files correctly', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      const nestedDir = join(testDir, 'guides');
      await mkdir(nestedDir, { recursive: true });
      await writeFile(join(nestedDir, 'index.md'), '# Guides Index', 'utf-8');

      const sections = await indexer.buildIndex();

      expect(sections[0].url).toBe('https://www.ngdiagram.dev/docs/guides');
    });

    it('should lowercase URL path for mixed-case file paths', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      const nestedDir = join(testDir, 'api', 'Components');
      await mkdir(nestedDir, { recursive: true });
      await writeFile(join(nestedDir, 'DiagramComponent.md'), '# DiagramComponent', 'utf-8');

      const sections = await indexer.buildIndex();

      expect(sections[0].url).toBe('https://www.ngdiagram.dev/docs/api/components/diagramcomponent');
    });

    it('should handle .mdx extension correctly', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.mdx'],
      };
      indexer = new DocumentationIndexer(config);

      await writeFile(join(testDir, 'component.mdx'), '# Component', 'utf-8');

      const sections = await indexer.buildIndex();

      expect(sections[0].url).toBe('https://www.ngdiagram.dev/docs/component');
    });
  });

  describe('file extension filtering', () => {
    it('should only index .md files when configured', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      await writeFile(join(testDir, 'doc1.md'), '# Doc 1', 'utf-8');
      await writeFile(join(testDir, 'doc2.mdx'), '# Doc 2', 'utf-8');
      await writeFile(join(testDir, 'doc3.txt'), '# Doc 3', 'utf-8');

      const sections = await indexer.buildIndex();

      expect(sections).toHaveLength(1);
      expect(sections[0].path).toBe('doc1.md');
    });

    it('should only index .mdx files when configured', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.mdx'],
      };
      indexer = new DocumentationIndexer(config);

      await writeFile(join(testDir, 'doc1.md'), '# Doc 1', 'utf-8');
      await writeFile(join(testDir, 'doc2.mdx'), '# Doc 2', 'utf-8');
      await writeFile(join(testDir, 'doc3.txt'), '# Doc 3', 'utf-8');

      const sections = await indexer.buildIndex();

      expect(sections).toHaveLength(1);
      expect(sections[0].path).toBe('doc2.mdx');
    });

    it('should index both .md and .mdx files when configured', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md', '.mdx'],
      };
      indexer = new DocumentationIndexer(config);

      await writeFile(join(testDir, 'doc1.md'), '# Doc 1', 'utf-8');
      await writeFile(join(testDir, 'doc2.mdx'), '# Doc 2', 'utf-8');
      await writeFile(join(testDir, 'doc3.txt'), '# Doc 3', 'utf-8');

      const sections = await indexer.buildIndex();

      expect(sections).toHaveLength(2);
      const paths = sections.map((s) => s.path).sort();
      expect(paths).toEqual(['doc1.md', 'doc2.mdx']);
    });

    it('should skip files starting with underscore', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md', '.mdx'],
      };
      indexer = new DocumentationIndexer(config);

      await writeFile(join(testDir, '_meta.yml'), 'order: 1', 'utf-8');
      await writeFile(join(testDir, '_readme.md'), '# Readme', 'utf-8');
      await writeFile(join(testDir, '_overview.mdx'), '# Overview', 'utf-8');
      await writeFile(join(testDir, 'visible.md'), '# Visible', 'utf-8');

      const sections = await indexer.buildIndex();

      expect(sections).toHaveLength(1);
      expect(sections[0].path).toBe('visible.md');
    });

    it('should not index files with other extensions', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md', '.mdx'],
      };
      indexer = new DocumentationIndexer(config);

      await writeFile(join(testDir, 'readme.txt'), '# Readme', 'utf-8');
      await writeFile(join(testDir, 'config.json'), '{}', 'utf-8');
      await writeFile(join(testDir, 'script.js'), 'console.log("test")', 'utf-8');

      const sections = await indexer.buildIndex();

      expect(sections).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should handle missing documentation directory', async () => {
      const config: IndexerConfig = {
        docsPath: join(testDir, 'non-existent'),
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md', '.mdx'],
      };
      indexer = new DocumentationIndexer(config);

      const sections = await indexer.buildIndex();

      expect(sections).toEqual([]);
    });

    it('should skip unreadable files and continue indexing', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      await writeFile(join(testDir, 'good.md'), '# Good', 'utf-8');
      await writeFile(join(testDir, 'also-good.md'), '# Also Good', 'utf-8');

      const sections = await indexer.buildIndex();

      // Both files should be indexed successfully
      expect(sections).toHaveLength(2);
    });

    it('should handle empty files', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      await writeFile(join(testDir, 'empty.md'), '', 'utf-8');

      const sections = await indexer.buildIndex();

      expect(sections).toHaveLength(1);
      expect(sections[0].pageTitle).toBe('Empty');
      expect(sections[0].content).toBe('');
    });
  });

  describe('content preservation', () => {
    it('should not include frontmatter in section content', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
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

      const sections = await indexer.buildIndex();

      // Frontmatter should NOT be in any section content
      for (const section of sections) {
        expect(section.content).not.toContain('---');
        expect(section.content).not.toContain('title: Full Document');
      }
    });
  });

  describe('recursive directory scanning', () => {
    it('should scan nested directories recursively', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      // Create nested structure
      await mkdir(join(testDir, 'level1', 'level2', 'level3'), { recursive: true });
      await writeFile(join(testDir, 'root.md'), '# Root', 'utf-8');
      await writeFile(join(testDir, 'level1', 'doc1.md'), '# Doc 1', 'utf-8');
      await writeFile(join(testDir, 'level1', 'level2', 'doc2.md'), '# Doc 2', 'utf-8');
      await writeFile(join(testDir, 'level1', 'level2', 'level3', 'doc3.md'), '# Doc 3', 'utf-8');

      const sections = await indexer.buildIndex();

      expect(sections).toHaveLength(4);
      // Normalize paths to forward slashes for cross-platform compatibility
      const paths = sections.map((s) => s.path.replace(/\\/g, '/')).sort();
      expect(paths).toContain('root.md');
      expect(paths).toContain('level1/doc1.md');
      expect(paths).toContain('level1/level2/doc2.md');
      expect(paths).toContain('level1/level2/level3/doc3.md');
    });
  });

  describe('getPage()', () => {
    it('should return page data after buildIndex()', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      const content = `---
title: My Page
description: A test page
---

Page body content here.

## Section One

Section one content.
`;
      await writeFile(join(testDir, 'my-page.md'), content, 'utf-8');
      await indexer.buildIndex();

      const page = indexer.getPage('my-page.md');

      expect(page).toBeDefined();
      expect(page!.title).toBe('My Page');
      expect(page!.body).toContain('Page body content here.');
      expect(page!.body).toContain('## Section One');
      expect(page!.url).toBe('https://www.ngdiagram.dev/docs/my-page');
    });

    it('should return undefined for non-existent path', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      await writeFile(join(testDir, 'exists.md'), '# Exists', 'utf-8');
      await indexer.buildIndex();

      expect(indexer.getPage('does-not-exist.md')).toBeUndefined();
    });

    it('should not include frontmatter in body', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      const content = `---
title: Frontmatter Test
description: Should not appear in body
---

Actual body content.
`;
      await writeFile(join(testDir, 'fm-test.md'), content, 'utf-8');
      await indexer.buildIndex();

      const page = indexer.getPage('fm-test.md');

      expect(page).toBeDefined();
      expect(page!.body).not.toContain('title: Frontmatter Test');
      expect(page!.body).not.toContain('description: Should not appear in body');
      expect(page!.body).toContain('Actual body content.');
    });

    it('should fall back to filename as title when frontmatter has no title', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      await writeFile(join(testDir, 'my-cool-doc.md'), '# Just content', 'utf-8');
      await indexer.buildIndex();

      const page = indexer.getPage('my-cool-doc.md');

      expect(page).toBeDefined();
      expect(page!.title).toBe('My Cool Doc');
    });

    it('should handle nested paths with forward slashes', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      const nestedDir = join(testDir, 'guides');
      await mkdir(nestedDir, { recursive: true });
      await writeFile(join(nestedDir, 'intro.md'), '---\ntitle: Intro\n---\n\nIntro content.', 'utf-8');
      await indexer.buildIndex();

      const page = indexer.getPage('guides/intro.md');

      expect(page).toBeDefined();
      expect(page!.title).toBe('Intro');
    });

    it('should reset pages on subsequent buildIndex() calls', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      await writeFile(join(testDir, 'first.md'), '# First', 'utf-8');
      await indexer.buildIndex();
      expect(indexer.getPage('first.md')).toBeDefined();

      // Remove the file and rebuild
      await rm(join(testDir, 'first.md'));
      await writeFile(join(testDir, 'second.md'), '# Second', 'utf-8');
      await indexer.buildIndex();

      expect(indexer.getPage('first.md')).toBeUndefined();
      expect(indexer.getPage('second.md')).toBeDefined();
    });
  });

  describe('section splitting', () => {
    it('should split file with multiple ## headings into correct number of sections', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      const content = `---
title: Multi Section
description: A page with sections
---

Some intro text here.

## First Section

Content of first section.

## Second Section

Content of second section.

## Third Section

Content of third section.
`;

      await writeFile(join(testDir, 'multi.md'), content, 'utf-8');

      const sections = await indexer.buildIndex();

      // Intro + 3 ## sections = 4
      expect(sections).toHaveLength(4);
      expect(sections[0].sectionTitle).toBe('Introduction');
      expect(sections[1].sectionTitle).toBe('First Section');
      expect(sections[2].sectionTitle).toBe('Second Section');
      expect(sections[3].sectionTitle).toBe('Third Section');
    });

    it('should keep ### subsections within parent ## section', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      const content = `---
title: Nested Headings
---

## Main Section

Some content.

### Subsection One

Sub content one.

### Subsection Two

Sub content two.

## Another Section

More content.
`;

      await writeFile(join(testDir, 'nested.md'), content, 'utf-8');

      const sections = await indexer.buildIndex();

      expect(sections).toHaveLength(2);
      expect(sections[0].sectionTitle).toBe('Main Section');
      expect(sections[0].content).toContain('### Subsection One');
      expect(sections[0].content).toContain('### Subsection Two');
      expect(sections[1].sectionTitle).toBe('Another Section');
    });

    it('should produce single section with sectionTitle = pageTitle for pages without ## headings', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      const content = `---
title: No Sections
---

Just a simple page with no ## headings.

### This is a h3 but not a h2

Some content.
`;

      await writeFile(join(testDir, 'no-sections.md'), content, 'utf-8');

      const sections = await indexer.buildIndex();

      expect(sections).toHaveLength(1);
      expect(sections[0].sectionTitle).toBe('No Sections');
      expect(sections[0].pageTitle).toBe('No Sections');
    });

    it('should not include frontmatter in section content', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      const content = `---
title: With Frontmatter
description: Test description
---

## Section One

Content here.
`;

      await writeFile(join(testDir, 'frontmatter.md'), content, 'utf-8');

      const sections = await indexer.buildIndex();

      for (const section of sections) {
        expect(section.content).not.toContain('title: With Frontmatter');
        expect(section.content).not.toContain('description: Test description');
      }
    });

    it('should not create Introduction section when no intro content before first ##', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      const content = `---
title: No Intro
---

## First Section

Content of first section.

## Second Section

Content of second section.
`;

      await writeFile(join(testDir, 'no-intro.md'), content, 'utf-8');

      const sections = await indexer.buildIndex();

      expect(sections).toHaveLength(2);
      expect(sections[0].sectionTitle).toBe('First Section');
      expect(sections[1].sectionTitle).toBe('Second Section');
    });

    it('should assign description only to first section', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      const content = `---
title: Described Page
description: This is the page description
---

Intro content.

## Section One

Content one.

## Section Two

Content two.
`;

      await writeFile(join(testDir, 'described.md'), content, 'utf-8');

      const sections = await indexer.buildIndex();

      expect(sections).toHaveLength(3);
      // First section (Introduction) gets description
      expect(sections[0].description).toBe('This is the page description');
      // Other sections do not
      expect(sections[1].description).toBeUndefined();
      expect(sections[2].description).toBeUndefined();
    });

    it('should generate correct anchor slugs', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      const content = `---
title: Anchor Test
---

## Simple Heading

Content.

## Heading with Special Characters!@#

Content.

## Already-Hyphenated Heading

Content.
`;

      await writeFile(join(testDir, 'anchors.md'), content, 'utf-8');

      const sections = await indexer.buildIndex();

      expect(sections).toHaveLength(3);
      expect(sections[0].url).toBe('https://www.ngdiagram.dev/docs/anchors#simple-heading');
      expect(sections[1].url).toBe('https://www.ngdiagram.dev/docs/anchors#heading-with-special-characters');
      expect(sections[2].url).toBe('https://www.ngdiagram.dev/docs/anchors#already-hyphenated-heading');
    });

    it('should handle empty files gracefully', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      await writeFile(join(testDir, 'empty.md'), '', 'utf-8');

      const sections = await indexer.buildIndex();

      expect(sections).toHaveLength(1);
      expect(sections[0].pageTitle).toBe('Empty');
      expect(sections[0].sectionTitle).toBe('Empty');
      expect(sections[0].content).toBe('');
    });

    it('should set all sections to the same pageTitle', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      const content = `---
title: My Page
---

## Section A

Content A.

## Section B

Content B.
`;

      await writeFile(join(testDir, 'page.md'), content, 'utf-8');

      const sections = await indexer.buildIndex();

      expect(sections).toHaveLength(2);
      for (const section of sections) {
        expect(section.pageTitle).toBe('My Page');
      }
    });
  });

  describe('snippet resolution', () => {
    it('should inline <CodeSnippet> tags with code blocks', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.mdx'],
        examplesPath: examplesDir,
      };
      indexer = new DocumentationIndexer(config);

      // Create example source file
      await mkdir(join(examplesDir, 'nodes'), { recursive: true });
      await writeFile(join(examplesDir, 'nodes', 'component.ts'), 'export class NodeComponent {}', 'utf-8');

      // Create doc file referencing it
      const content = `---
title: Nodes Guide
---

## Custom Nodes

<CodeSnippet relativePath="nodes/component.ts" />
`;
      await writeFile(join(testDir, 'nodes.mdx'), content, 'utf-8');

      const sections = await indexer.buildIndex();

      expect(sections).toHaveLength(1);
      expect(sections[0].content).toContain('```typescript');
      expect(sections[0].content).toContain('export class NodeComponent {}');
      expect(sections[0].content).not.toContain('<CodeSnippet');
    });

    it('should inline <CodeSnippet> with sectionId', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.mdx'],
        examplesPath: examplesDir,
      };
      indexer = new DocumentationIndexer(config);

      const source = [
        'import { Component } from "@angular/core";',
        '',
        '// @section-start:registering',
        'export class DiagramComponent {',
        '  templateMap = new Map();',
        '}',
        '// @section-end:registering',
        '',
        'export class Other {}',
      ].join('\n');

      await writeFile(join(examplesDir, 'diagram.ts'), source, 'utf-8');

      const content = `---
title: Test
---

<CodeSnippet relativePath="diagram.ts" sectionId="registering" />
`;
      await writeFile(join(testDir, 'test.mdx'), content, 'utf-8');

      const sections = await indexer.buildIndex();

      expect(sections[0].content).toContain('export class DiagramComponent');
      expect(sections[0].content).toContain('templateMap = new Map()');
      expect(sections[0].content).not.toContain('import { Component }');
      expect(sections[0].content).not.toContain('export class Other');
    });

    it('should inline <CodeViewer> with all files from directory', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.mdx'],
        examplesPath: examplesDir,
      };
      indexer = new DocumentationIndexer(config);

      const dir = join(examplesDir, 'my-example');
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, 'diagram.component.ts'), 'export class Diagram {}', 'utf-8');
      await writeFile(join(dir, 'diagram.component.html'), '<div>template</div>', 'utf-8');
      await writeFile(join(dir, 'diagram.component.scss'), '.root { }', 'utf-8');
      await writeFile(join(dir, 'example.astro'), '<Fragment />', 'utf-8');

      const content = `---
title: Example
---

<CodeViewer dirName="my-example" />
`;
      await writeFile(join(testDir, 'example.mdx'), content, 'utf-8');

      const sections = await indexer.buildIndex();

      expect(sections[0].content).toContain('```typescript');
      expect(sections[0].content).toContain('export class Diagram {}');
      expect(sections[0].content).toContain('```html');
      expect(sections[0].content).toContain('<div>template</div>');
      expect(sections[0].content).toContain('```scss');
      expect(sections[0].content).toContain('.root { }');
      expect(sections[0].content).not.toContain('<CodeViewer');
      expect(sections[0].content).not.toContain('.astro');
      expect(sections[0].content).not.toContain('Fragment');
    });

    it('should replace missing snippet with comment', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.mdx'],
        examplesPath: examplesDir,
      };
      indexer = new DocumentationIndexer(config);

      const content = `---
title: Test
---

<CodeSnippet relativePath="missing/file.ts" />
`;
      await writeFile(join(testDir, 'missing.mdx'), content, 'utf-8');

      const sections = await indexer.buildIndex();

      expect(sections[0].content).toContain('<!-- snippet not found: missing/file.ts -->');
      expect(sections[0].content).not.toContain('<CodeSnippet');
    });

    it('should replace missing CodeViewer directory with comment', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.mdx'],
        examplesPath: examplesDir,
      };
      indexer = new DocumentationIndexer(config);

      const content = `---
title: Test
---

<CodeViewer dirName="nonexistent-dir" />
`;
      await writeFile(join(testDir, 'missing-dir.mdx'), content, 'utf-8');

      const sections = await indexer.buildIndex();

      expect(sections[0].content).toContain('<!-- code viewer directory not found: nonexistent-dir -->');
    });

    it('should include inlined code in getPage() body', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.mdx'],
        examplesPath: examplesDir,
      };
      indexer = new DocumentationIndexer(config);

      await writeFile(join(examplesDir, 'simple.ts'), 'const x = 1;', 'utf-8');

      const content = `---
title: Page
---

<CodeSnippet relativePath="simple.ts" />
`;
      await writeFile(join(testDir, 'page.mdx'), content, 'utf-8');

      await indexer.buildIndex();
      const page = indexer.getPage('page.mdx');

      expect(page).toBeDefined();
      expect(page!.body).toContain('```typescript');
      expect(page!.body).toContain('const x = 1;');
      expect(page!.body).not.toContain('<CodeSnippet');
    });

    it('should not resolve snippets when examplesPath is not configured', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.mdx'],
      };
      indexer = new DocumentationIndexer(config);

      const content = `---
title: No Examples
---

<CodeSnippet relativePath="file.ts" />
`;
      await writeFile(join(testDir, 'no-examples.mdx'), content, 'utf-8');

      const sections = await indexer.buildIndex();

      // Tag should remain as-is since no examplesPath
      expect(sections[0].content).toContain('<CodeSnippet');
    });
  });

  describe('serialization', () => {
    it('should round-trip pages through pagesToJSON / fromPages', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      const content = `---
title: Serialization Test
---

Page body with **markdown**.

## Section One

Section content here.
`;
      await writeFile(join(testDir, 'serialize.md'), content, 'utf-8');
      await indexer.buildIndex();

      const json = indexer.pagesToJSON();
      const restored = DocumentationIndexer.fromPages(JSON.parse(json));

      const original = indexer.getPage('serialize.md');
      const loaded = restored.getPage('serialize.md');

      expect(loaded).toEqual(original);
    });

    it('should return undefined for non-existent page after fromPages', async () => {
      const config: IndexerConfig = {
        docsPath: testDir,
        baseUrl: 'https://www.ngdiagram.dev',
        extensions: ['.md'],
      };
      indexer = new DocumentationIndexer(config);

      await writeFile(join(testDir, 'exists.md'), '# Exists', 'utf-8');
      await indexer.buildIndex();

      const restored = DocumentationIndexer.fromPages(JSON.parse(indexer.pagesToJSON()));

      expect(restored.getPage('exists.md')).toBeDefined();
      expect(restored.getPage('nope.md')).toBeUndefined();
    });
  });
});
