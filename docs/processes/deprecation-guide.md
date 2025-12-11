# Deprecation Guide

## Overview

This guide details the step-by-step process for deprecating APIs in the ng-diagram library.

## Policy Summary

According to our [deprecation policy](https://www.ngdiagram.dev/docs/policies/deprecation-policy):

- Deprecated APIs are removed in the next major version
- Clear migration paths must be provided
- Deprecations must be documented in code, changelog, and docs

## Deprecation Process

### 1. Mark in Code

Add `@deprecated` JSDoc tag with:

- Reason for deprecation
- Alternative API or approach
- Version when it will be removed
- Link to migration guide (if applicable)

```typescript
/**
 * @deprecated Use {@link newMethod} instead. This method will be removed in v3.0.0.
 * See migration guide: https://ngdiagram.dev/guides/upgrading/v2-to-v3#old-method
 */
export function oldMethod() {}
```

### 2. Update Changelog

Add entry under the "Deprecated" section in `/CHANGELOG.md`:

```markdown
### Deprecated

- `OldComponent` is deprecated in favor of `NewComponent`. It will be removed in v3.0.0 ([#123](https://github.com/synergycodes/ng-diagram/pull/123))
```

### 3. Update Documentation

- Mark API as deprecated in documentation (strikethrough in API reference)
- Add deprecation notice in relevant guides
- Create or update migration guide if needed

### 4. Add Runtime Warning (Optional)

For soft deprecations, add development-mode console warning:

```typescript
if (typeof ngDevMode === 'undefined' || ngDevMode) {
  console.warn('OldComponent is deprecated and will be removed in v3.0.0. Migrate to NewComponent immediately.');
}
```

### 5. Remove in Major Version

When the deprecation period ends (next major release):

1. Remove the deprecated code
2. Add entry to changelog under "Removed" section
3. Include in breaking changes section of release notes
4. Ensure migration guide is up-to-date

## API Change Verification

Always verify your changes don't introduce unintended breaking changes:

```bash
cd packages/ng-diagram
pnpm api:check    # Verify no unexpected API changes
pnpm api:update   # Update API report if changes are intentional
```

See [API Extractor](api-extractor.md) for more details on API verification.

## Example Workflow

Here's a complete example of deprecating a component:

1. **PR #1: Introduce new API**

   ```typescript
   // Add new component
   export class NewComponent {}
   ```

2. **PR #2: Deprecate old API**

   ```typescript
   /**
    * @deprecated Use {@link NewComponent} instead. Will be removed in v3.0.0.
    */
   export class OldComponent {}
   ```

   - Update CHANGELOG.md
   - Add migration guide
   - Update API report

3. **v2.0.0 Release**
   - Include deprecation in release notes
   - Both APIs available

4. **v3.0.0 Release** (next major)
   - Remove `OldComponent`
   - Update CHANGELOG.md under "Removed"
   - Only `NewComponent` available

## Related Documentation

- [Policies](policies.md) - Overview of all product policies
- [API Extractor](api-extractor.md) - Automated breaking change detection
- [Release Process](release-process.md) - Release workflow
- [Maintaining Changelog](maintaining-changelog.md) - Changelog updates
