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

The **`altitudeAngle`** read-only property of the PointerEvent interface represents the angle between a transducer (a pointer or stylus) axis and the X-Y plane of a device screen.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/PointerEvent/altitudeAngle)

#### Inherited from

`PointerEvent.altitudeAngle`

***

### altKey

> `readonly` **altKey**: `boolean`

The **`MouseEvent.altKey`** read-only property is a boolean value that indicates whether the <kbd>alt</kbd> key was pressed or not when a given mouse event occurs.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/altKey)

#### Inherited from

`PointerEvent.altKey`

***

### azimuthAngle

> `readonly` **azimuthAngle**: `number`

The **`azimuthAngle`** read-only property of the PointerEvent interface represents the angle between the Y-Z plane and the plane containing both the transducer (pointer or stylus) axis and the Y axis.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/PointerEvent/azimuthAngle)

#### Inherited from

`PointerEvent.azimuthAngle`

***

### bubbles

> `readonly` **bubbles**: `boolean`

The **`bubbles`** read-only property of the Event interface indicates whether the event bubbles up through the DOM tree or not.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/bubbles)

#### Inherited from

`PointerEvent.bubbles`

***

### button

> `readonly` **button**: `number`

The **`MouseEvent.button`** read-only property indicates which button was pressed or released on the mouse to trigger the event.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/button)

#### Inherited from

`PointerEvent.button`

***

### buttons

> `readonly` **buttons**: `number`

The **`MouseEvent.buttons`** read-only property indicates which buttons are pressed on the mouse (or other input device) when a mouse event is triggered.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/buttons)

#### Inherited from

`PointerEvent.buttons`

***

### cancelable

> `readonly` **cancelable**: `boolean`

The **`cancelable`** read-only property of the Event interface indicates whether the event can be canceled, and therefore prevented as if the event never happened.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/cancelable)

#### Inherited from

`PointerEvent.cancelable`

***

### ~~cancelBubble~~

> **cancelBubble**: `boolean`

The **`cancelBubble`** property of the Event interface is deprecated.

:::caution[Deprecated]
[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/cancelBubble)
:::

#### Inherited from

`PointerEvent.cancelBubble`

***

### clientX

> `readonly` **clientX**: `number`

The **`clientX`** read-only property of the MouseEvent interface provides the horizontal coordinate within the application's viewport at which the event occurred (as opposed to the coordinate within the page).

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/clientX)

#### Inherited from

`PointerEvent.clientX`

***

### clientY

> `readonly` **clientY**: `number`

The **`clientY`** read-only property of the MouseEvent interface provides the vertical coordinate within the application's viewport at which the event occurred (as opposed to the coordinate within the page).

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/clientY)

#### Inherited from

`PointerEvent.clientY`

***

### composed

> `readonly` **composed**: `boolean`

The read-only **`composed`** property of the or not the event will propagate across the shadow DOM boundary into the standard DOM.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/composed)

#### Inherited from

`PointerEvent.composed`

***

### ctrlKey

> `readonly` **ctrlKey**: `boolean`

The **`MouseEvent.ctrlKey`** read-only property is a boolean value that indicates whether the <kbd>ctrl</kbd> key was pressed or not when a given mouse event occurs.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/ctrlKey)

#### Inherited from

`PointerEvent.ctrlKey`

***

### currentTarget

> `readonly` **currentTarget**: `null` \| `EventTarget`

The **`currentTarget`** read-only property of the Event interface identifies the element to which the event handler has been attached.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/currentTarget)

#### Inherited from

[`PointerInputEvent`](/docs/api/types/pointerinputevent/).[`currentTarget`](/docs/api/types/pointerinputevent/#currenttarget)

***

### defaultPrevented

> `readonly` **defaultPrevented**: `boolean`

The **`defaultPrevented`** read-only property of the Event interface returns a boolean value indicating whether or not the call to Event.preventDefault() canceled the event.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/defaultPrevented)

#### Inherited from

`PointerEvent.defaultPrevented`

***

### detail

