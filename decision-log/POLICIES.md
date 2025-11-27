# Product Policies

## Summary

Implemented essential product policies for public library governance:

1. **API Stability** - Semantic versioning (semver)
2. **Deprecation** - Removed after next major version
3. **Angular Support** - Current + 2 previous versions (3 total)
4. **Breaking Changes** - Automated detection via API Extractor

## Documentation

See `/apps/docs/src/content/docs/policies/`:

- `api-stability.md` - Semver and Angular support
- `deprecation-policy.md` - Deprecation process

## Tools

- **API Extractor** - Automated breaking change detection
- **CI Integration** - API report validation in PRs
- **API Report** - `/packages/ng-diagram/api-report/ng-diagram.api.md`

## Usage

### Document API Version

```typescript
/**
 * Component description
 *
 * @since v0.8.0
 */
export class MyComponent {}
```

### Deprecate API

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

Add entry under the "Deprecated" section:

```markdown
### Deprecated

- `OldComponent` is deprecated in favor of `NewComponent`. It will be removed in v3.0.0 ([#123](link))
```

### 3. Update Documentation

- Mark API as deprecated in documentation (strikethrough in API reference)
- Add deprecation notice in relevant guides
- Create or update migration guide if needed

### 4. Add Runtime Warning

For soft deprecations, add development-mode console warning:

```typescript
console.warn('OldComponent is deprecated and will be removed in v2.0.0. Migrate to NewComponent immediately.');
```

### 5. Remove in Major Version

When the deprecation period ends:

1. Remove the deprecated code
2. Add entry to changelog under "Removed" section
3. Include in breaking changes section of release notes
4. Ensure migration guide is up-to-date

### Check API Changes

```bash
cd packages/ng-diagram
pnpm api:check    # Verify no API changes
pnpm api:update   # Update API report
```

## Related

- [Release Process](./release-process.md)
- [API Extractor](./api-extractor.md)
