---
editUrl: false
next: false
prev: false
title: "ShortcutDefinition"
---

> **ShortcutDefinition** = `KeyboardShortcutDefinition` \| `PointerOnlyShortcutDefinition`

Shortcut definition for registering keyboard and pointer shortcuts

This is a discriminated union that enforces:
- Pointer-only actions (preserveSelection, boxSelection) can only have modifier-only bindings
- Keyboard actions must have at least one key-based binding
