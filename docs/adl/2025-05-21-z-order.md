# Z-Order in ng-diagram

## Context

When working with node-based diagrams, managing the visual layering (z-order) of nodes and edges is crucial for proper interaction and visualization.
Some nodes or edges need to appear above or below other nodes and edges based on user interactions and workflow requirements.

## Decision

`zOrder` property has been added to `Node` and `Edge` interfaces which is an integer that can hold positive or negative values.
Two primary commands to handle z-ordering in ng-diagram have been implemented:

1. `bringToFront`: Moves provided or selected nodes and edges to the front of the visual stack
2. `sendToBack`: Moves provided or selected nodes and edges to the back of the visual stack

These commands are exposed through the CommandHandler interface and can be triggered programmatically or through user interactions.

### Implementation Details

- Z-order is managed through optional `zOrder` property in the `Node` and `Edge` interfaces
- The `bringToFront` command:
  - Identifies the highest z-order in the current diagram
  - Sets the provided or selected node/edge's z-order to highest + 1
- The `sendToBack` command:
  - Identifies the lowest z-order in the current diagram
  - Sets the provided or selected node/edge's z-order to lowest - 1
- The renderer respects these z-order values when rendering nodes

## Consequences

- Clear and intuitive API for managing node and edge layering
- Consistent behavior across different node and edge types
- Scalable solution that works with any number of nodes and edges
- Maintains visual hierarchy during complex interactions
