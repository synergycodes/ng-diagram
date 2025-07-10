# Z-index in AngularFlow

## Context

In diagrams, where elements may overlap or be grouped, it is important to maintain a consistent layering
order (also known as stacking order). Certain elements must always appear above others—for instance, nodes should be
rendered above edges, and child elements should be displayed above their parent groups.

## Decision

Manually managing this order can be hard, so we use an automatic `zIndex` assignment. This makes sure that all elements
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
   it a higher `zIndex`. By `default`, this value is defined by the constant `DEFAULT_SELECTED_Z_INDEX`. Optionally, it
   can be overridden for each element using the `metadata.selectedZIndex`.

#### How does it work?

- Each element is automatically assigned a `zIndex` value, which determines its rendering depth.
- The assignment process begins at the root (such as a `top-level group` or `node`) and recursively traverses all child
  elements.
- Each next element is given a higher `zIndex`, ensuring the correct stacking `order` is maintained throughout the
  diagram.

#### Example:

- zIndex: 0 → `edge`
- zIndex: 1 → `group` A
- zIndex: 2 → `node` in group A
- zIndex: 3 → `subgroup` in group A
- zIndex: 4 → `node` in subgroup
- zIndex: 1000 -> selected `node`

#### Manual override

If you need full control over rendering order, you can manually override the automatic `zIndex` assignment by setting a
fixed value in the node’s or edge's `zOrder` field.

When `zOrder` is explicitly defined, the `middleware`:

- Skips automatic zIndex computation for that node.
- Preserves the manually assigned value across re-renders.

**Selection Behavior with Manual zOrder:**

- If a node with a manual `zOrder` is `selected`: It's zIndex is temporarily overridden by `metadata.selectedZIndex` (or
  falls back to `DEFAULT_SELECTED_Z_INDEX`) to visually bring it to the front.
- Once the element is `unselected`, its `original zOrder` value is `restored`.
- **This approach ensures that**:
  - Manual layering is always preserved.
  - Selection does not permanently override your custom order.
  - You retain full control over rendering layers.

## Consequences

- **Consistent and predictable rendering order:** `Groups` never visually overlap their own `children`.
- **Correct element targeting:** Clicks and selections always target the correct, `topmost` element.
- No need to set `zIndex` manually
