---
editUrl: false
next: false
prev: false
title: "PointerInputEvent"
---

Defines custom event types used throughout the ngDiagram library for handling user input.

The main type, `PointerInputEvent`, extends the native `PointerEvent` with additional flags
that indicate whether specific diagram interactions (such as selection, zooming, linking, rotation)
have already been handled. These flags are used by input event directives and handlers
to coordinate and prevent duplicate processing of the same pointer event.

This type is used as the event parameter in input event handlers and services
across the public API and internal logic.

Example usage:
```ts
onPointerDown(event: PointerInputEvent) {
  if (!event.linkingHandled) {
    // handle linking logic
    event.linkingHandled = true;
  }
}
```

## Extends

- `PointerEvent`

## Properties

### altitudeAngle

> `readonly` **altitudeAngle**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/PointerEvent/altitudeAngle)

#### Inherited from

`PointerEvent.altitudeAngle`

***

### altKey

> `readonly` **altKey**: `boolean`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/altKey)

#### Inherited from

`PointerEvent.altKey`

***

### azimuthAngle

> `readonly` **azimuthAngle**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/PointerEvent/azimuthAngle)

#### Inherited from

`PointerEvent.azimuthAngle`

***

### bubbles

> `readonly` **bubbles**: `boolean`

Returns true or false depending on how event was initialized. True if event goes through its target's ancestors in reverse tree order, and false otherwise.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/bubbles)

#### Inherited from

`PointerEvent.bubbles`

***

### button

> `readonly` **button**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/button)

#### Inherited from

`PointerEvent.button`

***

### buttons

> `readonly` **buttons**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/buttons)

#### Inherited from

`PointerEvent.buttons`

***

### cancelable

> `readonly` **cancelable**: `boolean`

Returns true or false depending on how event was initialized. Its return value does not always carry meaning, but true can indicate that part of the operation during which event was dispatched, can be canceled by invoking the preventDefault() method.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/cancelable)

#### Inherited from

`PointerEvent.cancelable`

***

### ~~cancelBubble~~

> **cancelBubble**: `boolean`

:::caution[Deprecated]
[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/cancelBubble)
:::

#### Inherited from

`PointerEvent.cancelBubble`

***

### clientX

> `readonly` **clientX**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/clientX)

#### Inherited from

`PointerEvent.clientX`

***

### clientY

> `readonly` **clientY**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/clientY)

#### Inherited from

`PointerEvent.clientY`

***

### composed

> `readonly` **composed**: `boolean`

Returns true or false depending on how event was initialized. True if event invokes listeners past a ShadowRoot node that is the root of its target, and false otherwise.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/composed)

#### Inherited from

`PointerEvent.composed`

***

### ctrlKey

> `readonly` **ctrlKey**: `boolean`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/ctrlKey)

#### Inherited from

`PointerEvent.ctrlKey`

***

### currentTarget

> `readonly` **currentTarget**: `null` \| `EventTarget`

Returns the object whose event listener's callback is currently being invoked.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/currentTarget)

#### Inherited from

`PointerEvent.currentTarget`

***

### defaultPrevented

> `readonly` **defaultPrevented**: `boolean`

Returns true if preventDefault() was invoked successfully to indicate cancelation, and false otherwise.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/defaultPrevented)

#### Inherited from

`PointerEvent.defaultPrevented`

***

### detail

> `readonly` **detail**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/UIEvent/detail)

#### Inherited from

`PointerEvent.detail`

***

### eventPhase

> `readonly` **eventPhase**: `number`

Returns the event's phase, which is one of NONE, CAPTURING_PHASE, AT_TARGET, and BUBBLING_PHASE.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/eventPhase)

#### Inherited from

`PointerEvent.eventPhase`

***

### height

> `readonly` **height**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/PointerEvent/height)

#### Inherited from

`PointerEvent.height`

***

### isPrimary

> `readonly` **isPrimary**: `boolean`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/PointerEvent/isPrimary)

#### Inherited from

`PointerEvent.isPrimary`

***

### isTrusted

> `readonly` **isTrusted**: `boolean`

Returns true if event was dispatched by the user agent, and false otherwise.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/isTrusted)

#### Inherited from

`PointerEvent.isTrusted`

***

### layerX

> `readonly` **layerX**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/layerX)

#### Inherited from

`PointerEvent.layerX`

***

### layerY

> `readonly` **layerY**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/layerY)

#### Inherited from

`PointerEvent.layerY`

***

### metaKey

> `readonly` **metaKey**: `boolean`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/metaKey)

#### Inherited from

`PointerEvent.metaKey`

***

### movementX

> `readonly` **movementX**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/movementX)

#### Inherited from

`PointerEvent.movementX`

***

### movementY

> `readonly` **movementY**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/movementY)

#### Inherited from

`PointerEvent.movementY`

***

### offsetX

> `readonly` **offsetX**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/offsetX)

#### Inherited from

`PointerEvent.offsetX`

***

### offsetY

> `readonly` **offsetY**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/offsetY)

#### Inherited from

`PointerEvent.offsetY`

***

### pageX

> `readonly` **pageX**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/pageX)

#### Inherited from

`PointerEvent.pageX`

***

### pageY

> `readonly` **pageY**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/pageY)

#### Inherited from

`PointerEvent.pageY`

***

