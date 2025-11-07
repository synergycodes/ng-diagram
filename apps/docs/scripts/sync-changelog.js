import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const changelogPath = join(__dirname, '../../../CHANGELOG.md');
const changelogContent = readFileSync(changelogPath, 'utf-8');

// Remove the first H1 heading (Starlight will provide it from frontmatter)
const contentWithoutTitle = changelogContent.replace(/^#\s+Changelog\n\n/, '');

// Create the MDX file with frontmatter
const mdxContent = `---
title: Changelog
description: All notable changes to NgDiagram
---

{/* This file is auto-generated during build from /CHANGELOG.md - Do not edit manually */}

${contentWithoutTitle}`;

const outputPath = join(__dirname, '../src/content/docs/changelog.mdx');
writeFileSync(outputPath, mdxContent, 'utf-8');

console.log('✅ Changelog synced successfully!');
