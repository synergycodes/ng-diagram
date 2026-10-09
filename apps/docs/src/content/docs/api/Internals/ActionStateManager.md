---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "ActionStateManager"
---

**Internal manager** for temporary state during ongoing user actions.
Tracks the state of interactive operations like resizing, linking, rotating, and dragging
until the action completes.

## Remarks

**For application code, use [NgDiagramService.actionState](/docs/api/services/ngdiagramservice/#actionstate) signal instead.**
This class is exposed primarily for middleware development where you can access it
via `context.actionStateManager`.

## Example

```typescript
const middleware: Middleware = {
  name: 'resize-validator',
  execute: (context, next, cancel) => {
    const resizeState = context.actionStateManager.resize;
    if (resizeState) {
      console.log('Currently resizing node:', resizeState.nodeId);
    }
    next();
  }
};
```

## Accessors

### copyPaste

#### Get Signature

> **get** **copyPaste**(): [`CopyPasteActionState`](/docs/api/internals/copypasteactionstate/) \| `undefined`

Gets the current copy/paste action state.

##### Returns

[`CopyPasteActionState`](/docs/api/internals/copypasteactionstate/) \| `undefined`

The copy/paste state if a copy/paste operation is in progress, undefined otherwise

#### Set Signature

> **set** **copyPaste**(`value`): `void`

Sets the copy/paste action state.

##### Parameters

###### value

[`CopyPasteActionState`](/docs/api/internals/copypasteactionstate/) \| `undefined`

The copy/paste state to set, or undefined to clear

##### Returns

`void`

***

### dragging

#### Get Signature

> **get** **dragging**(): [`DraggingActionState`](/docs/api/internals/draggingactionstate/) \| `undefined`

Gets the current dragging action state.

##### Returns

[`DraggingActionState`](/docs/api/internals/draggingactionstate/) \| `undefined`

The dragging state if nodes are being dragged, undefined otherwise

#### Set Signature

> **set** **dragging**(`value`): `void`

Sets the dragging action state.

##### Parameters

###### value

[`DraggingActionState`](/docs/api/internals/draggingactionstate/) \| `undefined`

The dragging state to set, or undefined to clear

##### Returns

`void`

***

### highlightGroup

#### Get Signature

> **get** **highlightGroup**(): [`HighlightGroupActionState`](/docs/api/internals/highlightgroupactionstate/) \| `undefined`

Gets the current highlight group action state.

##### Returns

[`HighlightGroupActionState`](/docs/api/internals/highlightgroupactionstate/) \| `undefined`

The highlight group state if a group is being highlighted, undefined otherwise

#### Set Signature

> **set** **highlightGroup**(`value`): `void`

Sets the highlight group action state.

##### Parameters

###### value

[`HighlightGroupActionState`](/docs/api/internals/highlightgroupactionstate/) \| `undefined`

The highlight group state to set, or undefined to clear

##### Returns

`void`

***

### linking

#### Get Signature

> **get** **linking**(): [`LinkingActionState`](/docs/api/internals/linkingactionstate/) \| `undefined`

Gets the current linking action state.

##### Returns

[`LinkingActionState`](/docs/api/internals/linkingactionstate/) \| `undefined`

The linking state if a link is being created, undefined otherwise

#### Set Signature

> **set** **linking**(`value`): `void`

Sets the linking action state.

##### Parameters

###### value

[`LinkingActionState`](/docs/api/internals/linkingactionstate/) \| `undefined`

The linking state to set, or undefined to clear

##### Returns

`void`

***

### panning

#### Get Signature

> **get** **panning**(): [`PanningActionState`](/docs/api/internals/panningactionstate/) \| `undefined`

Gets the current panning action state.

##### Returns

[`PanningActionState`](/docs/api/internals/panningactionstate/) \| `undefined`

The panning state if viewport is being panned, undefined otherwise

#### Set Signature

> **set** **panning**(`value`): `void`

Sets the panning action state.

##### Parameters

###### value

[`PanningActionState`](/docs/api/internals/panningactionstate/) \| `undefined`

The panning state to set, or undefined to clear

##### Returns

`void`

***

### resize

#### Get Signature

> **get** **resize**(): [`ResizeActionState`](/docs/api/internals/resizeactionstate/) \| `undefined`

Gets the current resize action state.

##### Returns

[`ResizeActionState`](/docs/api/internals/resizeactionstate/) \| `undefined`

The resize state if a resize is in progress, undefined otherwise

#### Set Signature

> **set** **resize**(`value`): `void`

Sets the resize action state.

##### Parameters

###### value

[`ResizeActionState`](/docs/api/internals/resizeactionstate/) \| `undefined`

The resize state to set, or undefined to clear

##### Returns

`void`

***

### rotation

#### Get Signature

> **get** **rotation**(): [`RotationActionState`](/docs/api/internals/rotationactionstate/) \| `undefined`

Gets the current rotation action state.

##### Returns

[`RotationActionState`](/docs/api/internals/rotationactionstate/) \| `undefined`

The rotation state if a rotation is in progress, undefined otherwise

#### Set Signature

> **set** **rotation**(`value`): `void`

Sets the rotation action state.

##### Parameters

###### value

[`RotationActionState`](/docs/api/internals/rotationactionstate/) \| `undefined`

The rotation state to set, or undefined to clear

##### Returns

`void`

***

### selection

#### Get Signature

> **get** **selection**(): [`SelectionActionState`](/docs/api/internals/selectionactionstate/) \| `undefined`

Gets the current selection action state.

##### Returns

[`SelectionActionState`](/docs/api/internals/selectionactionstate/) \| `undefined`

The selection state if set, undefined otherwise

#### Set Signature

> **set** **selection**(`value`): `void`

Sets the selection action state.

##### Parameters

###### value

[`SelectionActionState`](/docs/api/internals/selectionactionstate/) \| `undefined`

The selection state to set, or undefined to clear

##### Returns

`void`

## Methods

### clearCopyPaste()

> **clearCopyPaste**(): `void`

Clears the copy/paste action state.

#### Returns

`void`

***

### clearDragging()

> **clearDragging**(): `void`

Clears the dragging action state.

#### Returns

`void`

***

### clearHighlightGroup()

> **clearHighlightGroup**(): `void`

Clears the highlight group action state.

#### Returns

`void`

***

### clearLinking()

> **clearLinking**(): `void`

Clears the linking action state.

#### Returns

`void`

***

### clearPanning()

> **clearPanning**(): `void`

Clears the panning action state.

#### Returns

`void`

***

### clearResize()

> **clearResize**(): `void`

Clears the resize action state.

#### Returns

`void`

***

### clearRotation()

> **clearRotation**(): `void`

Clears the rotation action state.

#### Returns

`void`

***

### clearSelection()

> **clearSelection**(): `void`

Clears the selection action state.

#### Returns

`void`

***

### getState()

> **getState**(): `Readonly`\<[`ActionState`](/docs/api/internals/actionstate/)\>

Gets the current action state (readonly).

#### Returns

`Readonly`\<[`ActionState`](/docs/api/internals/actionstate/)\>

The complete action state object

***

### isDragging()

> **isDragging**(): `boolean`

Checks if a dragging operation is currently in progress.

#### Returns

`boolean`

***

### isLinking()

> **isLinking**(): `boolean`

Checks if a linking operation is currently in progress.

#### Returns

`boolean`

***

### isPanning()

> **isPanning**(): `boolean`

Checks if a panning operation is currently in progress.

#### Returns

`boolean`

***

### isResizing()

> **isResizing**(): `boolean`

Checks if a resize operation is currently in progress.

#### Returns

`boolean`

***

### isRotating()

> **isRotating**(): `boolean`

Checks if a rotation operation is currently in progress.

#### Returns

`boolean`