### pointerId

> `readonly` **pointerId**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/PointerEvent/pointerId)

#### Inherited from

`PointerEvent.pointerId`

***

### pointerType

> `readonly` **pointerType**: `string`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/PointerEvent/pointerType)

#### Inherited from

`PointerEvent.pointerType`

***

### pressure

> `readonly` **pressure**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/PointerEvent/pressure)

#### Inherited from

`PointerEvent.pressure`

***

### relatedTarget

> `readonly` **relatedTarget**: `null` \| `EventTarget`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/relatedTarget)

#### Inherited from

`PointerEvent.relatedTarget`

***

### ~~returnValue~~

> **returnValue**: `boolean`

:::caution[Deprecated]
[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/returnValue)
:::

#### Inherited from

`PointerEvent.returnValue`

***

### screenX

> `readonly` **screenX**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/screenX)

#### Inherited from

`PointerEvent.screenX`

***

### screenY

> `readonly` **screenY**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/screenY)

#### Inherited from

`PointerEvent.screenY`

***

### shiftKey

> `readonly` **shiftKey**: `boolean`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/shiftKey)

#### Inherited from

`PointerEvent.shiftKey`

***

### ~~srcElement~~

> `readonly` **srcElement**: `null` \| `EventTarget`

:::caution[Deprecated]
[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/srcElement)
:::

#### Inherited from

`PointerEvent.srcElement`

***

### tangentialPressure

> `readonly` **tangentialPressure**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/PointerEvent/tangentialPressure)

#### Inherited from

`PointerEvent.tangentialPressure`

***

### target

> `readonly` **target**: `null` \| `EventTarget`

Returns the object to which event is dispatched (its target).

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/target)

#### Inherited from

`PointerEvent.target`

***

### tiltX

> `readonly` **tiltX**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/PointerEvent/tiltX)

#### Inherited from

`PointerEvent.tiltX`

***

### tiltY

> `readonly` **tiltY**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/PointerEvent/tiltY)

#### Inherited from

`PointerEvent.tiltY`

***

### timeStamp

> `readonly` **timeStamp**: `number`

Returns the event's timestamp as the number of milliseconds measured relative to the time origin.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/timeStamp)

#### Inherited from

`PointerEvent.timeStamp`

***

### twist

> `readonly` **twist**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/PointerEvent/twist)

#### Inherited from

`PointerEvent.twist`

***

### type

> `readonly` **type**: `string`

Returns the type of event, e.g. "click", "hashchange", or "submit".

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/type)

#### Inherited from

`PointerEvent.type`

***

### view

> `readonly` **view**: `null` \| `Window`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/UIEvent/view)

#### Inherited from

`PointerEvent.view`

***

### ~~which~~

> `readonly` **which**: `number`

:::caution[Deprecated]
[MDN Reference](https://developer.mozilla.org/docs/Web/API/UIEvent/which)
:::

#### Inherited from

`PointerEvent.which`

***

### width

> `readonly` **width**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/PointerEvent/width)

#### Inherited from

`PointerEvent.width`

***

### x

> `readonly` **x**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/x)

#### Inherited from

`PointerEvent.x`

***

### y

> `readonly` **y**: `number`

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/y)

#### Inherited from

`PointerEvent.y`

## Methods

### composedPath()

> **composedPath**(): `EventTarget`[]

Returns the invocation target objects of event's path (objects on which listeners will be invoked), except for any nodes in shadow trees of which the shadow root's mode is "closed" that are not reachable from event's currentTarget.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/composedPath)

#### Returns

`EventTarget`[]

#### Inherited from

`PointerEvent.composedPath`

***

### getCoalescedEvents()

> **getCoalescedEvents**(): `PointerEvent`[]

Available only in secure contexts.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/PointerEvent/getCoalescedEvents)

#### Returns

`PointerEvent`[]

#### Inherited from

`PointerEvent.getCoalescedEvents`

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

`PointerEvent.getModifierState`

***

### getPredictedEvents()

> **getPredictedEvents**(): `PointerEvent`[]

[MDN Reference](https://developer.mozilla.org/docs/Web/API/PointerEvent/getPredictedEvents)

#### Returns

`PointerEvent`[]

#### Inherited from

`PointerEvent.getPredictedEvents`

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

`PointerEvent.initEvent`

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

`PointerEvent.initMouseEvent`

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

`PointerEvent.initUIEvent`

***

### preventDefault()

> **preventDefault**(): `void`

If invoked when the cancelable attribute value is true, and while executing a listener for the event with passive set to false, signals to the operation that caused event to be dispatched that it needs to be canceled.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/preventDefault)

#### Returns

`void`

#### Inherited from

`PointerEvent.preventDefault`

***

### stopImmediatePropagation()

> **stopImmediatePropagation**(): `void`

Invoking this method prevents event from reaching any registered event listeners after the current one finishes running and, when dispatched in a tree, also prevents event from reaching any other objects.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/stopImmediatePropagation)

#### Returns

`void`

#### Inherited from

`PointerEvent.stopImmediatePropagation`

***

### stopPropagation()

> **stopPropagation**(): `void`

When dispatched in a tree, invoking this method prevents event from reaching any objects other than the current object.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/stopPropagation)

#### Returns

`void`

#### Inherited from

`PointerEvent.stopPropagation`