> `readonly` **detail**: `number`

The **`UIEvent.detail`** read-only property, when non-zero, provides the current (or next, depending on the event) click count.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/UIEvent/detail)

#### Inherited from

`PointerEvent.detail`

***

### eventPhase

> `readonly` **eventPhase**: `number`

The **`eventPhase`** read-only property of the being evaluated.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/eventPhase)

#### Inherited from

`PointerEvent.eventPhase`

***

### height

> `readonly` **height**: `number`

The **`height`** read-only property of the geometry, along the y-axis (in CSS pixels).

[MDN Reference](https://developer.mozilla.org/docs/Web/API/PointerEvent/height)

#### Inherited from

`PointerEvent.height`

***

### isPrimary

> `readonly` **isPrimary**: `boolean`

The **`isPrimary`** read-only property of the created the event is the _primary_ pointer.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/PointerEvent/isPrimary)

#### Inherited from

`PointerEvent.isPrimary`

***

### isTrusted

> `readonly` **isTrusted**: `boolean`

The **`isTrusted`** read-only property of the when the event was generated by the user agent (including via user actions and programmatic methods such as HTMLElement.focus()), and `false` when the event was dispatched via The only exception is the `click` event, which initializes the `isTrusted` property to `false` in user agents.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/isTrusted)

#### Inherited from

`PointerEvent.isTrusted`

***

### layerX

> `readonly` **layerX**: `number`

The **`MouseEvent.layerX`** read-only property returns the horizontal coordinate of the event relative to the current layer.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/layerX)

#### Inherited from

`PointerEvent.layerX`

***

### layerY

> `readonly` **layerY**: `number`

The **`MouseEvent.layerY`** read-only property returns the vertical coordinate of the event relative to the current layer.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/layerY)

#### Inherited from

`PointerEvent.layerY`

***

### metaKey

> `readonly` **metaKey**: `boolean`

The **`MouseEvent.metaKey`** read-only property is a boolean value that indicates whether the <kbd>meta</kbd> key was pressed or not when a given mouse event occurs.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/metaKey)

#### Inherited from

`PointerEvent.metaKey`

***

### movementX

> `readonly` **movementX**: `number`

The **`movementX`** read-only property of the MouseEvent interface provides the difference in the X coordinate of the mouse pointer between the given event and the previous Element/mousemove_event event.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/movementX)

#### Inherited from

`PointerEvent.movementX`

***

### movementY

> `readonly` **movementY**: `number`

The **`movementY`** read-only property of the MouseEvent interface provides the difference in the Y coordinate of the mouse pointer between the given event and the previous Element/mousemove_event event.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/movementY)

#### Inherited from

`PointerEvent.movementY`

***

### offsetX

> `readonly` **offsetX**: `number`

The **`offsetX`** read-only property of the MouseEvent interface provides the offset in the X coordinate of the mouse pointer between that event and the padding edge of the target node.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/offsetX)

#### Inherited from

`PointerEvent.offsetX`

***

### offsetY

> `readonly` **offsetY**: `number`

The **`offsetY`** read-only property of the MouseEvent interface provides the offset in the Y coordinate of the mouse pointer between that event and the padding edge of the target node.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/offsetY)

#### Inherited from

`PointerEvent.offsetY`

***

### pageX

> `readonly` **pageX**: `number`

The **`pageX`** read-only property of the MouseEvent interface returns the X (horizontal) coordinate (in pixels) at which the mouse was clicked, relative to the left edge of the entire document.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/pageX)

#### Inherited from

`PointerEvent.pageX`

***

### pageY

> `readonly` **pageY**: `number`

The **`pageY`** read-only property of the MouseEvent interface returns the Y (vertical) coordinate (in pixels) at which the mouse was clicked, relative to the top edge of the entire document.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/pageY)

#### Inherited from

`PointerEvent.pageY`

***

### pointerId

> `readonly` **pointerId**: `number`

The **`pointerId`** read-only property of the event.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/PointerEvent/pointerId)

#### Inherited from

