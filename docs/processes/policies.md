# Product Policies

## Overview

This document summarizes the essential product policies for ng-diagram library governance.

## Policy Summary

### 1. API Stability

- Follow **Semantic Versioning (semver)**: `MAJOR.MINOR.PATCH`
- Breaking changes only in major versions
- New features in minor versions
- Bug fixes in patch versions

See [API Stability Policy](https://www.ngdiagram.dev/docs/policies/api-stability) for full details.

### 2. Deprecation Policy

- Deprecated APIs are removed after the next major version
- Clear migration paths must be provided
- All deprecations must be documented

See [Deprecation Policy](https://www.ngdiagram.dev/docs/policies/deprecation-policy) and [Deprecation Guide](deprecation-guide.md) for implementation details.

### 3. Angular Support

- Support current Angular version + 2 previous versions (3 total)
- Example: If current is v18, we support v16, v17, v18

### 4. Breaking Change Detection

- Automated via **API Extractor**
- API report validation in CI/CD
- Required for all PRs

See [API Extractor](api-extractor.md) for usage details.

## Quick Reference

### Document API Version

Add `@since` tag to indicate when an API was introduced:

```typescript
/**
 * Component description
 *
 * @since vX.Y.Z
 */
export class MyComponent {}
```

Replace `X.Y.Z` with the actual version where the API was introduced (e.g., `v0.8.0`).

### Deprecate an API

For detailed step-by-step instructions, see [Deprecation Guide](deprecation-guide.md).

Quick summary:

1. Add `@deprecated` JSDoc tag with migration path
2. Update CHANGELOG.md
3. Update documentation
4. (Optional) Add runtime warning
5. Remove in next major version

### Verify API Changes

```bash
cd packages/ng-diagram
pnpm api:check    # Verify no unexpected API changes
pnpm api:update   # Update API report
```

## Tools and Configuration

- **API Extractor Config**: `packages/ng-diagram/api-extractor.json`
- **API Report**: `packages/ng-diagram/api-report/ng-diagram.api.md`
- **CI Integration**: `.github/workflows/pr-check.yml`
- **Public Policies**: `/apps/docs/src/content/docs/policies/`

## Related Documentation

- [Deprecation Guide](deprecation-guide.md) - Detailed deprecation workflow
- [API Extractor](api-extractor.md) - Breaking change detection
- [Release Process](release-process.md) - Release workflow
- [Maintaining Changelog](maintaining-changelog.md) - Changelog updates
