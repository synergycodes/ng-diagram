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

### clipboardPasted

> **clipboardPasted**: `EventEmitter`\<[`ClipboardPastedEvent`](/docs/api/types/clipboardpastedevent/)\>

Event emitted when elements are pasted via clipboard operations
This event carries information about the pasted nodes and edges.

***

### config

> **config**: `InputSignal`\<`undefined` \| `DeepPartial`\<[`FlowConfig`](/docs/api/types/flowconfig/)\>\>

Global configuration options for the diagram.

***

### diagramInit

> **diagramInit**: `EventEmitter`\<[`DiagramInitEvent`](/docs/api/types/diagraminitevent/)\>

Event emitted when the diagram is initialized.
It carries information about all nodes and edges in the diagram, and viewport state.

***

### edgeDrawn

> **edgeDrawn**: `EventEmitter`\<[`EdgeDrawnEvent`](/docs/api/types/edgedrawnevent/)\>

Event emitted when a user manually draws an edge between two nodes
It carries information about the newly created edge, source and target nodes and ports that are connected by the edge.

***

### edgeTemplateMap

> **edgeTemplateMap**: `InputSignal`\<[`NgDiagramEdgeTemplateMap`](/docs/api/types/ngdiagramedgetemplatemap/)\>

The edge template map to use for the diagram.
Optional - if not provided, default edge rendering will be used.

***

### middlewares

> **middlewares**: `InputSignal`\<[`MiddlewareChain`](/docs/api/types/middlewarechain/)\>

Optional — the initial middlewares to use.
When provided, the middleware list can be modified to add new items,
replace existing ones, or override the defaults.

⚠️ Use with caution — incorrectly implemented custom middlewares
can degrade performance or completely break the data flow.

***

### model

> **model**: `InputSignal`\<[`ModelAdapter`](/docs/api/types/modeladapter/)\>

The model to use in the diagram.

***

### nodeResized

> **nodeResized**: `EventEmitter`\<[`NodeResizedEvent`](/docs/api/types/noderesizedevent/)\>

Event emitted when node or group is resized through user interaction on UI
This event carries information about the resized node, its new size and previous size.

***

### nodeTemplateMap

> **nodeTemplateMap**: `InputSignal`\<[`NgDiagramNodeTemplateMap`](/docs/api/types/ngdiagramnodetemplatemap/)\>

The node template map to use for the diagram.

***

### paletteItemDropped

> **paletteItemDropped**: `EventEmitter`\<[`PaletteItemDroppedEvent`](/docs/api/types/paletteitemdroppedevent/)\>

Event emitted when a palette item (node or group) is dropped into the diagram.
This event carries information about the newly created node and its drop position.

***

### selectionChanged

> **selectionChanged**: `EventEmitter`\<[`SelectionChangedEvent`](/docs/api/types/selectionchangedevent/)\>

Event emitted when selection changes
This event fires when the user selects or deselects nodes and edges
It carries information about the newly selected and deselected elements, and previous selection state.

***

### selectionGroupChanged

> **selectionGroupChanged**: `EventEmitter`\<[`SelectionGroupChangedEvent`](/docs/api/types/selectiongroupchangedevent/)\>

Event emitted when nodes are grouped or ungrouped.
This event fires when the user moves nodes in or out of a group node.
It carries information about the affected target group node and the nodes that were added or removed from the group.
Depending on the operation, target group node may be undefined (for ungrouping operations).

***

### selectionMoved

> **selectionMoved**: `EventEmitter`\<[`SelectionMovedEvent`](/docs/api/types/selectionmovedevent/)\>

Event emitted when selected nodes are moved
It carries information about the moved nodes and their new positions

***

### selectionRemoved

> **selectionRemoved**: `EventEmitter`\<[`SelectionRemovedEvent`](/docs/api/types/selectionremovedevent/)\>

Event emitted when selected edges and nodes are removed from the diagram within deletion operation
It carries information about the deleted nodes and edges.

***

### selectionRotated

> **selectionRotated**: `EventEmitter`\<[`SelectionRotatedEvent`](/docs/api/types/selectionrotatedevent/)\>

Event emitted when a node is rotated
It carries information about the rotated node and its new, and old rotation angle.

***

### viewportChanged

> **viewportChanged**: `EventEmitter`\<[`ViewportChangedEvent`](/docs/api/types/viewportchangedevent/)\>

Event emitted when viewport changes.
This event fires during pan and zoom operations.
It carries information about the new and old viewport state.

## Methods

### getNodeTemplate()

> **getNodeTemplate**(`nodeType`): `null` \| `Type$1`\<[`NgDiagramNodeTemplate`](/docs/api/types/ngdiagramnodetemplate/)\<`any`, [`SimpleNode`](/docs/api/types/simplenode/)\<`any`\>\>\> \| `Type$1`\<[`NgDiagramGroupNodeTemplate`](/docs/api/types/ngdiagramgroupnodetemplate/)\<`any`\>\>

Retrieves the custom Angular component template for rendering a specific node type.

This method performs a lookup in the node template map to find a custom component
for the given node type. If no custom template is registered, it returns null,
which will cause the diagram to fall back to the default node template.

#### Parameters

##### nodeType

The type identifier of the node to get a template for.

`undefined` | `string`

#### Returns

`null` \| `Type$1`\<[`NgDiagramNodeTemplate`](/docs/api/types/ngdiagramnodetemplate/)\<`any`, [`SimpleNode`](/docs/api/types/simplenode/)\<`any`\>\>\> \| `Type$1`\<[`NgDiagramGroupNodeTemplate`](/docs/api/types/ngdiagramgroupnodetemplate/)\<`any`\>\>

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
 - [NgDiagramNodeTemplateMap](/docs/api/types/ngdiagramnodetemplatemap/) - Type definition for the template map

#### Throws

This method does not throw exceptions - it handles all edge cases gracefully
