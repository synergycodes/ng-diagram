---
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

> **get** **copyPaste**(): `undefined` \| `CopyPasteActionState`

Gets the current copy/paste action state.

##### Returns

`undefined` \| `CopyPasteActionState`

The copy/paste state if a copy/paste operation is in progress, undefined otherwise

#### Set Signature

> **set** **copyPaste**(`value`): `void`

Sets the copy/paste action state.

##### Parameters

###### value

The copy/paste state to set, or undefined to clear

`undefined` | `CopyPasteActionState`

##### Returns

`void`

***

### dragging

#### Get Signature

> **get** **dragging**(): `undefined` \| `DraggingActionState`

Gets the current dragging action state.

##### Returns

`undefined` \| `DraggingActionState`

The dragging state if nodes are being dragged, undefined otherwise

#### Set Signature

> **set** **dragging**(`value`): `void`

Sets the dragging action state.

##### Parameters

###### value

The dragging state to set, or undefined to clear

`undefined` | `DraggingActionState`

##### Returns

`void`

***

### highlightGroup

#### Get Signature

> **get** **highlightGroup**(): `undefined` \| `HighlightGroupActionState`

Gets the current highlight group action state.

##### Returns

`undefined` \| `HighlightGroupActionState`

The highlight group state if a group is being highlighted, undefined otherwise

#### Set Signature

> **set** **highlightGroup**(`value`): `void`

Sets the highlight group action state.

##### Parameters

###### value

The highlight group state to set, or undefined to clear

`undefined` | `HighlightGroupActionState`

##### Returns

`void`

***

### linking

#### Get Signature

> **get** **linking**(): `undefined` \| `LinkingActionState`

Gets the current linking action state.

##### Returns

`undefined` \| `LinkingActionState`

The linking state if a link is being created, undefined otherwise

#### Set Signature

> **set** **linking**(`value`): `void`

Sets the linking action state.

##### Parameters

###### value

The linking state to set, or undefined to clear

`undefined` | `LinkingActionState`

##### Returns

`void`

***

### resize

#### Get Signature

> **get** **resize**(): `undefined` \| `ResizeActionState`

Gets the current resize action state.

##### Returns

`undefined` \| `ResizeActionState`

The resize state if a resize is in progress, undefined otherwise

#### Set Signature

> **set** **resize**(`value`): `void`

Sets the resize action state.

##### Parameters

###### value

The resize state to set, or undefined to clear

`undefined` | `ResizeActionState`

##### Returns

`void`

***

### rotation

#### Get Signature

> **get** **rotation**(): `undefined` \| `RotationActionState`

Gets the current rotation action state.

##### Returns

`undefined` \| `RotationActionState`

The rotation state if a rotation is in progress, undefined otherwise

#### Set Signature

> **set** **rotation**(`value`): `void`

Sets the rotation action state.

##### Parameters

###### value

The rotation state to set, or undefined to clear

`undefined` | `RotationActionState`

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

### getState()

> **getState**(): `Readonly`\<[`ActionState`](/docs/api/types/actionstate/)\>

Gets the current action state (readonly).

#### Returns

`Readonly`\<[`ActionState`](/docs/api/types/actionstate/)\>

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
