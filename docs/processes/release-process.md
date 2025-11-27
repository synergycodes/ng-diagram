# Release Process

## Overview

We use a single `release` branch with automated GitHub Actions to deploy documentation and publish npm packages.

## How It Works

### Release Branch

- **Documentation**: Automatically deploys when you push to `release` branch
- **NPM Package**: Automatically publishes when you create a GitHub Release (tag on `release` branch)

### Automation Workflows

| Workflow                     | Trigger                           | Action                                              |
| ---------------------------- | --------------------------------- | --------------------------------------------------- |
| `deploy-docs-production.yml` | Push to `release` branch          | Deploy docs to https://www.ngdiagram.dev/docs       |
| `publish-npm.yml`            | Git tag `v*` (via GitHub Release) | Publish to https://www.npmjs.com/package/ng-diagram |

## Release Process

### What Are You Releasing?

Choose the appropriate workflow based on your situation:

```
What are you releasing?
├─ 📦 Full release (new version) → Follow "Standard Release" below
├─ 📚 Documentation fixes only → Follow "Documentation Only" below
└─ 🔥 Urgent package fix → Follow "Package Only (Hotfix)" below
```

### Pre-Release Checklist

Complete these steps before creating a release:

- [ ] **Update CHANGELOG.md** ([guide](maintaining-changelog.md))
  - Move `[Unreleased]` changes to new version section
  - Update comparison links at bottom of file

- [ ] **Update documentation badges and versions** ([guide](maintaining-documentation.md))
  - Remove old NEW badges from previous release (if exist)
  - Add NEW badges to features introduced after last release (if needed)
  - Add version tags (`version: since vX.Y.Z`) to new features

- [ ] **Update package.json version**
  - File: `packages/ng-diagram/projects/ng-diagram/package.json`
  - Update to new version (e.g., `"version": "X.Y.Z"`)

- [ ] **Verify API Report** ([guide](api-extractor.md))
  - Run: `cd packages/ng-diagram && pnpm api:check`
  - Ensure API report matches current code
  - If changed, review for breaking changes
  - Update CHANGELOG with any breaking changes
  - For major releases: Verify all breaking changes are documented

### Standard Release

```bash
# 1. Create PR from main to release branch
# Go to: https://github.com/synergycodes/ng-diagram/compare/release...main
# - Create and merge PR (use merge commit, not squash)
# → Documentation deploys automatically when PR is merged

# 2. Verify docs at https://www.ngdiagram.dev/docs

# 3. Create GitHub Release
# Go to: https://github.com/synergycodes/ng-diagram/releases/new
# - Tag: vX.Y.Z (must match package.json version!)
# - Target: release branch
# - Title: vX.Y.Z
# - Description: Paste changelog entries from CHANGELOG.md
# - Publish release
# → NPM package publishes automatically
```

Replace `X.Y.Z` with new version number (e.g., `0.8.0`).

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
# Bump the patch version: X.Y.Z → X.Y.(Z+1)
# Example: "0.8.0" → "0.8.1"

# 3. Create PR to release branch

# 4. Create GitHub Release with new tag
# Go to: https://github.com/synergycodes/ng-diagram/releases/new
# - Tag: vX.Y.Z (new patch version)
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

- `package.json`: `"version": "X.Y.Z"`
- Git tag: `vX.Y.Z`
- GitHub Release: `vX.Y.Z`

Example: If `package.json` has `"version": "0.8.0"`, the git tag must be `v0.8.0`.

### Tag Retry

If workflow fails, you can delete and recreate tags:

```bash
# Only if npm package was NOT published!
npm view ng-diagram@X.Y.Z  # Check if version exists on npm

git tag -d vX.Y.Z                    # Delete local tag
git push origin --delete vX.Y.Z      # Delete remote tag
# Fix issue, then create release again
```

Replace `X.Y.Z` with your version number (e.g., `0.8.0`).

## Troubleshooting

### Documentation Deployment Failed

If the docs deployment workflow fails after merging to `release`:

1. **Check workflow logs**
   - Go to: [Actions tab](https://github.com/synergycodes/ng-diagram/actions)
   - Find the failed `deploy-docs-production` workflow
   - Review error logs

2. **Common issues**
   - Build errors: Fix the docs build locally first (`pnpm build:docs`)
   - Deployment errors: Usually authentication or GitHub Pages issues
   - Check Astro configuration in `apps/docs/astro.config.mjs`

3. **Resolution**
   - Fix the issue in a new branch from `release`
   - Create PR to `release` branch
   - Merge triggers automatic redeployment

### NPM Package Publish Failed

If the npm publish workflow fails after creating a GitHub Release:

1. **Check if package was published**

   ```bash
   npm view ng-diagram@X.Y.Z  # Replace with your version
   ```

2. **If NOT published:**
   - Review workflow logs in [Actions tab](https://github.com/synergycodes/ng-diagram/actions)
   - Common issues:
     - Version already exists on npm
     - Authentication token expired
     - Build or test failures
   - Fix the issue, then delete and recreate the tag (see "Tag Retry" above)

3. **If ALREADY published:**
   - You cannot republish the same version to npm
   - If there's a critical issue, publish a patch version (e.g., X.Y.Z+1)
   - Follow the hotfix process

### API Check Fails in CI

If the API check fails in a pull request:

1. **Review the API changes**

   ```bash
   cd packages/ng-diagram
   pnpm api:update
   git diff api-report/ng-diagram.api.md
   ```

2. **Determine if changes are intentional**
   - Breaking changes: Update CHANGELOG and bump major version
   - New features: Update CHANGELOG and bump minor version
   - Accidental changes: Fix your code to avoid the API change

3. **Update the API report**
   ```bash
   cd packages/ng-diagram
   pnpm api:update
   git add api-report/ng-diagram.api.md
   git commit -m "chore: update API report"
   ```

See [API Extractor](api-extractor.md) for more details.

### Merge Conflicts Between `main` and `release`

If you encounter merge conflicts when creating a PR from `main` to `release`:

1. **Resolve conflicts locally**

   ```bash
   git checkout release
   git pull origin release
   git merge main
   # Resolve conflicts
   git push origin release
   ```

2. **Or use GitHub's conflict resolution UI**
   - GitHub provides a web-based editor for simple conflicts

3. **Prevention**
   - Keep branches in sync by regularly merging hotfixes back to `main`
   - Avoid making changes directly to `release` branch

## Related Documentation

- [Maintaining the Changelog](maintaining-changelog.md) - Update CHANGELOG.md before releases
- [Maintaining Documentation](maintaining-documentation.md) - Update badges and version tags before releases
- [API Extractor](api-extractor.md) - API report verification
- [Product Policies](policies.md) - Versioning, deprecation, and API stability
