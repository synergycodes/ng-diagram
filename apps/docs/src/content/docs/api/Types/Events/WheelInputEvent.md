---
version: "since v1.1.0"
editUrl: false
next: false
prev: false
title: "WheelInputEvent"
---

Defines custom event type used throughout the ngDiagram library for handling user input.

The main type, `WheelInputEvent`, extends the native `WheelEvent` with additional flag
that indicate zooming diagram interaction have already been handled.
These flag is used by input event directives and handlers
to coordinate and prevent duplicate processing of the same pointer event.

This type is used as the event parameter in input event handlers and services
across the public API and internal logic.

Example usage:
```ts
onWheel(event: WheelInputEvent) {
  if (!event.zoomingHandled) {
    // handle zooming logic
    event.zoomingHandled = true;
  }
}
```

## Extends

- `WheelEvent`

## Properties

### altKey

> `readonly` **altKey**: `boolean`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/altKey)

#### Inherited from

`WheelEvent.altKey`

***

### bubbles

> `readonly` **bubbles**: `boolean`

Returns true or false depending on how event was initialized. True if event goes through its target's ancestors in reverse tree order, and false otherwise.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/bubbles)

#### Inherited from

`WheelEvent.bubbles`

***

### button

> `readonly` **button**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/button)

#### Inherited from

`WheelEvent.button`

***

### buttons

> `readonly` **buttons**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/buttons)

#### Inherited from

`WheelEvent.buttons`

***

### cancelable

> `readonly` **cancelable**: `boolean`

Returns true or false depending on how event was initialized. Its return value does not always carry meaning, but true can indicate that part of the operation during which event was dispatched, can be canceled by invoking the preventDefault() method.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/cancelable)

#### Inherited from

`WheelEvent.cancelable`

***

### ~~cancelBubble~~

> **cancelBubble**: `boolean`

:::caution[Deprecated]
[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/cancelBubble)
:::

#### Inherited from

`WheelEvent.cancelBubble`

***

### clientX

> `readonly` **clientX**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/clientX)

#### Inherited from

`WheelEvent.clientX`

***

### clientY

> `readonly` **clientY**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/clientY)

#### Inherited from

`WheelEvent.clientY`

***

### composed

> `readonly` **composed**: `boolean`

Returns true or false depending on how event was initialized. True if event invokes listeners past a ShadowRoot node that is the root of its target, and false otherwise.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/composed)

#### Inherited from

`WheelEvent.composed`

***

### ctrlKey

> `readonly` **ctrlKey**: `boolean`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/ctrlKey)

#### Inherited from

`WheelEvent.ctrlKey`

***

### currentTarget

> `readonly` **currentTarget**: `null` \| `EventTarget`

Returns the object whose event listener's callback is currently being invoked.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/currentTarget)

#### Inherited from

`WheelEvent.currentTarget`

***

### defaultPrevented

> `readonly` **defaultPrevented**: `boolean`

Returns true if preventDefault() was invoked successfully to indicate cancelation, and false otherwise.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/defaultPrevented)

#### Inherited from

`WheelEvent.defaultPrevented`

***

### deltaMode

> `readonly` **deltaMode**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/WheelEvent/deltaMode)

#### Inherited from

`WheelEvent.deltaMode`

***

### deltaX

> `readonly` **deltaX**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/WheelEvent/deltaX)

#### Inherited from

`WheelEvent.deltaX`

***

### deltaY

> `readonly` **deltaY**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/WheelEvent/deltaY)

#### Inherited from

`WheelEvent.deltaY`

***

### deltaZ

> `readonly` **deltaZ**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/WheelEvent/deltaZ)

#### Inherited from

`WheelEvent.deltaZ`

***

### detail

> `readonly` **detail**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/UIEvent/detail)

#### Inherited from

`WheelEvent.detail`

***

### eventPhase

> `readonly` **eventPhase**: `number`

Returns the event's phase, which is one of NONE, CAPTURING_PHASE, AT_TARGET, and BUBBLING_PHASE.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/eventPhase)

#### Inherited from

`WheelEvent.eventPhase`

***

### isTrusted

> `readonly` **isTrusted**: `boolean`

Returns true if event was dispatched by the user agent, and false otherwise.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/isTrusted)

#### Inherited from

`WheelEvent.isTrusted`

***

### layerX

> `readonly` **layerX**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/layerX)

#### Inherited from

`WheelEvent.layerX`

***

### layerY

> `readonly` **layerY**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/layerY)

#### Inherited from

`WheelEvent.layerY`

***

### metaKey

> `readonly` **metaKey**: `boolean`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/metaKey)

#### Inherited from

`WheelEvent.metaKey`

***

### movementX

> `readonly` **movementX**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/movementX)

#### Inherited from

`WheelEvent.movementX`

***

### movementY

> `readonly` **movementY**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/movementY)

#### Inherited from

`WheelEvent.movementY`

***

### offsetX

> `readonly` **offsetX**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/offsetX)

#### Inherited from

`WheelEvent.offsetX`

***

### offsetY

> `readonly` **offsetY**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/offsetY)

#### Inherited from

`WheelEvent.offsetY`

***

### pageX

> `readonly` **pageX**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/pageX)

#### Inherited from

`WheelEvent.pageX`

***

### pageY

> `readonly` **pageY**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/pageY)

#### Inherited from

`WheelEvent.pageY`

***

### relatedTarget

> `readonly` **relatedTarget**: `null` \| `EventTarget`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/relatedTarget)

#### Inherited from

`WheelEvent.relatedTarget`

