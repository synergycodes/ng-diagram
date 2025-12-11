---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "ShortcutDefinition"
---

> **ShortcutDefinition** = [`KeyboardShortcutDefinition`](/docs/api/types/configuration/shortcuts/keyboardshortcutdefinition/) \| [`PointerOnlyShortcutDefinition`](/docs/api/types/configuration/shortcuts/pointeronlyshortcutdefinition/)

Shortcut definition for registering keyboard and pointer shortcuts

This is a discriminated union that enforces:
- Pointer-only actions (multiSelection, boxSelection) can only have modifier-only bindings
- Keyboard actions must have at least one key-based binding
