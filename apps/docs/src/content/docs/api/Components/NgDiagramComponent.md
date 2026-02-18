---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "NgDiagramComponent"
---

Main diagram component for rendering flow diagrams with nodes and edges.

## Implements

- `OnInit`
- `OnDestroy`

## Properties

### clipboardPasted

> **clipboardPasted**: `EventEmitter`\<[`ClipboardPastedEvent`](/docs/api/types/events/clipboardpastedevent/)\>

Event emitted when clipboard content is pasted into the diagram.

This event fires when nodes and edges are added via paste operations,
either through keyboard shortcuts or programmatic paste commands.

***

### config

> **config**: `InputSignal`\<`undefined` \| `DeepPartial`\<[`FlowConfig`](/docs/api/types/configuration/flowconfig/)\>\>

Global configuration options for the diagram.

***

### diagramInit

> **diagramInit**: `EventEmitter`\<[`DiagramInitEvent`](/docs/api/types/events/diagraminitevent/)\>

Event emitted when the diagram initialization is complete.

This event fires after all nodes and edges including their internal parts
(ports, labels) have been measured and positioned.

***

### edgeDrawn

> **edgeDrawn**: `EventEmitter`\<[`EdgeDrawnEvent`](/docs/api/types/events/edgedrawnevent/)\>

Event emitted when a user manually draws an edge between two nodes.

This event only fires for user-initiated edge creation through the UI,
but not for programmatically added edges.

***

### edgeTemplateMap

> **edgeTemplateMap**: `InputSignal`\<[`NgDiagramEdgeTemplateMap`](/docs/api/types/templates/ngdiagramedgetemplatemap/)\>

The edge template map to use for the diagram.
Optional - if not provided, default edge rendering will be used.

***

### groupMembershipChanged

> **groupMembershipChanged**: `EventEmitter`\<[`GroupMembershipChangedEvent`](/docs/api/types/events/groupmembershipchangedevent/)\>

Event emitted when nodes are grouped or ungrouped.

This event fires when the user moves nodes in or out of a group node,
changing their group membership status.

***

### middlewares

> **middlewares**: `InputSignal`\<[`MiddlewareChain`](/docs/api/types/middleware/middlewarechain/)\>

Optional — the initial middlewares to use.
When provided, the middleware list can be modified to add new items,
replace existing ones, or override the defaults.

⚠️ Use with caution — incorrectly implemented custom middlewares
can degrade performance or completely break the data flow.

***

### model

> **model**: `InputSignal`\<[`ModelAdapter`](/docs/api/types/model/modeladapter/)\>

The model to use in the diagram.

***

### nodeDragEnded

> **nodeDragEnded**: `EventEmitter`\<[`NodeDragEndedEvent`](/docs/api/types/events/nodedragendedevent/)\>

Event emitted when a node drag operation ends.

This event fires when the user releases the pointer after dragging nodes.
Nodes will have their final positions when this event is received.

***

### nodeDragStarted

> **nodeDragStarted**: `EventEmitter`\<[`NodeDragStartedEvent`](/docs/api/types/events/nodedragstartedevent/)\>

Event emitted when a node drag operation begins.

This event fires once when the drag threshold is crossed, signaling the
start of a drag operation.

***

### nodeResized

> **nodeResized**: `EventEmitter`\<[`NodeResizedEvent`](/docs/api/types/events/noderesizedevent/)\>

Event emitted when a node or group size changes.

This event fires when a node is resized manually by dragging resize handles
or programmatically using resize methods.

***

### nodeResizeEnded

> **nodeResizeEnded**: `EventEmitter`\<[`NodeResizeEndedEvent`](/docs/api/types/events/noderesizeendedevent/)\>

Event emitted when a node resize operation ends.

This event fires when the user releases the pointer after resizing a node.
The node will have its final size when this event is received.

***

### nodeResizeStarted

> **nodeResizeStarted**: `EventEmitter`\<[`NodeResizeStartedEvent`](/docs/api/types/events/noderesizestartedevent/)\>

Event emitted when a node resize operation begins.

This event fires once when the user starts resizing a node by dragging
a resize handle.

***

### nodeRotateEnded

> **nodeRotateEnded**: `EventEmitter`\<[`NodeRotateEndedEvent`](/docs/api/types/events/noderotateendedevent/)\>

