---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "DiagramEventMap"
---

Map of all available diagram events and their payload types

## Properties

### clipboardPasted

> **clipboardPasted**: [`ClipboardPastedEvent`](/docs/api/types/events/clipboardpastedevent/)

Event emitted when clipboard content is pasted into the diagram.

This event fires when nodes and edges are added via paste operations,
either through keyboard shortcuts or programmatic paste commands.

***

### diagramInit

> **diagramInit**: [`DiagramInitEvent`](/docs/api/types/events/diagraminitevent/)

Event emitted when the diagram initialization is complete.

This event fires after all nodes and edges including their internal parts
(ports, labels) have been measured and positioned.

***

### edgeDrawn

> **edgeDrawn**: [`EdgeDrawnEvent`](/docs/api/types/events/edgedrawnevent/)

Event emitted when a user manually draws an edge between two nodes.

This event only fires for user-initiated edge creation through the UI,
but not for programmatically added edges.

***

### groupMembershipChanged

> **groupMembershipChanged**: [`GroupMembershipChangedEvent`](/docs/api/types/events/groupmembershipchangedevent/)

Event emitted when nodes are grouped or ungrouped.

This event fires when the user moves nodes in or out of a group node,
changing their group membership status.

***

### nodeDragEnded

> **nodeDragEnded**: [`NodeDragEndedEvent`](/docs/api/types/events/nodedragendedevent/)

Event emitted when a node drag operation ends.

This event fires when the user releases the pointer after dragging nodes.
Nodes will have their final positions when this event is received.

***

### nodeDragStarted

> **nodeDragStarted**: [`NodeDragStartedEvent`](/docs/api/types/events/nodedragstartedevent/)

Event emitted when a node drag operation begins.

This event fires once when the drag threshold is crossed, signaling the
start of a drag operation.

***

### nodeResized

> **nodeResized**: [`NodeResizedEvent`](/docs/api/types/events/noderesizedevent/)

Event emitted when a node or group size changes.

This event fires when a node is resized manually by dragging resize handles
or programmatically using resize methods.

***

### nodeResizeEnded

> **nodeResizeEnded**: [`NodeResizeEndedEvent`](/docs/api/types/events/noderesizeendedevent/)

Event emitted when a node resize operation ends.

This event fires when the user releases the pointer after resizing a node.
The node will have its final size when this event is received.

***

### nodeResizeStarted

> **nodeResizeStarted**: [`NodeResizeStartedEvent`](/docs/api/types/events/noderesizestartedevent/)

Event emitted when a node resize operation begins.

This event fires once when the user starts resizing a node by dragging
a resize handle.

***

### nodeRotateEnded

> **nodeRotateEnded**: [`NodeRotateEndedEvent`](/docs/api/types/events/noderotateendedevent/)

Event emitted when a node rotation operation ends.

This event fires when the user releases the pointer after rotating a node.
The node will have its final angle when this event is received.

***

### nodeRotateStarted

> **nodeRotateStarted**: [`NodeRotateStartedEvent`](/docs/api/types/events/noderotatestartedevent/)

Event emitted when a node rotation operation begins.

This event fires once when the user starts rotating a node by dragging
the rotation handle.

***

### paletteItemDropped

> **paletteItemDropped**: [`PaletteItemDroppedEvent`](/docs/api/types/events/paletteitemdroppedevent/)

Event emitted when a palette item is dropped onto the diagram.

This event fires when users drag items from the palette and drop them
onto the canvas to create new nodes.

***

### selectionChanged

> **selectionChanged**: [`SelectionChangedEvent`](/docs/api/types/events/selectionchangedevent/)

Event emitted when the selection state changes in the diagram.

This event fires when the user selects or deselects nodes and edges through
clicking or programmatically using the diagram selection service.

***

### selectionGestureEnded

> **selectionGestureEnded**: [`SelectionGestureEndedEvent`](/docs/api/types/events/selectiongestureendedevent/)

Event emitted when a selection gesture is complete.

This event fires on pointerup after a selection operation completes -
whether from clicking a node/edge, box selection, or select-all.

***

### selectionMoved

> **selectionMoved**: [`SelectionMovedEvent`](/docs/api/types/events/selectionmovedevent/)

Event emitted when selected nodes are moved within the diagram.

This event fires when the user moves nodes manually by dragging or
programmatically using the diagram node service.

***

### selectionRemoved

> **selectionRemoved**: [`SelectionRemovedEvent`](/docs/api/types/events/selectionremovedevent/)

Event emitted when selected elements are deleted from the diagram.

This event fires when the user deletes nodes and edges using the delete key,
or programmatically through the diagram service.

***

### selectionRotated

> **selectionRotated**: [`SelectionRotatedEvent`](/docs/api/types/events/selectionrotatedevent/)

Event emitted when a node is rotated in the diagram.

This event fires when the user rotates a node manually using the rotation handle
or programmatically using the diagram node service.

***

### viewportChanged

> **viewportChanged**: [`ViewportChangedEvent`](/docs/api/types/events/viewportchangedevent/)

Event emitted when the viewport changes through panning or zooming.

This event fires during pan and zoom operations, including mouse wheel zoom,
and programmatic viewport changes.
