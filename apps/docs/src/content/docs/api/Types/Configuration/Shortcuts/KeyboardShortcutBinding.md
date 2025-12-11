---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "KeyboardShortcutBinding"
---

Defines a keyboard shortcut binding with a key

## Properties

### key

> **key**: `string`

Key value (e.g., 'c', 'Delete', 'ArrowUp')

#### See

https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values - Complete list of valid key values

***

### modifiers?

> `optional` **modifiers**: `Partial`\<[`InputModifiers`](/docs/api/types/configuration/shortcuts/inputmodifiers/)\>

Required modifier keys (all are optional - omitted means no modifiers required)
