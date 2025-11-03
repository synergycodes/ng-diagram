---
editUrl: false
next: false
prev: false
title: "ShortcutDefinition"
---

Shortcut definition for registering keyboard shortcuts

Minimal configuration required - only id, actionName, and bindings are mandatory.
Defaults:
- enabled: true

## Properties

### actionName

> **actionName**: [`ShortcutActionName`](/docs/api/types/shortcutactionname/)

Action name that will be mapped to input event via ActionMapper

***

### bindings

> **bindings**: `ShortcutBinding`[]

Platform-specific key bindings
