# Maintaining Documentation

## Overview

Documentation uses badges and version tags to indicate new features. These must be updated during each release to maintain clarity about what's new.

## Documentation Markers

### NEW Badge

Add to frontmatter when a page describes a feature introduced after the last release:

```markdown
---
title: Feature Name
description: Feature description
sidebar:
  badge: New
---
```

### Version Tag

Add to frontmatter to indicate which version introduced the feature:

```markdown
---
title: Feature Name
description: Feature description
version: X.Y.Z
---
```

Replace `X.Y.Z` with the actual version number (e.g., `0.8.0`).

The version tag displays as a badge next to the page title via the custom `PageTitle` component.

## Release Preparation Checklist

Before each release, update documentation markers to reflect the new version:

### 1. Review NEW Badges

- Find all pages with `sidebar.badge: New` in frontmatter
- Remove badges from pages describing features in the current release
- Keep badges only for features added after this release

### 2. Review Version Tags

- Ensure new features have `version: X.X.X` in frontmatter
- Use the version number being released

### 3. Update New Content

- Add `sidebar.badge: New` to pages for features added since last release
- Add `version: X.X.X` to these pages

## Technical Details

### Related Files

- Badge configuration: `apps/docs/src/content.config.ts` (schema extension)
- Version display: `apps/docs/src/components/page-title/page-title.astro`

### Future Improvements

This process may be automated in the future to reduce manual maintenance burden.

## Related Documentation

- [Release Process](release-process.md) - Complete release workflow
- [Maintaining Changelog](maintaining-changelog.md) - Update CHANGELOG.md before releases
