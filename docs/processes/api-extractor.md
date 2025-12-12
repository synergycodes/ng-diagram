# API Extractor Integration

## Overview

API Extractor automatically detects breaking changes in the public API by comparing the current API surface with a committed report file. This ensures that breaking changes are intentional and documented.

## Quick Start

```bash
cd packages/ng-diagram

# After making API changes
pnpm api:update              # Build and update API report
git diff api-report/ng-diagram.api.md  # Review changes
git add api-report/ng-diagram.api.md   # Commit with your code changes
```

## Available Commands

```bash
pnpm api:report  # Generate API report
pnpm api:check   # Verify API matches report (CI mode)
pnpm api:update  # Build + update API report
```

## Configuration

- **Config File**: `packages/ng-diagram/api-extractor.json`
- **API Report**: `packages/ng-diagram/api-report/ng-diagram.api.md`
- **CI Integration**: `.github/workflows/pr-check.yml`

## Workflow

1. Make API changes
2. Run `pnpm api:update`
3. Review `git diff api-report/ng-diagram.api.md`
4. Commit code + API report together
5. CI automatically verifies API report matches

## Notes

- `i0`, `i1`, `i2` namespaces = Angular internals (ignore them)
- `ɵɵ` symbols = Angular internal metadata (ignore them)
- Focus on your actual exported APIs

## Related

- [Policies](./policies.md)
- [Release Process](./release-process.md)