Event emitted when a node rotation operation ends.

This event fires when the user releases the pointer after rotating a node.
The node will have its final angle when this event is received.

***

### nodeRotateStarted

> **nodeRotateStarted**: `EventEmitter`\<[`NodeRotateStartedEvent`](/docs/api/types/events/noderotatestartedevent/)\>

Event emitted when a node rotation operation begins.

This event fires once when the user starts rotating a node by dragging
the rotation handle.

***

### nodeTemplateMap

> **nodeTemplateMap**: `InputSignal`\<[`NgDiagramNodeTemplateMap`](/docs/api/types/templates/ngdiagramnodetemplatemap/)\>

The node template map to use for the diagram.

***

### paletteItemDropped

> **paletteItemDropped**: `EventEmitter`\<[`PaletteItemDroppedEvent`](/docs/api/types/events/paletteitemdroppedevent/)\>

Event emitted when a palette item is dropped onto the diagram.

This event fires when users drag items from the palette and drop them
onto the canvas to create new nodes.

***

### selectionChanged

> **selectionChanged**: `EventEmitter`\<[`SelectionChangedEvent`](/docs/api/types/events/selectionchangedevent/)\>

Event emitted when the selection state changes in the diagram.

This event fires when the user selects or deselects nodes and edges through
clicking or programmatically using the `NgDiagramSelectionService`.

***

### selectionMoved

> **selectionMoved**: `EventEmitter`\<[`SelectionMovedEvent`](/docs/api/types/events/selectionmovedevent/)\>

Event emitted when selected nodes are moved within the diagram.

This event fires when the user moves nodes manually by dragging or
programmatically using the `NgDiagramNodeService.moveNodesBy()` method.

***

### selectionRemoved

> **selectionRemoved**: `EventEmitter`\<[`SelectionRemovedEvent`](/docs/api/types/events/selectionremovedevent/)\>

Event emitted when selected elements are deleted from the diagram.

This event fires when the user deletes nodes and edges using the delete key,
or programmatically through the diagram service.

***

### selectionRotated

> **selectionRotated**: `EventEmitter`\<[`SelectionRotatedEvent`](/docs/api/types/events/selectionrotatedevent/)\>

Event emitted when a node is rotated in the diagram.

This event fires when the user rotates a node manually using the rotation handle
or programmatically using the `NgDiagramNodeService` rotation methods.

***

### viewportChanged

> **viewportChanged**: `EventEmitter`\<[`ViewportChangedEvent`](/docs/api/types/events/viewportchangedevent/)\>

Event emitted when the viewport changes through panning or zooming.

This event fires during pan and zoom operations, including mouse wheel zoom,
and programmatic viewport changes.

***

### viewportPannable

> `readonly` **viewportPannable**: `WritableSignal`\<`boolean`\>

Whether panning is enabled in the diagram.

## Methods

### getNodeTemplate()

> **getNodeTemplate**(`nodeType`): `null` \| `Type$1`\<[`NgDiagramNodeTemplate`](/docs/api/types/templates/ngdiagramnodetemplate/)\<`any`, [`SimpleNode`](/docs/api/types/model/simplenode/)\<`any`\>\>\> \| `Type$1`\<[`NgDiagramGroupNodeTemplate`](/docs/api/types/templates/ngdiagramgroupnodetemplate/)\<`any`\>\>

Retrieves the custom Angular component template for rendering a specific node type.

This method performs a lookup in the node template map to find a custom component
for the given node type. If no custom template is registered, it returns null,
which will cause the diagram to fall back to the default node template.

#### Parameters

##### nodeType

The type identifier of the node to get a template for.

`undefined` | `string`

#### Returns

`null` \| `Type$1`\<[`NgDiagramNodeTemplate`](/docs/api/types/templates/ngdiagramnodetemplate/)\<`any`, [`SimpleNode`](/docs/api/types/model/simplenode/)\<`any`\>\>\> \| `Type$1`\<[`NgDiagramGroupNodeTemplate`](/docs/api/types/templates/ngdiagramgroupnodetemplate/)\<`any`\>\>

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
 - [NgDiagramNodeTemplateMap](/docs/api/types/templates/ngdiagramnodetemplatemap/) - Type definition for the template map

#### Throws

This method does not throw exceptions - it handles all edge cases gracefully
