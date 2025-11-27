# Development Processes

This folder contains documentation for maintaining and releasing the ng-diagram library.

## Quick Navigation

**I want to...**

- 📦 **Release a new version** → Start with [Release Process](release-process.md)
- 📝 **Update the changelog** → See [Maintaining Changelog](maintaining-changelog.md)
- 📚 **Update documentation badges** → See [Maintaining Documentation](maintaining-documentation.md)
- 🔍 **Check for API breaking changes** → See [API Extractor](api-extractor.md)
- ⚠️ **Deprecate an API** → See [Deprecation Guide](deprecation-guide.md)
- 📋 **Understand our policies** → See [Policies](policies.md)

## Documents Overview

### Core Release Workflow

| Document                                                  | Purpose                                   | When to Use                    |
| --------------------------------------------------------- | ----------------------------------------- | ------------------------------ |
| [Release Process](release-process.md)                     | Complete release workflow with automation | Before every release or hotfix |
| [Maintaining Changelog](maintaining-changelog.md)         | How to update CHANGELOG.md                | When adding features or fixes  |
| [Maintaining Documentation](maintaining-documentation.md) | How to manage NEW badges and version tags | Before each release            |

### API Management

| Document                                  | Purpose                                             | When to Use                               |
| ----------------------------------------- | --------------------------------------------------- | ----------------------------------------- |
| [API Extractor](api-extractor.md)         | Automated breaking change detection                 | When making public API changes            |
| [Policies](policies.md)                   | API stability, deprecation, and versioning policies | When planning API changes or deprecations |
| [Deprecation Guide](deprecation-guide.md) | Step-by-step deprecation workflow                   | When deprecating an API                   |

## Typical Release Checklist

Before releasing a new version, follow this order:

1. ✅ Update [CHANGELOG.md](maintaining-changelog.md)
2. ✅ Update [documentation badges and versions](maintaining-documentation.md)
3. ✅ Update package.json version
4. ✅ [Verify API report](api-extractor.md)
5. ✅ Follow [release process](release-process.md)
