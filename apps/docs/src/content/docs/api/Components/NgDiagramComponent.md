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

Event emitted when clipboard content is pasted into the diagram.

This event fires when nodes and edges are added via paste operations,
either through keyboard shortcuts or programmatic paste commands.

***

### config

> **config**: `InputSignal`\<`undefined` \| `DeepPartial`\<[`FlowConfig`](/docs/api/types/flowconfig/)\>\>

Global configuration options for the diagram.

***

### diagramInit

> **diagramInit**: `EventEmitter`\<[`DiagramInitEvent`](/docs/api/types/diagraminitevent/)\>

Event emitted when the diagram initialization is complete.

This event fires after all nodes and edges including their internal parts
(ports, labels) have been measured and positioned.

***

### edgeDrawn

> **edgeDrawn**: `EventEmitter`\<[`EdgeDrawnEvent`](/docs/api/types/edgedrawnevent/)\>

Event emitted when a user manually draws an edge between two nodes.

This event only fires for user-initiated edge creation through the UI,
but not for programmatically added edges.

***

### edgeTemplateMap

> **edgeTemplateMap**: `InputSignal`\<[`NgDiagramEdgeTemplateMap`](/docs/api/types/ngdiagramedgetemplatemap/)\>

The edge template map to use for the diagram.
Optional - if not provided, default edge rendering will be used.

***

### groupMembershipChanged

> **groupMembershipChanged**: `EventEmitter`\<[`GroupMembershipChangedEvent`](/docs/api/types/groupmembershipchangedevent/)\>

Event emitted when nodes are grouped or ungrouped.

This event fires when the user moves nodes in or out of a group node,
changing their group membership status.

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

Event emitted when a node or group size changes.

This event fires when a node is resized manually by dragging resize handles
or programmatically using resize methods.

***

### nodeTemplateMap

> **nodeTemplateMap**: `InputSignal`\<[`NgDiagramNodeTemplateMap`](/docs/api/types/ngdiagramnodetemplatemap/)\>

The node template map to use for the diagram.

***

### paletteItemDropped

> **paletteItemDropped**: `EventEmitter`\<[`PaletteItemDroppedEvent`](/docs/api/types/paletteitemdroppedevent/)\>

Event emitted when a palette item is dropped onto the diagram.

This event fires when users drag items from the palette and drop them
onto the canvas to create new nodes.

***

### selectionChanged

> **selectionChanged**: `EventEmitter`\<[`SelectionChangedEvent`](/docs/api/types/selectionchangedevent/)\>

Event emitted when the selection state changes in the diagram.

This event fires when the user selects or deselects nodes and edges through
clicking or programmatically using the `NgDiagramSelectionService`.

***

### selectionMoved

> **selectionMoved**: `EventEmitter`\<[`SelectionMovedEvent`](/docs/api/types/selectionmovedevent/)\>

Event emitted when selected nodes are moved within the diagram.

This event fires when the user moves nodes manually by dragging or
programmatically using the `NgDiagramNodeService.moveNodesBy()` method.

***

### selectionRemoved

> **selectionRemoved**: `EventEmitter`\<[`SelectionRemovedEvent`](/docs/api/types/selectionremovedevent/)\>

Event emitted when selected elements are deleted from the diagram.

This event fires when the user deletes nodes and edges using the delete key,
or programmatically through the diagram service.

***

### selectionRotated

> **selectionRotated**: `EventEmitter`\<[`SelectionRotatedEvent`](/docs/api/types/selectionrotatedevent/)\>

Event emitted when a node is rotated in the diagram.

This event fires when the user rotates a node manually using the rotation handle
or programmatically using the `NgDiagramNodeService` rotation methods.

***

### viewportChanged

> **viewportChanged**: `EventEmitter`\<[`ViewportChangedEvent`](/docs/api/types/viewportchangedevent/)\>

Event emitted when the viewport changes through panning or zooming.

This event fires during pan and zoom operations, including mouse wheel zoom,
and programmatic viewport changes.

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
