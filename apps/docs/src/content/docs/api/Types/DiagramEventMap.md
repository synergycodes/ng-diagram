---
editUrl: false
next: false
prev: false
title: "DiagramEventMap"
---

Map of all available diagram events and their payload types

## Properties

### clipboardPasted

> **clipboardPasted**: [`ClipboardPastedEvent`](/docs/api/types/clipboardpastedevent/)

Event emitted when clipboard content is pasted
This event fires when nodes and edges are added via paste operations

***

### diagramInit

> **diagramInit**: [`DiagramInitEvent`](/docs/api/types/diagraminitevent/)

Event emitted when the diagram is initialized
This event fires after all nodes and edges including their internal parts have been measured and positioned.

***

### edgeDrawn

> **edgeDrawn**: [`EdgeDrawnEvent`](/docs/api/types/edgedrawnevent/)

Event emitted when an edge is drawn
This event fires when the user draws an edge manually through the UI

***

### nodeResized

> **nodeResized**: [`NodeResizedEvent`](/docs/api/types/noderesizedevent/)

Event emitted when node or group size changes
This event fires when node was resized manually or programmatically

***

### paletteItemDropped

> **paletteItemDropped**: [`PaletteItemDroppedEvent`](/docs/api/types/paletteitemdroppedevent/)

Event emitted when a palette item is dropped
This event fires when users drag items from the palette and drop them to create new nodes

***

### selectionChanged

> **selectionChanged**: [`SelectionChangedEvent`](/docs/api/types/selectionchangedevent/)

Event emitted when the selection changes
This event fires when the user selects or deselects nodes and edges

***

### selectionGroupChanged

> **selectionGroupChanged**: [`SelectionGroupChangedEvent`](/docs/api/types/selectiongroupchangedevent/)

Event emitted when nodes are grouped into a group
This event fires when the user moves nodes in or out of a group node.

***

### selectionMoved

> **selectionMoved**: [`SelectionMovedEvent`](/docs/api/types/selectionmovedevent/)

Event emitted when the selection is moved
This event fires when the user moves nodes manually or programmatically

***

### selectionRemoved

> **selectionRemoved**: [`SelectionRemovedEvent`](/docs/api/types/selectionremovedevent/)

Event emitted when selected elements are deleted from the diagram
This event fires when the user deletes nodes and edges

***

### selectionRotated

> **selectionRotated**: [`SelectionRotatedEvent`](/docs/api/types/selectionrotatedevent/)

Event emitted when a node is rotated
This event fires when the user rotates a node manually or programmatically

***

### viewportChanged

> **viewportChanged**: [`ViewportChangedEvent`](/docs/api/types/viewportchangedevent/)

Event emitted when the viewport changes
This event fires during pan and zoom operations
