---
editUrl: false
next: false
prev: false
title: "configureShortcuts"
---

> **configureShortcuts**(`userShortcuts`, `baseShortcuts`): [`ShortcutDefinition`](/docs/api/other/shortcutdefinition/)[]

Merges user shortcuts with base shortcuts, user shortcuts override by actionName

## Parameters

### userShortcuts

[`ShortcutDefinition`](/docs/api/other/shortcutdefinition/)[]

User-provided shortcuts that will override matching base shortcuts

### baseShortcuts

[`ShortcutDefinition`](/docs/api/other/shortcutdefinition/)[] = `DEFAULT_SHORTCUTS`

Base shortcuts to merge with. Optional parameter that defaults to DEFAULT_SHORTCUTS array

## Returns

[`ShortcutDefinition`](/docs/api/other/shortcutdefinition/)[]

Merged shortcut definitions