***

### ~~returnValue~~

> **returnValue**: `boolean`

:::caution[Deprecated]
[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/returnValue)
:::

#### Inherited from

`WheelEvent.returnValue`

***

### screenX

> `readonly` **screenX**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/screenX)

#### Inherited from

`WheelEvent.screenX`

***

### screenY

> `readonly` **screenY**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/screenY)

#### Inherited from

`WheelEvent.screenY`

***

### shiftKey

> `readonly` **shiftKey**: `boolean`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/shiftKey)

#### Inherited from

`WheelEvent.shiftKey`

***

### ~~srcElement~~

> `readonly` **srcElement**: `null` \| `EventTarget`

:::caution[Deprecated]
[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/srcElement)
:::

#### Inherited from

`WheelEvent.srcElement`

***

### target

> `readonly` **target**: `null` \| `EventTarget`

Returns the object to which event is dispatched (its target).

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/target)

#### Inherited from

`WheelEvent.target`

***

### timeStamp

> `readonly` **timeStamp**: `number`

Returns the event's timestamp as the number of milliseconds measured relative to the time origin.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/timeStamp)

#### Inherited from

`WheelEvent.timeStamp`

***

### type

> `readonly` **type**: `string`

Returns the type of event, e.g. "click", "hashchange", or "submit".

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/type)

#### Inherited from

`WheelEvent.type`

***

### view

> `readonly` **view**: `null` \| `Window`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/UIEvent/view)

#### Inherited from

`WheelEvent.view`

***

### ~~which~~

> `readonly` **which**: `number`

:::caution[Deprecated]
[MDN Reference](https://developer.mozilla.org/docs/Web/API/UIEvent/which)
:::

#### Inherited from

`WheelEvent.which`

***

### x

> `readonly` **x**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/x)

#### Inherited from

`WheelEvent.x`

***

### y

> `readonly` **y**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/y)

#### Inherited from

`WheelEvent.y`

## Methods

### composedPath()

> **composedPath**(): `EventTarget`[]

Returns the invocation target objects of event's path (objects on which listeners will be invoked), except for any nodes in shadow trees of which the shadow root's mode is "closed" that are not reachable from event's currentTarget.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/composedPath)

#### Returns

`EventTarget`[]

#### Inherited from

`WheelEvent.composedPath`

***

### getModifierState()

> **getModifierState**(`keyArg`): `boolean`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/getModifierState)

#### Parameters

##### keyArg

`string`

#### Returns

`boolean`

#### Inherited from

`WheelEvent.getModifierState`

***

### ~~initEvent()~~

> **initEvent**(`type`, `bubbles?`, `cancelable?`): `void`

:::caution[Deprecated]
[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/initEvent)
:::

#### Parameters

##### type

`string`

##### bubbles?

`boolean`

##### cancelable?

`boolean`

#### Returns

`void`

#### Inherited from

`WheelEvent.initEvent`

***

### ~~initMouseEvent()~~

> **initMouseEvent**(`typeArg`, `canBubbleArg`, `cancelableArg`, `viewArg`, `detailArg`, `screenXArg`, `screenYArg`, `clientXArg`, `clientYArg`, `ctrlKeyArg`, `altKeyArg`, `shiftKeyArg`, `metaKeyArg`, `buttonArg`, `relatedTargetArg`): `void`

:::caution[Deprecated]
[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/initMouseEvent)
:::

#### Parameters

##### typeArg

`string`

##### canBubbleArg

`boolean`

##### cancelableArg

`boolean`

##### viewArg

`Window`

##### detailArg

`number`

##### screenXArg

`number`

##### screenYArg

`number`

##### clientXArg

`number`

##### clientYArg

`number`

##### ctrlKeyArg

`boolean`

##### altKeyArg

`boolean`

##### shiftKeyArg

`boolean`

##### metaKeyArg

`boolean`

##### buttonArg

`number`

##### relatedTargetArg

`null` | `EventTarget`

#### Returns

`void`

#### Inherited from

`WheelEvent.initMouseEvent`

***

### ~~initUIEvent()~~

> **initUIEvent**(`typeArg`, `bubblesArg?`, `cancelableArg?`, `viewArg?`, `detailArg?`): `void`

:::caution[Deprecated]
[MDN Reference](https://developer.mozilla.org/docs/Web/API/UIEvent/initUIEvent)
:::

#### Parameters

##### typeArg

`string`

##### bubblesArg?

`boolean`

##### cancelableArg?

`boolean`

##### viewArg?

`null` | `Window`

##### detailArg?

`number`

#### Returns

`void`

#### Inherited from

`WheelEvent.initUIEvent`

***

### preventDefault()

> **preventDefault**(): `void`

If invoked when the cancelable attribute value is true, and while executing a listener for the event with passive set to false, signals to the operation that caused event to be dispatched that it needs to be canceled.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/preventDefault)

#### Returns

`void`

#### Inherited from

`WheelEvent.preventDefault`

***

### stopImmediatePropagation()

> **stopImmediatePropagation**(): `void`

Invoking this method prevents event from reaching any registered event listeners after the current one finishes running and, when dispatched in a tree, also prevents event from reaching any other objects.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/stopImmediatePropagation)

#### Returns

`void`

#### Inherited from

`WheelEvent.stopImmediatePropagation`

***

### stopPropagation()

> **stopPropagation**(): `void`

When dispatched in a tree, invoking this method prevents event from reaching any objects other than the current object.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/stopPropagation)

#### Returns

`void`

#### Inherited from

`WheelEvent.stopPropagation`
