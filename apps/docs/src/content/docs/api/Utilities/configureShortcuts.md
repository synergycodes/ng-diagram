---
editUrl: false
next: false
prev: false
title: "configureShortcuts"
---

> **configureShortcuts**(`userShortcuts`, `baseShortcuts`): [`ShortcutDefinition`](/docs/api/types/configuration/shortcuts/shortcutdefinition/)[]

Merges user shortcuts with base shortcuts, user shortcuts override by actionName

## Parameters

### userShortcuts

[`ShortcutDefinition`](/docs/api/types/configuration/shortcuts/shortcutdefinition/)[]

User-provided shortcuts that will override matching base shortcuts

### baseShortcuts

[`ShortcutDefinition`](/docs/api/types/configuration/shortcuts/shortcutdefinition/)[] = `DEFAULT_SHORTCUTS`

Base shortcuts to merge with. Optional parameter that defaults to built-in shortcuts

## Returns

[`ShortcutDefinition`](/docs/api/types/configuration/shortcuts/shortcutdefinition/)[]

Merged shortcut definitions

## Examples

```ts
// Merge with default built-in shortcuts
config = {
  shortcuts: configureShortcuts([
    {
      actionName: 'keyboardMoveSelectionUp',
      bindings: [{ key: 'w' }],
    },
  ]),
} satisfies NgDiagramConfig;
```

```ts
// Merge with existing config shortcuts
const currentShortcuts = ngDiagramService.config().shortcuts;
const updatedShortcuts = configureShortcuts(
  [
    {
      actionName: 'paste',
      bindings: [{ key: 'b', modifiers: { primary: true } }],
    },
  ],
  currentShortcuts
);
```
