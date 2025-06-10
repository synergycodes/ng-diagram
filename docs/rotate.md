# Transform Separation for Rotatable Nodes

## Context

When implementing rotatable nodes in a canvas-based flow diagram, calculating accurate port positions becomes complex when both translation and rotation transforms are applied to the same DOM element. The challenge arises because:

- `getBoundingClientRect()` returns the bounding box of the transformed (rotated) element, not the original position
- Combined transforms like `transform: translate(x, y) rotate(angle)` make it difficult to extract the node's actual position
- Port position calculations require complex matrix math to account for the rotation
- The bounding box of a rotated element is larger than the original element and offset differently than expected

This complexity makes it challenging to:

- Calculate precise port positions for edge connections
- Maintain predictable coordinates during resize operations
- Query node positions independently of their rotation state

## Decision

Separate the position and rotation transforms into nested DOM elements, where each transform layer has a specific responsibility:

```html
<!-- Position wrapper - only translation -->
<div class="node-position-wrapper" style="transform: translate(x, y)">
  <!-- Rotation wrapper - only rotation -->
  <div class="node-rotation-wrapper" style="transform: rotate(angle)">
    <!-- Node content and ports -->
    <div class="node-content">
      <!-- Content -->
    </div>
  </div>
</div>
```

### Implementation Details

- **Position Wrapper**: Handles only the translation transform

  - Provides clean x,y coordinates
  - Position can be queried independently of rotation
  - `transform: translate(node.position.x, node.position.y)`

- **Rotation Wrapper**: Handles only the rotation transform

  - Rotation happens in local coordinate space
  - Can work with different transform-origin values
  - `transform: rotate(${node.angle}deg)`

- **Port Position Calculation**:

- When a node is rotated, the rotation angle is determined by the user's mouse movement relative to the node's center and the rotation handle (see `rotate.ts`).
- The system ignores small movements near the center to prevent erratic jumps in rotation.
- Once a valid rotation is detected, the new angle is calculated and a command is emitted to update the node's rotation and the positions of its ports.
- Because the DOM structure separates translation and rotation, port positions are first calculated in the node's local coordinate system (unaffected by rotation).
- The rotation transform is then applied at the wrapper level, ensuring that each port maintains its correct position relative to the rotated node.
- This approach avoids complex matrix math and ensures that port positions remain accurate and predictable, even as the node is rotated.

## Consequences

### Positive

- **Predictable Coordinates**: Each transform layer maintains its own coordinate system
- **Simplified Calculations**: Port positions can be calculated without complex matrix math
- **Clean Separation of Concerns**: Position and rotation are handled independently
- **Easier Debugging**: Can inspect each transform layer separately in DevTools
- **Better Browser Optimization**: Some browsers optimize nested transforms more efficiently
- **Maintainable Code**: Clear hierarchy makes the transformation pipeline obvious

### Neutral

- **DOM Structure Change**: Requires additional wrapper elements

### Considerations

- Z-index and other positioning properties should be applied to the appropriate wrapper level
