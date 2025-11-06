---
editUrl: false
next: false
prev: false
title: "NgDiagramClipboardService"
---

The `NgDiagramClipboardService` provides clipboard operations for diagram.

## Example usage
```typescript
private clipboardService = inject(NgDiagramClipboardService);

// Copy selected elements
this.clipboardService.copy();
```

## Extends

- `NgDiagramBaseService`

## Methods

### copy()

> **copy**(): `void`

Copies the current selection to the clipboard.

#### Returns

`void`

***

### cut()

> **cut**(): `void`

Cuts the current selection to the clipboard.

#### Returns

`void`

***

### paste()

> **paste**(`position`): `void`

Pastes the clipboard content at the specified position.

#### Parameters

##### position

[`Point`](/docs/api/types/geometry/point/)

The position where to paste the content.

#### Returns

`void`
