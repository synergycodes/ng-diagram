---
title: Deprecation Policy
description: ngDiagram's policy for deprecating and removing APIs
sidebar:
  order: 1
---

This document outlines ngDiagram's approach to deprecating and removing APIs, features, and functionality. Following a clear deprecation policy ensures you have time to migrate your code and understand when breaking changes will occur.

## Deprecation Timeline

When an API, feature, or functionality is marked as deprecated:

1. **Deprecation Notice**: The item is marked with `@deprecated` in the code and announced in the release notes
2. **Deprecation Period**: The deprecated item remains functional for a minimum of:
   - **1 major version**, OR
   - **6 months** (whichever comes first)
3. **Removal**: The deprecated item is removed only in a major version release (X.0.0)

### Example Timeline

If a feature is deprecated in version 1.2.0:

- **Deprecated in**: v1.2.0 (December 2025)
- **Still available in**: v1.x.x
- **Can be removed in**: v2.0.0 (earliest removal - after 1 major version or 6 months)

## Exceptions

Deprecation timeline may be shortened or skipped for:

1. **Security Issues**: Security vulnerabilities require immediate fixes
2. **Critical Bugs**: Bugs that cause data loss or severe functionality issues
3. **Beta/Experimental APIs**: APIs marked with `@beta` or `@experimental` (see [API Stability Policy](./api-stability))
4. **Pre-1.0 Releases**: During 0.x.x versions, breaking changes may occur more frequently

In these cases, the reason will be clearly communicated in release notes.

## Communication Channels

Deprecations are announced through:

1. **Changelog**: All deprecations listed under "Deprecated" section
2. **Release Notes**: Highlighted in GitHub releases
3. **Documentation**: Updated API reference and guides
4. **Console Warnings**: Runtime warnings in development mode
5. **TypeScript**: Type deprecation hints in IDEs

## Migration Support

For each deprecated API, we provide:

- Clear documentation of the replacement
- Migration guide for complex changes
- Timeline for removal

## Questions?

If you have questions about a specific deprecation:

1. Check the [Changelog](../changelog) for details
2. Open a [GitHub Discussion](https://github.com/angular-diagrams/ng-diagram/discussions)
