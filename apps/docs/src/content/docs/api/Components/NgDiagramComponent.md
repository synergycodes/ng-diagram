---
editUrl: false
next: false
prev: false
title: "NgDiagramComponent"
---

Diagram component

## Type Parameters

### TMiddlewares

`TMiddlewares` *extends* `MiddlewareChain` = \[\]

### TAdapter

`TAdapter` *extends* `ModelAdapter`\<[`Metadata`](/api/other/metadata/)\<`MiddlewaresConfigFromMiddlewares`\<`TMiddlewares`\>\>\> = `ModelAdapter`\<[`Metadata`](/api/other/metadata/)\<`MiddlewaresConfigFromMiddlewares`\<`TMiddlewares`\>\>\>

## Implements

- `OnInit`
- `OnDestroy`

## Constructors

### Constructor

> **new NgDiagramComponent**\<`TMiddlewares`, `TAdapter`\>(): `NgDiagramComponent`\<`TMiddlewares`, `TAdapter`\>

#### Returns

`NgDiagramComponent`\<`TMiddlewares`, `TAdapter`\>

## Properties

### config

> **config**: `InputSignal`\<`undefined` \| `DeepPartial`\<`FlowConfig`\>\>

Global configuration options for the diagram.

***

### debugMode

> **debugMode**: `InputSignal`\<`boolean`\>

Enables or disables debug mode for the diagram.
When enabled, additional console logs are printed.

***

### edges

> **edges**: `WritableSignal`\<[`Edge`](/api/other/edge/)[]\>

***

### edgeTemplateMap

> **edgeTemplateMap**: `InputSignal`\<[`NgDiagramEdgeTemplateMap`](/api/other/ngdiagramedgetemplatemap/)\>

The edge template map to use for the diagram.
Optional - if not provided, default edge rendering will be used.

***

### middlewares

> **middlewares**: `InputSignal`\<`TMiddlewares`\>

Optional — the initial middlewares to use.
When provided, the middleware list can be modified to add new items,
replace existing ones, or override the defaults.

⚠️ Use with caution — incorrectly implemented custom middlewares
can degrade performance or completely break the data flow.

***

### model

> **model**: `InputSignal`\<`TAdapter`\>

The model to use in the diagram.

***

### nodes

> **nodes**: `WritableSignal`\<[`Node`](/api/other/node/)[]\>

***

### nodeTemplateMap

> **nodeTemplateMap**: `InputSignal`\<[`NgDiagramNodeTemplateMap`](/api/other/ngdiagramnodetemplatemap/)\>

The node template map to use for the diagram.

***

### viewport

> **viewport**: `WritableSignal`\<`Viewport`\>

## Methods

### getBoundingClientRect()

> **getBoundingClientRect**(): `DOMRect`

#### Returns

`DOMRect`

***

### getEdgeTemplate()

> **getEdgeTemplate**(`edgeType`): `null` \| `Type$1`\<[`NgDiagramEdgeTemplate`](/api/other/ngdiagramedgetemplate/)\>

#### Parameters

##### edgeType

`undefined` | `string`

#### Returns

`null` \| `Type$1`\<[`NgDiagramEdgeTemplate`](/api/other/ngdiagramedgetemplate/)\>

***

### getNodeTemplate()

> **getNodeTemplate**(`nodeType`): `null` \| `Type$1`\<[`NgDiagramNodeTemplate`](/api/other/ngdiagramnodetemplate/)\<`SimpleNode`\>\> \| `Type$1`\<[`NgDiagramNodeTemplate`](/api/other/ngdiagramnodetemplate/)\<[`GroupNode`](/api/other/groupnode/)\>\>

#### Parameters

##### nodeType

`undefined` | `string`

#### Returns

`null` \| `Type$1`\<[`NgDiagramNodeTemplate`](/api/other/ngdiagramnodetemplate/)\<`SimpleNode`\>\> \| `Type$1`\<[`NgDiagramNodeTemplate`](/api/other/ngdiagramnodetemplate/)\<[`GroupNode`](/api/other/groupnode/)\>\>

***

### isGroup()

> **isGroup**(`node`): `node is GroupNode`

#### Parameters

##### node

[`Node`](/api/other/node/)

#### Returns

`node is GroupNode`

***

### ngOnDestroy()

> **ngOnDestroy**(): `void`

A callback method that performs custom clean-up, invoked immediately
before a directive, pipe, or service instance is destroyed.

#### Returns

`void`

#### Implementation of

`OnDestroy.ngOnDestroy`

***

### ngOnInit()

> **ngOnInit**(): `void`

A callback method that is invoked immediately after the
default change detector has checked the directive's
data-bound properties for the first time,
and before any of the view or content children have been checked.
It is invoked only once when the directive is instantiated.

#### Returns

`void`

#### Implementation of

`OnInit.ngOnInit`
