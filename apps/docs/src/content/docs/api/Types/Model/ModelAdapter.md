---
editUrl: false
next: false
prev: false
title: "ModelAdapter"
---

Interface for model adapters that handle the data management of a flow diagram

## Methods

### destroy()

> **destroy**(): `void`

Destroy the model adapter and clean up resources
This should be called when the model is no longer needed to prevent memory leaks

#### Returns

`void`

***

### getEdges()

> **getEdges**(): [`Edge`](/docs/api/types/model/edge/)\<`object`\>[]

Get all edges in the model

#### Returns

[`Edge`](/docs/api/types/model/edge/)\<`object`\>[]

***

### getMetadata()

> **getMetadata**(): [`Metadata`](/docs/api/types/model/metadata/)

Get metadata associated with the model

#### Returns

[`Metadata`](/docs/api/types/model/metadata/)

***

### getNodes()

> **getNodes**(): [`Node`](/docs/api/types/model/node/)[]

Get all nodes in the model

#### Returns

[`Node`](/docs/api/types/model/node/)[]

***

### onChange()

> **onChange**(`callback`): `void`

Register a callback to be called when the model changes

#### Parameters

##### callback

(`__namedParameters`) => `void`

Function to be called on changes

#### Returns

`void`

***

### redo()

> **redo**(): `void`

Redo the last undone change

#### Returns

`void`

***

### toJSON()

> **toJSON**(): `string`

Convert the model to a JSON string

#### Returns

`string`

***

### undo()

> **undo**(): `void`

Undo the last change

#### Returns

`void`

***

### unregisterOnChange()

> **unregisterOnChange**(`callback`): `void`

Unregister a callback from being called when the model changes

#### Parameters

##### callback

(`__namedParameters`) => `void`

Function to unregister from changes

#### Returns

`void`

***

### updateEdges()

> **updateEdges**(`edges`): `void`

Update edges in the model

#### Parameters

##### edges

[`Edge`](/docs/api/types/model/edge/)\<`object`\>[]

Array of edges to set

#### Returns

`void`

***

### updateMetadata()

> **updateMetadata**(`metadata`): `void`

Set metadata for the model

#### Parameters

##### metadata

[`Metadata`](/docs/api/types/model/metadata/)

Metadata to set

#### Returns

`void`

***

### updateNodes()

> **updateNodes**(`nodes`): `void`

Update nodes in the model

#### Parameters

##### nodes

[`Node`](/docs/api/types/model/node/)[]

Array of nodes to set

#### Returns

`void`
