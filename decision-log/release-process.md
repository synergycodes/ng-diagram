# Release Process

## Overview

We use a single `release` branch with automated GitHub Actions to deploy documentation and publish npm packages.

## How It Works

### Release Branch

- **Documentation**: Automatically deploys when you push to `release` branch
- **NPM Package**: Automatically publishes when you create a GitHub Release (tag)

### Automation Workflows

| Workflow                     | Trigger                           | Action                                              |
| ---------------------------- | --------------------------------- | --------------------------------------------------- |
| `deploy-docs-production.yml` | Push to `release` branch          | Deploy docs to https://www.ngdiagram.dev/docs       |
| `publish-npm.yml`            | Git tag `v*` (via GitHub Release) | Publish to https://www.npmjs.com/package/ng-diagram |

## Release Process

### Before Releasing

1. **Update CHANGELOG.md** ([see guide](maintaining-changelog.md))
   - Move `[Unreleased]` changes to new version section
   - Update comparison links

2. **Update package.json version**
   - File: `packages/ng-diagram/projects/ng-diagram/package.json`
   - Example: `"version": "0.5.0"`

### Standard Release

```bash
# 1. Create PR from main to release branch
# Go to: https://github.com/synergycodes/ng-diagram/compare/release...main
# - Create and merge PR (use merge commit, not squash)
# → Documentation deploys automatically when PR is merged

# 2. Verify docs at https://www.ngdiagram.dev/docs

# 3. Create GitHub Release
# Go to: https://github.com/synergycodes/ng-diagram/releases/new
# - Tag: v0.5.0 (must match package.json version!)
# - Target: release branch
# - Title: v0.5.0
# - Description: Paste changelog entries
# - Publish release
# → NPM package publishes automatically
```

### Documentation Only

For docs fixes without package changes:

```bash
# 1. Create a feature branch from release

# 2. Make changes and push

# 3. Create PR to release branch
# - Title: "docs: fix description"
# - Base: release
# - Create and merge PR
# → Docs deploy automatically, npm NOT published
```

### Package Only (Hotfix)

For urgent package fixes on release branch:

```bash
# 1. Create a hotfix branch from release

# 2. Make fixes and update version in package.json
# Example: "version": "0.5.1" (patch version bump)

# 3. Create PR to release branch

# 4. Create GitHub Release with new tag
# Go to: https://github.com/synergycodes/ng-diagram/releases/new
# - Tag: v0.5.1
# - Target: release branch
# - Publish release
# → NPM publishes automatically

# 5. Create PR to main branch
# - Create and merge PR
# → Keeps main and release in sync
```

## Important Rules

### Branch Protection

- **Never push directly to `main` or `release` branches**
- All changes must go through Pull Requests
- This ensures code review and CI checks run before merging

### Hotfix Synchronization

When a hotfix is made to the `release` branch:

1. First, merge the hotfix PR to `release`
2. Then, cherry-pick the commit to `main` via a new PR
3. This keeps both branches in sync and prevents conflicts

### Version Sync

These must always match:

- `package.json`: `"version": "0.5.0"`
- Git tag: `v0.5.0`
- GitHub Release: `v0.5.0`

### Tag Retry

If workflow fails, you can delete and recreate tags:

```bash
# Only if npm package was NOT published!
npm view ng-diagram@0.5.0  # Check first

git tag -d v0.5.0
git push origin --delete v0.5.0
# Fix issue, then create release again
```

## Related Documentation

- [Maintaining the Changelog](maintaining-changelog.md) - Update CHANGELOG.md before releases
