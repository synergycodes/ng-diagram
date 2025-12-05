---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "EdgeRoutingConfig"
---

Configuration for edge routing behavior.

## Indexable

\[`edgeRoutingName`: `string`\]: `undefined` \| `Record`\<`string`, `unknown`\> \| [`EdgeRoutingName`](/docs/api/types/routing/edgeroutingname/)

Allow custom edge routing configurations.

## Properties

### bezier?

> `optional` **bezier**: `object`

configuration options for bezier routing

#### bezierControlOffset?

> `optional` **bezierControlOffset**: `number`

bezier control point offset

##### Default

```ts
100
```

***

### defaultRouting

> **defaultRouting**: [`EdgeRoutingName`](/docs/api/types/routing/edgeroutingname/)

The default edge routing algorithm to use for edges.
Can be one of the built-in routing names or a custom string for user-defined routing.

#### See

EdgeRoutingName

#### Default

```ts
'orthogonal'
```

***

### orthogonal?

> `optional` **orthogonal**: `object`

configuration options for orthogonal routing

#### firstLastSegmentLength?

> `optional` **firstLastSegmentLength**: `number`

first/last segment length

##### Default

```ts
20
```

#### maxCornerRadius?

> `optional` **maxCornerRadius**: `number`

maximum corner radius

##### Default

```ts
15
```
