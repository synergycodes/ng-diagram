---
editUrl: false
next: false
prev: false
title: "NgDiagramService"
---

## Type Parameters

### TMiddlewares

`TMiddlewares` *extends* `MiddlewareChain` = \[\]

### TMetadata

`TMetadata` *extends* [`Metadata`](/api/other/metadata/)\<`MiddlewaresConfigFromMiddlewares`\<`TMiddlewares`\>\> = [`Metadata`](/api/other/metadata/)\<`MiddlewaresConfigFromMiddlewares`\<`TMiddlewares`\>\>

## Constructors

### Constructor

> **new NgDiagramService**\<`TMiddlewares`, `TMetadata`\>(): `NgDiagramService`\<`TMiddlewares`, `TMetadata`\>

#### Returns

`NgDiagramService`\<`TMiddlewares`, `TMetadata`\>

## Methods

### getActionState()

> **getActionState**(): `Readonly`\<`ActionState`\>

Returns the current action state (readonly)
This includes information about ongoing actions like resizing and linking

#### Returns

`Readonly`\<`ActionState`\>

***

### getCommandHandler()

> **getCommandHandler**(): `CommandHandler`

Returns diagram's command system for programmatic control.

The command handler allows you to:
- Emit system commands (select, move, copy, paste, etc.)
- Listen for command events
- Programmatically control diagram behavior

Use this for implementing custom UI controls
or integrating with external systems that need to control the diagram.

#### Returns

`CommandHandler`

***

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

***

### getEnvironment()

> **getEnvironment**(): `EnvironmentInfo`

Gets the current environment information

#### Returns

`EnvironmentInfo`

***

### getModel()

> **getModel**(): `ModelAdapter`\<[`Metadata`](/api/other/metadata/)\<`MiddlewaresConfigFromMiddlewares`\<`TMiddlewares`\>\>\>

Returns the current model that NgDiagram instance is using

#### Returns

`ModelAdapter`\<[`Metadata`](/api/other/metadata/)\<`MiddlewaresConfigFromMiddlewares`\<`TMiddlewares`\>\>\>

***

### getNearestNodeInRange()

> **getNearestNodeInRange**(`point`, `range`): `null` \| [`Node`](/api/other/node/)

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

`null` \| [`Node`](/api/other/node/)

Nearest node in range or null

***

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

***

### getNodeById()

> **getNodeById**(`nodeId`): `null` \| [`Node`](/api/other/node/)

Gets a node by id

#### Parameters

##### nodeId

`string`

Node id

#### Returns

`null` \| [`Node`](/api/other/node/)

Node

***

### getNodesInRange()

> **getNodesInRange**(`point`, `range`): [`Node`](/api/other/node/)[]

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

[`Node`](/api/other/node/)[]

Array of nodes in range

***

### getScale()

> **getScale**(): `Signal`\<`number`\>

Returns the current zoom scale

#### Returns

`Signal`\<`number`\>

***

### layout()

> **layout**(`layout`): `void`

Sets the layout

#### Parameters

##### layout

`"Tree"`

#### Returns

`void`

***

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

***

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
await ngDiagramService.transaction(async (tx) => {
  await tx.emit('addNode', { node });
  await tx.emit('selectNode', { nodeId: node.id });
});

// Named transaction
await ngDiagramService.transaction('batchUpdate', async (tx) => {
  await tx.emit('updateNodes', { nodes });
  if (error) {
    tx.rollback(); // Discard all changes
  }
});

// With savepoints
await ngDiagramService.transaction(async (tx) => {
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
await ngDiagramService.transaction(async (tx) => {
  await tx.emit('addNode', { node });
  await tx.emit('selectNode', { nodeId: node.id });
});

// Named transaction
await ngDiagramService.transaction('batchUpdate', async (tx) => {
  await tx.emit('updateNodes', { nodes });
  if (error) {
    tx.rollback(); // Discard all changes
  }
});

// With savepoints
await ngDiagramService.transaction(async (tx) => {
  await tx.emit('step1', {});
  tx.savepoint('afterStep1');

  await tx.emit('step2', {});
  if (step2Failed) {
    tx.rollbackTo('afterStep1');
  }
});
```

***

### unregisterMiddleware()

> **unregisterMiddleware**(`name`): `void`

Unregister a middleware from the chain

#### Parameters

##### name

`MiddlewareConfigKeysType`\<`TMiddlewares`\>

Name of the middleware to unregister

#### Returns

`void`

***

### updateMiddlewareConfig()

> **updateMiddlewareConfig**\<`TName`\>(`name`, `config`): `void`

Updates the configuration of a middleware

#### Type Parameters

##### TName

`TName` *extends* `string`

#### Parameters

##### name

`TName`

Name of the middleware to update

##### config

`TMetadata`\[`"middlewaresConfig"`\]\[`TName`\]

#### Returns

`void`
