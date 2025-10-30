---
editUrl: false
next: false
prev: false
title: "mergeShortcuts"
---

> **mergeShortcuts**(`userShortcuts`): `ShortcutDefinition`[]

Merges default shortcuts with user-provided shortcuts

User shortcuts with the same actionName will override default ones.
New shortcuts from the user will be added.

## Parameters

### userShortcuts

`ShortcutDefinition`[] = `[]`

User-provided shortcuts (optional)

## Returns

`ShortcutDefinition`[]

Merged array of shortcut definitions