`PointerEvent.pointerId`

***

### pointerType

> `readonly` **pointerType**: `string`

The **`pointerType`** read-only property of the that caused a given pointer event.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/PointerEvent/pointerType)

#### Inherited from

`PointerEvent.pointerType`

***

### pressure

> `readonly` **pressure**: `number`

The **`pressure`** read-only property of the input.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/PointerEvent/pressure)

#### Inherited from

`PointerEvent.pressure`

***

### relatedTarget

> `readonly` **relatedTarget**: `null` \| `EventTarget`

The **`MouseEvent.relatedTarget`** read-only property is the secondary target for the mouse event, if there is one.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/relatedTarget)

#### Inherited from

`PointerEvent.relatedTarget`

***

### ~~returnValue~~

> **returnValue**: `boolean`

The Event property **`returnValue`** indicates whether the default action for this event has been prevented or not.

:::caution[Deprecated]
[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/returnValue)
:::

#### Inherited from

`PointerEvent.returnValue`

***

### screenX

> `readonly` **screenX**: `number`

The **`screenX`** read-only property of the MouseEvent interface provides the horizontal coordinate (offset) of the mouse pointer in screen coordinates.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/screenX)

#### Inherited from

`PointerEvent.screenX`

***

### screenY

> `readonly` **screenY**: `number`

The **`screenY`** read-only property of the MouseEvent interface provides the vertical coordinate (offset) of the mouse pointer in screen coordinates.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/screenY)

#### Inherited from

`PointerEvent.screenY`

***

### shiftKey

> `readonly` **shiftKey**: `boolean`

The **`MouseEvent.shiftKey`** read-only property is a boolean value that indicates whether the <kbd>shift</kbd> key was pressed or not when a given mouse event occurs.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/shiftKey)

#### Inherited from

`PointerEvent.shiftKey`

***

### ~~srcElement~~

> `readonly` **srcElement**: `null` \| `EventTarget`

The deprecated **`Event.srcElement`** is an alias for the Event.target property.

:::caution[Deprecated]
[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/srcElement)
:::

#### Inherited from

[`PointerInputEvent`](/docs/api/types/pointerinputevent/).[`srcElement`](/docs/api/types/pointerinputevent/#srcelement)

***

### tangentialPressure

> `readonly` **tangentialPressure**: `number`

The **`tangentialPressure`** read-only property of the the pointer input (also known as barrel pressure or cylinder stress).

[MDN Reference](https://developer.mozilla.org/docs/Web/API/PointerEvent/tangentialPressure)

#### Inherited from

`PointerEvent.tangentialPressure`

***

### target

> `readonly` **target**: `null` \| `EventTarget`

The read-only **`target`** property of the dispatched.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/target)

#### Inherited from

[`PointerInputEvent`](/docs/api/types/pointerinputevent/).[`target`](/docs/api/types/pointerinputevent/#target)

***

### tiltX

> `readonly` **tiltX**: `number`

The **`tiltX`** read-only property of the PointerEvent interface is the angle (in degrees) between the _Y-Z plane_ of the pointer and the screen.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/PointerEvent/tiltX)

#### Inherited from

`PointerEvent.tiltX`

***

### tiltY

> `readonly` **tiltY**: `number`

The **`tiltY`** read-only property of the PointerEvent interface is the angle (in degrees) between the _X-Z plane_ of the pointer and the screen.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/PointerEvent/tiltY)

#### Inherited from

`PointerEvent.tiltY`

***

### timeStamp

> `readonly` **timeStamp**: `number`

The **`timeStamp`** read-only property of the Event interface returns the time (in milliseconds) at which the event was created.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/timeStamp)

#### Inherited from

`PointerEvent.timeStamp`

***

### twist

> `readonly` **twist**: `number`

The **`twist`** read-only property of the (e.g., pen stylus) around its major axis, in degrees.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/PointerEvent/twist)

#### Inherited from

`PointerEvent.twist`

***

### type

> `readonly` **type**: `string`

