# Z-index in ng-diagram

## Context

In diagrams, where elements may overlap or be grouped, it is important to maintain a consistent layering
order (also known as stacking order). Certain elements must always appear above others—for instance, nodes should be
rendered above edges, and child elements should be displayed above their parent groups.

## Decision

Manually managing this order can be hard, so we use an automatic `computedZIndex` assignment. This makes sure that all elements
are shown in a clear and logical way in the diagram. This assignment is handled by dedicated z-index middleware.

### Implementation Details

#### Diagram layer order

1. **Edges**: Connection lines between `nodes` — always rendered under everything else.
2. **Groups** and **standalone nodes**: Top-level elements not nested within another `group`. `Group`s can contain child
   elements but should not cover them.
3. **Nested nodes** and **nested groups**: Any elements that belong to a `group` — including both `nodes` and
   `subgroups`. These are rendered above their parent `group` and are processed recursively to preserve visual
   hierarchy.
4. **Selected elements**: When an element is `selected`, it is visually elevated above all other elements by assigning
   it a higher `computedZIndex`. By `default`, this value is 1000. This can be configured using the `config.zIndex.selectedZIndex`
   setting.

#### How does it work?

- Each element is automatically assigned a `computedZIndex` value, which determines its rendering depth.
- The assignment process begins at the root (such as a `top-level group` or `node`) and recursively traverses all child
  elements.
- Each next element is given a higher `computedZIndex`, ensuring the correct stacking `order` is maintained throughout the
  diagram.

#### Example:

- computedZIndex: 0 → `edge`
- computedZIndex: 1 → `group` A
- computedZIndex: 2 → `node` in group A
- computedZIndex: 3 → `subgroup` in group A
- computedZIndex: 4 → `node` in subgroup
- computedZIndex: 1000 -> selected `node`

#### Manual override

If you need full control over rendering order, you can manually override the automatic `computedZIndex` assignment by setting a fixed value in the node’s or edge's `zOrder` field.

When `zOrder` is explicitly defined, the `middleware`:

- Skips automatic `computedZIndex` computation for that node.
- Preserves the manually assigned value across re-renders.

**Selection Behavior with Manual zOrder:**

- If a node with a manual `zOrder` is `selected` and `elevateOnSelection` is enabled: Its `computedZIndex` is temporarily
  overridden by `selectedZIndex` to visually bring it to the front.
- Once the element is `unselected`, its `original zOrder` value is `restored`.
- **This approach ensures that**:
  - Manual layering is always preserved.
  - Selection does not permanently override your custom order.
  - You retain full control over rendering layers.

#### Temporary Edge

Temporary edges (e.g., those shown while dragging to create a connection) are also included in the `computedZIndex` layering
system.

- Rendered above all other elements using the same z-index as selected elements
- Ensures visibility of `temporary edges` above `nodes`, `groups`, and other `edges`

#### Configuration

The z-index behavior can be configured through the diagram config:

```typescript
const config: NgDiagramConfig = {
  zIndex: {
    enabled: true, // Enable/disable z-index middleware
    selectedZIndex: 1000, // Z-index for selected elements
    edgesAboveConnectedNodes: false, // Whether edges appear above their connected nodes
    elevateOnSelection: true, // Whether selection elevates elements
  },
};
```

**Configuration Options:**

- **`enabled`**: Controls whether the z-index middleware is active (default: `true`)
- **`selectedZIndex`**: The z-index value assigned to selected elements (default: `1000`)
- **`edgesAboveConnectedNodes`**: When `true`, edges will appear one level above their highest connected node (default: `false`)
- **`elevateOnSelection`**: When `true`, selected elements are elevated to `selectedZIndex`. When `false`, selection doesn't change z-index (default: `true`)

## Consequences

- **Consistent and predictable rendering order:** `Groups` never visually overlap their own `children`.
- **Correct element targeting:** Clicks and selections always target the correct, `topmost` element.
- No need to set `computedZIndex` manually
