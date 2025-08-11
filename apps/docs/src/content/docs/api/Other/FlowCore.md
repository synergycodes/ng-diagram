---
editUrl: false
next: false
prev: false
title: 'FlowCore'
---

## Type Parameters

### TMiddlewares

`TMiddlewares` _extends_ `MiddlewareChain` = \[\]

### TMetadata

`TMetadata` _extends_ [`Metadata`](/api/other/metadata/)\<`MiddlewaresConfigFromMiddlewares`\<`TMiddlewares`\>\> = [`Metadata`](/api/other/metadata/)\<`MiddlewaresConfigFromMiddlewares`\<`TMiddlewares`\>\>

## Properties

### actionStateManager

> `readonly` **actionStateManager**: `ActionStateManager`

---

### commandHandler

> `readonly` **commandHandler**: `CommandHandler`

---

### config

> `readonly` **config**: `FlowConfig`

---

### environment

> `readonly` **environment**: `EnvironmentInfo`

---

### getFlowOffset()

> `readonly` **getFlowOffset**: () => `object`

#### Returns

`object`

##### x

> **x**: `number`

##### y

> **y**: `number`

---

### inputEventsRouter

> `readonly` **inputEventsRouter**: `InputEventsRouter`

---

### middlewareManager

> `readonly` **middlewareManager**: `MiddlewareManager`\<`TMiddlewares`, `TMetadata`\>

---

### modelLookup

> `readonly` **modelLookup**: `ModelLookup`

---

### portBatchProcessor

> `readonly` **portBatchProcessor**: `PortBatchProcessor`

---

### spatialHash

> `readonly` **spatialHash**: `SpatialHash`

---

### transactionManager

> `readonly` **transactionManager**: `TransactionManager`

## Accessors

### updater

#### Get Signature

> **get** **updater**(): `Updater`

##### Returns

`Updater`

## Methods

### applyUpdate()

> **applyUpdate**(`stateUpdate`, `modelActionType`): `Promise`\<`void`\>

Applies an update to the flow state

#### Parameters

##### stateUpdate

`FlowStateUpdate`

Partial state to apply

##### modelActionType

`LooseAutocomplete`\<`ModelActionType`\>

Type of model action to apply

#### Returns

`Promise`\<`void`\>

---

### clientToFlowPosition()

> **clientToFlowPosition**(`clientPosition`): `object`

Converts a client position to a flow position

#### Parameters

##### clientPosition

Client position

###### x

`number`

###### y

`number`

#### Returns

`object`

Flow position

##### x

> **x**: `number`

##### y

> **y**: `number`

---

### destroy()

> **destroy**(): `void`

#### Returns

`void`

---

### flowToClientPosition()

> **flowToClientPosition**(`flowPosition`): `object`

Converts a flow position to a client position

#### Parameters

##### flowPosition

Flow position

###### x

`number`

###### y

`number`

#### Returns

`object`

Client position

##### x

> **x**: `number`

##### y

> **y**: `number`

---

### getEdgeById()

> **getEdgeById**(`edgeId`): `null` \| [`Edge`](/api/other/edge/)

Gets an edge by id

#### Parameters

##### edgeId

`string`

Edge id

#### Returns

`null` \| [`Edge`](/api/other/edge/)

Edge

---

### getEnvironment()

> **getEnvironment**(): `EnvironmentInfo`

Gets the current environment information

#### Returns

`EnvironmentInfo`

---

### getNearestNodeInRange()

> **getNearestNodeInRange**(`point`, `range`): `null` \| [`Node`](/api/types/node/)

Gets the nearest node in a range from a point

#### Parameters

##### point

Point to check from

###### x

`number`

###### y

`number`

##### range

`number`

Range to check in

#### Returns

`null` \| [`Node`](/api/types/node/)

Nearest node in range or null

---

### getNearestPortInRange()

> **getNearestPortInRange**(`point`, `range`): `null` \| `Port`

Gets the nearest port in a range from a point

#### Parameters

##### point

Point to check from

###### x

`number`

###### y

`number`

##### range

`number`

Range to check in

#### Returns

`null` \| `Port`

Nearest port in range or null

---

### getNodeById()

> **getNodeById**(`nodeId`): `null` \| [`Node`](/api/types/node/)

