# Import Restrictions for ng-diagram

## Overview

This document describes the import restriction system implemented for the ng-diagram project to maintain proper architectural separation between the `core` and `lib` modules.

## Architecture

The ng-diagram project follows a strict architectural pattern:

```
src/
├── core/          # Framework-agnostic business logic
└── lib/           # Angular-specific implementations
```

### Core Module

- **Purpose**: Framework-agnostic business logic and algorithms
- **Dependencies**: Can only import from other core files
- **Restrictions**: Cannot import from `lib` folder or Angular modules

### Lib Module

- **Purpose**: Angular-specific components, services, and directives
- **Dependencies**: Can import from `core` and Angular modules
- **Restrictions**: Should avoid circular dependencies within lib

## Enforcement Mechanisms

### ESLint Rules

The core module has strict ESLint rules that prevent:

- Importing from `lib` folder (`../../lib/**`, `../lib/**`, `./lib/**`)
- Importing Angular modules (`@angular/**`)
