# Maintaining the Changelog

## Quick Start

Edit `/CHANGELOG.md` at the repository root. The documentation automatically syncs during build.

> **Important:** Never edit `/apps/docs/src/content/docs/changelog.mdx` - it's auto-generated.

## Adding Changes

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

## Release Process

> **See also:** [Release Process](release-process.md) - Automated release workflow

1. **Move unreleased changes** to new version section:

```markdown
## [0.5.0] - 2025-11-01

### Added

- Your changes here
```

2. **Update links** at bottom:

```markdown
[unreleased]: https://github.com/synergycodes/ng-diagram/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/synergycodes/ng-diagram/compare/v0.4.0...v0.5.0
```

3. **Continue with automated release** - See [Release Automation](release-automation.md) for next steps

## Category Guide

| Category       | Use For                   |
| -------------- | ------------------------- |
| **Added**      | New features              |
| **Changed**    | Modified features         |
| **Fixed**      | Bug fixes                 |
| **Removed**    | Deleted features          |
| **Deprecated** | Features being phased out |
| **Security**   | Security fixes            |

## Versioning

Follow [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes → `0.4.0` → `1.0.0`
- **MINOR**: New features → `0.4.0` → `0.5.0`
- **PATCH**: Bug fixes → `0.4.0` → `0.4.1`

## References

- [Keep a Changelog](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)