Gets a node by id

#### Parameters

##### nodeId

`string`

Node id

#### Returns

`null` \| [`Node`](/api/types/node/)

Node

---

### getNodesInRange()

> **getNodesInRange**(`point`, `range`): [`Node`](/api/types/node/)[]

Gets all nodes in a range from a point

#### Parameters

##### point

Point to check from

###### x

`number`

###### y

`number`

##### range

`number`

Range to check in

#### Returns

[`Node`](/api/types/node/)[]

Array of nodes in range

---

### getScale()

> **getScale**(): `number`

Returns the current zoom scale

#### Returns

`number`

---

### getState()

> **getState**(): `FlowState`\<`TMetadata`\>

Gets the current state of the flow

#### Returns

`FlowState`\<`TMetadata`\>

---

### layout()

> **layout**(`layout`): `void`

Sets the layout

#### Parameters

##### layout

`"Tree"`

#### Returns

`void`

---

### registerMiddleware()

> **registerMiddleware**(`middleware`): () => `void`

Registers a new middleware in the chain

#### Parameters

##### middleware

[`Middleware`](/api/other/middleware/)

Middleware to register

#### Returns

Function to unregister the middleware

> (): `void`

##### Returns

`void`

---

### setDebugMode()

> **setDebugMode**(`debugMode`): `void`

#### Parameters

##### debugMode

`boolean`

#### Returns

`void`

---

### setState()

> **setState**(`state`): `void`

Sets the current state of the flow

#### Parameters

##### state

`FlowState`\<`TMetadata`\>

State to set

#### Returns

`void`

---

### transaction()

#### Call Signature

> **transaction**(`callback`): `Promise`\<`TransactionResult`\>

Executes a function within a transaction context.
All state updates within the callback are batched and applied atomically.

##### Parameters

###### callback

`TransactionCallback`

##### Returns

`Promise`\<`TransactionResult`\>

##### Example

```ts
// Simple transaction
await flowCore.transaction(async (tx) => {
  await tx.emit('addNode', { node });
  await tx.emit('selectNode', { nodeId: node.id });
});

// Named transaction
await flowCore.transaction('batchUpdate', async (tx) => {
  await tx.emit('updateNodes', { nodes });
  if (error) {
    tx.rollback(); // Discard all changes
  }
});

// With savepoints
await flowCore.transaction(async (tx) => {
  await tx.emit('step1', {});
  tx.savepoint('afterStep1');

  await tx.emit('step2', {});
  if (step2Failed) {
    tx.rollbackTo('afterStep1');
  }
});
```

#### Call Signature

> **transaction**(`name`, `callback`): `Promise`\<`TransactionResult`\>

Executes a function within a transaction context.
All state updates within the callback are batched and applied atomically.

##### Parameters

###### name

`ModelActionType`

###### callback

`TransactionCallback`

##### Returns

`Promise`\<`TransactionResult`\>

##### Example

```ts
// Simple transaction
await flowCore.transaction(async (tx) => {
  await tx.emit('addNode', { node });
  await tx.emit('selectNode', { nodeId: node.id });
});

// Named transaction
await flowCore.transaction('batchUpdate', async (tx) => {
  await tx.emit('updateNodes', { nodes });
  if (error) {
    tx.rollback(); // Discard all changes
  }
});

// With savepoints
await flowCore.transaction(async (tx) => {
  await tx.emit('step1', {});
  tx.savepoint('afterStep1');

  await tx.emit('step2', {});
  if (step2Failed) {
    tx.rollbackTo('afterStep1');
  }
});
```

---

### unregisterMiddleware()

> **unregisterMiddleware**(`name`): `void`

Unregister a middleware from the chain

#### Parameters

##### name

`MiddlewareConfigKeys`\<`TMiddlewares`\>

Name of the middleware to unregister

#### Returns

`void`

---

### updateMiddlewareConfig()

> **updateMiddlewareConfig**\<`TName`\>(`name`, `config`): `void`

Updates the configuration of a middleware

#### Type Parameters

##### TName

`TName` _extends_ `string`

#### Parameters

##### name

`TName`

Name of the middleware to update

##### config

`TMetadata`\[`"middlewaresConfig"`\]\[`TName`\]

Config of the middleware to update

#### Returns

`void`