The **`type`** read-only property of the Event interface returns a string containing the event's type.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/type)

#### Inherited from

`PointerEvent.type`

***

### view

> `readonly` **view**: `null` \| `Window`

The **`UIEvent.view`** read-only property returns the is the Window object the event happened in.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/UIEvent/view)

#### Inherited from

`PointerEvent.view`

***

### ~~which~~

> `readonly` **which**: `number`

The **`UIEvent.which`** read-only property of the UIEvent interface returns a number that indicates which button was pressed on the mouse, or the numeric `keyCode` or the character code (`charCode`) of the key pressed on the keyboard.

:::caution[Deprecated]
[MDN Reference](https://developer.mozilla.org/docs/Web/API/UIEvent/which)
:::

#### Inherited from

`PointerEvent.which`

***

### width

> `readonly` **width**: `number`

The **`width`** read-only property of the geometry along the x-axis, measured in CSS pixels.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/PointerEvent/width)

#### Inherited from

`PointerEvent.width`

***

### x

> `readonly` **x**: `number`

The **`MouseEvent.x`** property is an alias for the MouseEvent.clientX property.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/x)

#### Inherited from

`PointerEvent.x`

***

### y

> `readonly` **y**: `number`

The **`MouseEvent.y`** property is an alias for the MouseEvent.clientY property.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/y)

#### Inherited from

`PointerEvent.y`

## Methods

### composedPath()

> **composedPath**(): `EventTarget`[]

The **`composedPath()`** method of the Event interface returns the event's path which is an array of the objects on which listeners will be invoked.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/composedPath)

#### Returns

`EventTarget`[]

#### Inherited from

`PointerEvent.composedPath`

***

### getCoalescedEvents()

> **getCoalescedEvents**(): `PointerEvent`[]

The **`getCoalescedEvents()`** method of the PointerEvent interface returns a sequence of `PointerEvent` instances that were coalesced (merged) into a single Element/pointermove_event or Element/pointerrawupdate_event event.
Available only in secure contexts.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/PointerEvent/getCoalescedEvents)

#### Returns

`PointerEvent`[]

#### Inherited from

`PointerEvent.getCoalescedEvents`

***

### getModifierState()

> **getModifierState**(`keyArg`): `boolean`

The **`MouseEvent.getModifierState()`** method returns the current state of the specified modifier key: `true` if the modifier is active (i.e., the modifier key is pressed or locked), otherwise, `false`.

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

The **`getPredictedEvents()`** method of the PointerEvent interface returns a sequence of `PointerEvent` instances that are estimated future pointer positions.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/PointerEvent/getPredictedEvents)

#### Returns

`PointerEvent`[]

#### Inherited from

`PointerEvent.getPredictedEvents`

***

### ~~initEvent()~~

> **initEvent**(`type`, `bubbles?`, `cancelable?`): `void`

The **`Event.initEvent()`** method is used to initialize the value of an event created using Document.createEvent().

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

The **`MouseEvent.initMouseEvent()`** method initializes the value of a mouse event once it's been created (normally using the Document.createEvent() method).

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

The **`UIEvent.initUIEvent()`** method initializes a UI event once it's been created.

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

The **`preventDefault()`** method of the Event interface tells the user agent that if the event does not get explicitly handled, its default action should not be taken as it normally would be.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/preventDefault)

#### Returns

`void`

#### Inherited from

`PointerEvent.preventDefault`

***

### stopImmediatePropagation()

> **stopImmediatePropagation**(): `void`

The **`stopImmediatePropagation()`** method of the If several listeners are attached to the same element for the same event type, they are called in the order in which they were added.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/stopImmediatePropagation)

#### Returns

`void`

#### Inherited from

`PointerEvent.stopImmediatePropagation`

***

### stopPropagation()

> **stopPropagation**(): `void`

The **`stopPropagation()`** method of the Event interface prevents further propagation of the current event in the capturing and bubbling phases.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/stopPropagation)

#### Returns

`void`

#### Inherited from

`PointerEvent.stopPropagation`
