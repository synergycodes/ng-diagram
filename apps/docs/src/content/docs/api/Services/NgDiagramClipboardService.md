---
version: "since v0.8.0"
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

> **copy**(): `Promise`\<`void`\>

Copies the current selection to the clipboard.

#### Returns

`Promise`\<`void`\>

A promise that resolves once the selection has been copied.

***

### cut()

> **cut**(): `Promise`\<`void`\>

Cuts the current selection to the clipboard.

#### Returns

`Promise`\<`void`\>

A promise that resolves once the change has been applied to the model. When called inside a transaction, it resolves once the change has been queued on it (applied when the transaction commits).

***

### paste()

> **paste**(`position`): `Promise`\<`void`\>

Pastes the clipboard content at the specified position.

#### Parameters

##### position

[`Point`](/docs/api/types/geometry/point/)

The position where to paste the content.

#### Returns

`Promise`\<`void`\>

A promise that resolves once the change has been applied to the model. When called inside a transaction, it resolves once the change has been queued on it (applied when the transaction commits).
