---
editUrl: false
next: false
prev: false
title: "NgDiagramService"
---

The `NgDiagramService` provides advanced access to the diagram's core API,
including configuration, layout, event management, routing, transactions, and more.

## Example usage
```typescript
private ngDiagramService = inject(NgDiagramService);

// Check if diagram is initialized
const ready = this.ngDiagramService.isInitialized();

// Update configuration
this.ngDiagramService.updateConfig({ gridSize: 20 });
```

## Extends

- `NgDiagramBaseService`

## Properties

### actionState

> `readonly` **actionState**: `Signal`\<`Readonly`\<[`ActionState`](/docs/api/types/actionstate/)\>\>

Reactive signal that tracks the current action state.
Updates automatically when actions like resizing, rotating, or linking start/end.

***

### isInitialized

> **isInitialized**: `Signal`\<`boolean`\>

Returns whether the diagram is fully initialized and all elements are measured.
This signal is set to `true` when the `diagramInit` event fires.

## Methods

### addEventListener()

> **addEventListener**\<`K`\>(`event`, `callback`): `UnsubscribeFn`

Add an event listener for a diagram event.

#### Type Parameters

##### K

`K` *extends* keyof [`DiagramEventMap`](/docs/api/types/diagrameventmap/)

#### Parameters

##### event

`K`

The event name.

##### callback

`EventListener`\<[`DiagramEventMap`](/docs/api/types/diagrameventmap/)\[`K`\]\>

The callback to invoke when the event is emitted.

#### Returns

`UnsubscribeFn`

A function to unsubscribe.

#### Example

```ts
const unsubscribe = ngDiagramService.addEventListener('selectionChanged', (event) => {
  console.log('Selection changed', event.selectedNodes);
});
```

***

### addEventListenerOnce()

> **addEventListenerOnce**\<`K`\>(`event`, `callback`): `UnsubscribeFn`

Add an event listener that will only fire once.

#### Type Parameters

##### K

`K` *extends* keyof [`DiagramEventMap`](/docs/api/types/diagrameventmap/)

#### Parameters

##### event

`K`

The event name.

##### callback

`EventListener`\<[`DiagramEventMap`](/docs/api/types/diagrameventmap/)\[`K`\]\>

The callback to invoke when the event is emitted.

#### Returns

`UnsubscribeFn`

A function to unsubscribe.

#### Example

```ts
ngDiagramService.addEventListenerOnce('diagramInit', (event) => {
  console.log('Diagram initialized', event);
});
```

***

### areEventsEnabled()

> **areEventsEnabled**(): `boolean`

Check if event emissions are enabled.

#### Returns

`boolean`

True if events are enabled.

***

### getActionState()

> **getActionState**(): `Readonly`\<[`ActionState`](/docs/api/types/actionstate/)\>

Returns the current action state (readonly).
This includes information about ongoing actions like resizing and linking.

#### Returns

`Readonly`\<[`ActionState`](/docs/api/types/actionstate/)\>

The current action state.

***

### getConfig()

> **getConfig**(): `Readonly`\<[`NgDiagramConfig`](/docs/api/types/ngdiagramconfig/)\>

