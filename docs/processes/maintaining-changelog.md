# Maintaining the Changelog

## Overview

The project follows [Keep a Changelog](https://keepachangelog.com/) format. All changes are tracked in `/CHANGELOG.md` at the repository root, which automatically syncs to documentation during build.

> **Important:** Never edit `/apps/docs/src/content/docs/changelog.mdx` - it's auto-generated.

## Quick Start

Add your changes under the `[Unreleased]` section:

```markdown
## [Unreleased]

### Added

- Your new feature here ([#123](https://github.com/synergycodes/ng-diagram/pull/123))
```

## Adding Changes During Development

All changes go under `[Unreleased]` section:

```markdown
## [Unreleased]

### Added

- New features

### Changed

- Modifications to existing features

### Fixed

- Bug fixes

### Removed

- Deleted features
```

## Writing Entries

**Good:**

```markdown
- Fixed `NgDiagramModelService.addEdges` not redrawing diagram ([#369](https://github.com/synergycodes/ng-diagram/pull/369))
- Added environment layer for unified environment functionality ([#350](https://github.com/synergycodes/ng-diagram/pull/350))
```

**Bad:**

```markdown
- Updated stuff
- Bug fixes
```

**Format:**

- Start with verb (Added, Fixed, Changed)
- Be specific
- Link to PR: `([#123](https://github.com/org/repo/pull/123))`

## Preparing for Release

> **See also:** [Release Process](release-process.md) for the complete release workflow

When preparing a release, move unreleased changes to a new version section:

### 1. Move Unreleased Changes

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added

- Your changes here
```

Replace `X.Y.Z` with the new version number (e.g., `0.8.0`) and `YYYY-MM-DD` with the release date.

### 2. Update Comparison Links

```markdown
[unreleased]: https://github.com/synergycodes/ng-diagram/compare/vX.Y.Z...HEAD
[X.Y.Z]: https://github.com/synergycodes/ng-diagram/compare/vPREV...vX.Y.Z
```

Replace `X.Y.Z` with the new version and `PREV` with the previous version.

### 3. Continue with Release

See [Release Process](release-process.md) for the complete release workflow.

## Category Guide

| Category          | Use For                   |
| ----------------- | ------------------------- |
| **✨ Added**      | New features              |
| **🧩 Changed**    | Modified features         |
| **🐛 Fixed**      | Bug fixes                 |
| **🗑️ Removed**    | Deleted features          |
| **⚠️ Deprecated** | Features being phased out |
| **🔒 Security**   | Security fixes            |

## Versioning Reference

Follow [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

| Change Type | Version Bump                        | Example           |
| ----------- | ----------------------------------- | ----------------- |
| **MAJOR**   | Breaking changes                    | `1.0.0` → `2.0.0` |
| **MINOR**   | New features (backwards compatible) | `1.0.0` → `1.1.0` |
| **PATCH**   | Bug fixes (backwards compatible)    | `1.0.0` → `1.0.1` |

See [Policies](policies.md) for complete API stability policies.

## Related Documentation

- [Release Process](release-process.md) - Complete release workflow
- [Policies](policies.md) - API stability and versioning policies
- [Keep a Changelog](https://keepachangelog.com/) - Changelog format specification
- [Semantic Versioning](https://semver.org/) - Version numbering specification
