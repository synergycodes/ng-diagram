---
title: API Stability
description: API stability levels and Angular version support for ngDiagram
sidebar:
  order: 1
---

This document outlines ngDiagram's API stability levels and version support policy. Understanding these stability levels helps you make informed decisions about which APIs to use in production and plan for future upgrades.

## API Stability Levels

ngDiagram uses TSDoc tags to indicate API stability:

| Tag             | Level    | Breaking Changes                 | Migration Support | Production Use      |
| --------------- | -------- | -------------------------------- | ----------------- | ------------------- |
| `@public`       | Stable   | Only in major versions           | Yes, guaranteed   | ✅ Safe             |
| `@beta`         | Preview  | Possible in minor versions       | Yes, provided     | ⚠️ Use with caution |
| `@experimental` | Unstable | May change or be removed anytime | Not guaranteed    | ❌ Testing only     |
| `@internal`     | Private  | May change without notice        | No                | ❌ Do not use       |

**Note**: APIs without tags are treated as `@beta` before v1.0, and `@public` after v1.0.

## Angular Version Support

ngDiagram follows Angular's official support policy:

**Supported Versions**: Current Angular version + 2 previous major versions (3 versions total)

### Current Support

| Angular Version | ngDiagram Support | Angular EOL |
| --------------- | ----------------- | ----------- |
| Angular 20      | ✅ Supported      | Nov 2026    |
| Angular 19      | ✅ Supported      | May 2026    |
| Angular 18      | ✅ Supported      | Nov 2025    |
| Angular 17      | ⚠️ Not tested     | May 2025    |

**Current Requirement**: Angular 18.0.0+

### Support Timeline

When a new Angular version releases:

- Added to ngDiagram within 2 months
- Oldest supported version deprecated
- Deprecated version support ends after 6 months

## Version Support

| ngDiagram Version | Support Status | Updates                            |
| ----------------- | -------------- | ---------------------------------- |
| Latest (0.8.x)    | Active         | Features, bugs, security           |
| Previous major    | Maintenance    | Critical bugs, security (6 months) |
| Older versions    | Unsupported    | No updates                         |

## Semantic Versioning

ngDiagram follows [semver](https://semver.org/):

- **Major (X.0.0)**: Breaking changes
- **Minor (X.Y.0)**: New features, backward-compatible
- **Patch (X.Y.Z)**: Bug fixes only

See [Deprecation Policy](./deprecation) for breaking change process.
