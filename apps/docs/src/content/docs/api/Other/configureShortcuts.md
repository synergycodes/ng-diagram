---
editUrl: false
next: false
prev: false
title: "configureShortcuts"
---

> **configureShortcuts**(`userShortcuts`): `ShortcutDefinition`[]

Configures keyboard shortcuts by combining user-provided shortcuts with defaults

User shortcuts with the same actionName will override default ones.
New shortcuts from the user will be added.

## Parameters

### userShortcuts

`ShortcutDefinition`[] = `[]`

User-provided shortcuts (optional)

## Returns

`ShortcutDefinition`[]

Configured array of shortcut definitions
