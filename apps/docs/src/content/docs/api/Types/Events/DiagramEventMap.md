---
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

### nodeResized

> **nodeResized**: [`NodeResizedEvent`](/docs/api/types/events/noderesizedevent/)

Event emitted when a node or group size changes.

This event fires when a node is resized manually by dragging resize handles
or programmatically using resize methods.

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
