---
version: "since v1.0.0"
editUrl: false
next: false
prev: false
title: "NgDiagramMinimapNodeTemplateMap"
---

Map that associates node type names with their corresponding minimap Angular component classes.
Used by ng-diagram-minimap to determine which custom component to render based on node type.

## Example

```typescript
const minimapTemplateMap = new NgDiagramMinimapNodeTemplateMap([
  ['database', DatabaseMinimapNodeComponent],
  ['api', ApiMinimapNodeComponent],
]);

// Usage in template:
<ng-diagram-minimap [minimapNodeTemplateMap]="minimapTemplateMap" />
```

## Extends

- `Map`\<`string`, `Type`\<[`NgDiagramMinimapNodeTemplate`](/docs/api/types/minimap/ngdiagramminimapnodetemplate/)\>\>

## Properties

### size

> `readonly` **size**: `number`

#### Returns

the number of elements in the Map.

#### Inherited from

`Map.size`

## Methods

### \[iterator\]()

> **\[iterator\]**(): `MapIterator`\<\[`string`, `Type$1`\<[`NgDiagramMinimapNodeTemplate`](/docs/api/types/minimap/ngdiagramminimapnodetemplate/)\>\]\>

Returns an iterable of entries in the map.

#### Returns

`MapIterator`\<\[`string`, `Type$1`\<[`NgDiagramMinimapNodeTemplate`](/docs/api/types/minimap/ngdiagramminimapnodetemplate/)\>\]\>

#### Inherited from

`Map.[iterator]`

***

### delete()

> **delete**(`key`): `boolean`

#### Parameters

##### key

`string`

#### Returns

`boolean`

true if an element in the Map existed and has been removed, or false if the element does not exist.

#### Inherited from

`Map.delete`

***

### entries()

> **entries**(): `MapIterator`\<\[`string`, `Type$1`\<[`NgDiagramMinimapNodeTemplate`](/docs/api/types/minimap/ngdiagramminimapnodetemplate/)\>\]\>

Returns an iterable of key, value pairs for every entry in the map.

#### Returns

`MapIterator`\<\[`string`, `Type$1`\<[`NgDiagramMinimapNodeTemplate`](/docs/api/types/minimap/ngdiagramminimapnodetemplate/)\>\]\>

#### Inherited from

`Map.entries`

***

### forEach()

> **forEach**(`callbackfn`, `thisArg?`): `void`

Executes a provided function once per each key/value pair in the Map, in insertion order.

#### Parameters

##### callbackfn

(`value`, `key`, `map`) => `void`

##### thisArg?

`any`

#### Returns

`void`

#### Inherited from

`Map.forEach`

***

### get()

> **get**(`key`): `undefined` \| `Type$1`\<[`NgDiagramMinimapNodeTemplate`](/docs/api/types/minimap/ngdiagramminimapnodetemplate/)\>

Returns a specified element from the Map object. If the value that is associated to the provided key is an object, then you will get a reference to that object and any change made to that object will effectively modify it inside the Map.

#### Parameters

##### key

`string`

#### Returns

`undefined` \| `Type$1`\<[`NgDiagramMinimapNodeTemplate`](/docs/api/types/minimap/ngdiagramminimapnodetemplate/)\>

Returns the element associated with the specified key. If no element is associated with the specified key, undefined is returned.

#### Inherited from

`Map.get`

***

### has()

> **has**(`key`): `boolean`

#### Parameters

##### key

`string`

#### Returns

`boolean`

boolean indicating whether an element with the specified key exists or not.

#### Inherited from

`Map.has`

***

### keys()

> **keys**(): `MapIterator`\<`string`\>

Returns an iterable of keys in the map

#### Returns

`MapIterator`\<`string`\>

#### Inherited from

`Map.keys`

***

### set()

> **set**(`key`, `value`): `this`

Adds a new element with a specified key and value to the Map. If an element with the same key already exists, the element will be updated.

#### Parameters

##### key

`string`

##### value

`Type$1`

#### Returns

`this`

#### Inherited from

`Map.set`

***

### values()

> **values**(): `MapIterator`\<`Type$1`\<[`NgDiagramMinimapNodeTemplate`](/docs/api/types/minimap/ngdiagramminimapnodetemplate/)\>\>

Returns an iterable of values in the map

#### Returns

`MapIterator`\<`Type$1`\<[`NgDiagramMinimapNodeTemplate`](/docs/api/types/minimap/ngdiagramminimapnodetemplate/)\>\>

#### Inherited from

`Map.values`