Returns the current configuration (readonly).
The returned object cannot be modified directly —
use [updateConfig](/docs/api/services/ngdiagramservice/#updateconfig) to make changes.

#### Returns

`Readonly`\<[`NgDiagramConfig`](/docs/api/types/ngdiagramconfig/)\>

The current configuration.

***

### getDefaultRouting()

> **getDefaultRouting**(): `string`

Gets the current default routing name.

#### Returns

`string`

Name of the default routing.

***

### getEnvironment()

> **getEnvironment**(): [`EnvironmentInfo`](/docs/api/types/environmentinfo/)

Gets the current environment information.

#### Returns

[`EnvironmentInfo`](/docs/api/types/environmentinfo/)

The environment info object.

***

### getRegisteredRoutings()

> **getRegisteredRoutings**(): `string`[]

Gets all registered routing names.

#### Returns

`string`[]

Array of registered routing names.

***

### hasEventListeners()

> **hasEventListeners**(`event`): `boolean`

Check if there are any listeners for an event.

#### Parameters

##### event

keyof [`DiagramEventMap`](/docs/api/types/diagrameventmap/)

The event name.

#### Returns

`boolean`

True if there are listeners.

#### Example

```ts
if (ngDiagramService.hasEventListeners('selectionChanged')) {
  // There are listeners for selection changes
}
```

***

### registerMiddleware()

> **registerMiddleware**(`middleware`): () => `void`

Registers a new middleware in the chain.

#### Parameters

##### middleware

[`Middleware`](/docs/api/types/middleware/)

Middleware to register.

#### Returns

Function to unregister the middleware.

> (): `void`

##### Returns

`void`

***

### registerRouting()

> **registerRouting**(`routing`): `void`

Registers a custom routing implementation.

#### Parameters

##### routing

[`EdgeRouting`](/docs/api/other/edgerouting/)

Routing implementation to register.

#### Returns

`void`

#### Example

```ts
const customRouting: Routing = {
  name: 'custom',
  computePoints: (source, target) => [...],
  computeSvgPath: (points) => '...'
};
ngDiagramService.registerRouting(customRouting);
```

***

### removeAllEventListeners()

> **removeAllEventListeners**(): `void`

Remove all event listeners.

#### Returns

`void`

#### Example

```ts
ngDiagramService.removeAllEventListeners();
```

***

### removeEventListener()

> **removeEventListener**\<`K`\>(`event`, `callback?`): `void`

Remove an event listener.

#### Type Parameters

##### K

`K` *extends* keyof [`DiagramEventMap`](/docs/api/types/diagrameventmap/)

#### Parameters

##### event

`K`

The event name.

##### callback?

`EventListener`\<[`DiagramEventMap`](/docs/api/types/diagrameventmap/)\[`K`\]\>

Optional specific callback to remove.

#### Returns

`void`

#### Example

```ts
// Remove all listeners for an event
ngDiagramService.removeEventListener('selectionChanged');

// Remove a specific listener
ngDiagramService.removeEventListener('selectionChanged', myCallback);
```

***

### setDefaultRouting()

> **setDefaultRouting**(`name`): `void`

Sets the default routing to use when not specified on edges.

#### Parameters

##### name

`string`

Name of the routing to set as default.

#### Returns

`void`

***

### setEventsEnabled()

> **setEventsEnabled**(`enabled`): `void`

Enable or disable event emissions.

#### Parameters

##### enabled

`boolean`

Whether events should be emitted.

#### Returns

`void`

#### Example

```ts
// Disable all events
ngDiagramService.setEventsEnabled(false);

// Re-enable events
ngDiagramService.setEventsEnabled(true);
```

***

### startLinking()

> **startLinking**(`node`, `portId`): `void`

Call this method to start linking from your custom logic.

#### Parameters

##### node

[`Node`](/docs/api/types/node/)

The node from which the linking starts.

##### portId

`string`

The port ID from which the linking starts.

#### Returns

`void`

***

### transaction()

> **transaction**(`callback`): `void`

Executes a function within a transaction context.
All state updates within the callback are batched and applied atomically.

#### Parameters

##### callback

() => `void`

#### Returns

`void`

#### Example

```ts
this.ngDiagramService.transaction(() => {
 this.ngDiagramModelService.addNodes([node1, node2]);
 this.ngDiagramModelService.addEdges([edge1]);
});
```

***

### unregisterMiddleware()

> **unregisterMiddleware**(`name`): `void`

Unregister a middleware from the chain.

#### Parameters

##### name

`string`

Name of the middleware to unregister.

#### Returns

`void`

***

### unregisterRouting()

> **unregisterRouting**(`name`): `void`

Unregisters a routing implementation.

#### Parameters

##### name

`string`

Name of the routing to unregister.

#### Returns

`void`

***

### updateConfig()

> **updateConfig**(`config`): `void`

Updates the current configuration.

#### Parameters

##### config

`Partial`\<[`NgDiagramConfig`](/docs/api/types/ngdiagramconfig/)\>

Partial configuration object containing properties to update.

#### Returns

`void`
