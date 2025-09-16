---
editUrl: false
next: false
prev: false
title: "NgDiagramComponent"
---

Diagram component

## Implements

- `OnInit`
- `OnDestroy`

## Properties

### config

> **config**: `InputSignal`\<`undefined` \| `DeepPartial`\<`FlowConfig`\>\>

Global configuration options for the diagram.

***

### diagramInit

> **diagramInit**: `EventEmitter`\<[`DiagramInitEvent`](/docs/api/types/diagraminitevent/)\>

Event emitted when the diagram is initialized and all nodes and edges including their internal parts are measured

***

### edgeDrawn

> **edgeDrawn**: `EventEmitter`\<[`EdgeDrawnEvent`](/docs/api/types/edgedrawnevent/)\>

Event emitted when a user manually draws an edge between two nodes

***

### edgeTemplateMap

> **edgeTemplateMap**: `InputSignal`\<`NgDiagramEdgeTemplateMap`\>

The edge template map to use for the diagram.
Optional - if not provided, default edge rendering will be used.

***

### middlewares

> **middlewares**: `InputSignal`\<[`MiddlewareChain`](/docs/api/other/middlewarechain/)\>

Optional — the initial middlewares to use.
When provided, the middleware list can be modified to add new items,
replace existing ones, or override the defaults.

⚠️ Use with caution — incorrectly implemented custom middlewares
can degrade performance or completely break the data flow.

***

### model

> **model**: `InputSignal`\<[`ModelAdapter`](/docs/api/other/modeladapter/)\>

The model to use in the diagram.

***

### nodeTemplateMap

> **nodeTemplateMap**: `InputSignal`\<`NgDiagramNodeTemplateMap`\>

The node template map to use for the diagram.

***

### selectionChanged

> **selectionChanged**: `EventEmitter`\<[`SelectionChangedEvent`](/docs/api/types/selectionchangedevent/)\>

Event emitted when selection changes

***

### selectionMoved

> **selectionMoved**: `EventEmitter`\<[`SelectionMovedEvent`](/docs/api/types/selectionmovedevent/)\>

Event emitted when selected nodes are moved

***

### viewportChanged

> **viewportChanged**: `EventEmitter`\<[`ViewportChangedEvent`](/docs/api/types/viewportchangedevent/)\>

Event emitted when viewport changes (pan/zoom)

## Methods

### getNodeTemplate()

> **getNodeTemplate**(`nodeType`): `null` \| `Type$1`\<`NgDiagramNodeTemplate`\<`any`, `SimpleNode`\<`any`\>\>\> \| `Type$1`\<`NgDiagramGroupNodeTemplate`\<`any`\>\>

Retrieves the custom Angular component template for rendering a specific node type.

This method performs a lookup in the node template map to find a custom component
for the given node type. If no custom template is registered, it returns null,
which will cause the diagram to fall back to the default node template.

#### Parameters

##### nodeType

The type identifier of the node to get a template for.

`undefined` | `string`

#### Returns

`null` \| `Type$1`\<`NgDiagramNodeTemplate`\<`any`, `SimpleNode`\<`any`\>\>\> \| `Type$1`\<`NgDiagramGroupNodeTemplate`\<`any`\>\>

The Angular component class registered for the node type, or
null if no custom template is registered for this type

#### Example

Basic usage in template:
```typescript
// In your component
const nodeTemplates = new Map([
  ['database', DatabaseNodeComponent],
  ['api', ApiNodeComponent]
]);

// The method will return DatabaseNodeComponent for database nodes
const dbTemplate = this.getNodeTemplate('database'); // Returns DatabaseNodeComponent
```

#### See

 - [nodeTemplateMap](/docs/api/components/ngdiagramcomponent/#nodetemplatemap) - The input property where templates are registered
 - NgDiagramNodeTemplateMap - Type definition for the template map

#### Throws

This method does not throw exceptions - it handles all edge cases gracefully

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
