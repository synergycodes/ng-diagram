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
version: since v0.5.0
---
```

The version tag displays as a badge next to the page title via the custom `PageTitle` component.

## Before Each Release

1. **Review all NEW badges**
   - Find pages with `sidebar.badge: New`
   - Remove badges from pages describing features in the current release
   - Keep badges only for features added after this release

2. **Review version tags**
   - Ensure new features have `version: since vX.X.X` in frontmatter
   - Use the version number being released

3. **Update new content**
   - Add `sidebar.badge: New` to pages for features added since last release
   - Add `version: since vX.X.X` to these pages

## Related Files

- Badge configuration: `apps/docs/src/content.config.ts` (schema extension)
- Version display: `apps/docs/src/components/page-title/page-title.astro`

## Future Automation

This process will be automated in the future to reduce manual maintenance burden.

## Related Documentation

- [Release Process](release-process.md) - Overall release workflow
- [Maintaining the Changelog](maintaining-changelog.md) - Update CHANGELOG.md before releases
