# Styling

ngDiagram provides a well-structured design system with a clear separation of concerns. Its styling is based on a minimal yet sufficient set of primitives, tokens, and component-level variables that support consistent theming and easy customization across all library components.

In addition to the design system, the library includes components, directives, and CSS classes to help you build consistent and interactive diagram interfaces.

## Design System Architecture

The styling system consists of three distinct layers:

### 1. Primitives

Base color values and fundamental design tokens defined in `primitives`. These are the foundation colors that power the entire design system:

```css
:root {
  --ngd-colors-gray-100: /* white */;
  --ngd-colors-gray-300: /* light gray */;
  --ngd-colors-gray-400: /* medium light gray */;
  --ngd-colors-gray-500: /* medium gray */;
  --ngd-colors-gray-600: /* medium dark gray */;
  --ngd-colors-gray-650: /* dark gray */;
  --ngd-colors-gray-700: /* darker gray */;
  --ngd-colors-gray-800: /* darkest gray */;
  --ngd-colors-acc1-400: /* primary accent light */;
  --ngd-colors-acc1-500: /* primary accent */;
  --ngd-colors-acc1-500-40: /* primary accent with 40% opacity */;
  --ngd-colors-acc1-500-50: /* primary accent with 50% opacity */;
  --ngd-colors-acc4-500: /* secondary accent */;
}
```

> **Note:** The actual color values are defined in the library. Override these variables to customize the color palette for your design system.

### 2. Tokens

Semantic design tokens that map primitives to specific use cases, supporting themes:

```css
:root {
  --ngd-node-bg-primary-default: var(--ngd-colors-gray-100);
  --ngd-node-stroke-primary-default: var(--ngd-colors-gray-400);
  --ngd-node-stroke-primary-hover: var(--ngd-colors-acc1-500);
  /* ... more tokens */
}

html[data-theme='dark'] {
  --ngd-node-bg-primary-default: var(--ngd-colors-gray-700);
  --ngd-node-stroke-primary-default: var(--ngd-colors-gray-600);
  --ngd-node-stroke-primary-hover: var(--ngd-colors-acc1-400);
  /* ... more tokens */
}
```

### 3. Component Variables

Component-specific CSS variables that use tokens for consistent styling:

```css
:root {
  --ngd-node-background-color: var(--ngd-node-bg-primary-default);
  --ngd-node-border-color: var(--ngd-node-stroke-primary-default);
  --ngd-node-border-color-hover: var(--ngd-node-stroke-primary-hover);
  /* ... more component variables */
}
```

## Theming

### Default Themes

ngDiagram supports both light and dark themes out of the box:

- **Light theme** - Applied by default (no HTML attribute needed)
- **Dark theme** - Applied when `data-theme="dark"` is set on the `html` element

```html
<!-- Dark theme (optional) -->
<html data-theme="dark">
  <!-- Dark theme is applied -->
</html>
```

### Customization

#### Global Color Override

To quickly adapt to your design system, override primitives:

```css
:root {
  --ngd-colors-acc1-500: #your-primary-color;
  --ngd-colors-gray-500: #your-gray-color;
  /* Override other primitives as needed */
}
```

#### Component-Specific Customization

For precise control, override component variables:

```css
:root {
  --ngd-node-border-radius: 0.5rem;
  --ngd-node-border-size: 0.125rem;
  --ngd-group-border-radius: 1rem;
  /* Customize specific component properties */
}
```

## Utility Classes

### Port Highlighting Classes

#### `.ng-diagram-port-hoverable-over-node`

Applied to node containers. When the cursor hovers over the node, all ports are highlighted with the default node styling.

#### `.ng-diagram-port-hoverable`

Applied to individual ports. The port is highlighted only when the cursor hovers directly over it.

```html
<!-- Node with hoverable ports -->
<div class="ng-diagram-port-hoverable-over-node">
  <div class="ng-diagram-port"></div>
  <div class="ng-diagram-port"></div>
</div>

<!-- Individual hoverable port -->
<div class="ng-diagram-port ng-diagram-port-hoverable"></div>
```

## Directives

> **Note:** Directives require access to node/group data. When used outside of node templates, they won't work. For manual control, use CSS classes instead.

### NgDiagramNodeSelectedDirective

Automatically adds selection styling based on the node's `selected` property:

```html
<div ngDiagramNodeSelected [data]="nodeData">
  <!-- Node content -->
</div>
```

**Applied styling:**

- Adds `ng-diagram-node-selected` class when `selected` is `true`
- Provides focus ring and outline styling
- Works for both nodes and groups

### NgDiagramGroupHighlightedDirective

Adds highlight styling to groups based on the `highlighted` property:

```html
<div ngDiagramGroupHighlighted [data]="groupData">
  <!-- Group content -->
</div>
```

**Applied styling:**

- Adds `ng-diagram-group-highlight` class when `highlighted` is `true`
- Provides inner outline and background highlight
- Indicates when dragging elements can be added to the group

### Manual CSS Classes

For cases where directives can't be used (outside node templates), you can apply styling manually:

```html
<!-- Selection styling -->
<div class="ng-diagram-node-wrapper ng-diagram-node-selected">
  <!-- Node content -->
</div>

<!-- Group highlight styling -->
<div class="ng-diagram-node-wrapper ng-diagram-group-highlight">
  <!-- Group content -->
</div>
```

> **Important:** Always use `ng-diagram-node-wrapper` together with these classes to ensure proper transition effects.

## Best Practices

1. **Use primitives for global color changes** - Override `--ngd-colors-*` variables for brand consistency
2. **Use component variables for specific adjustments** - Override `--ngd-*` variables for precise control
3. **Leverage utility classes** - Use provided classes for consistent behavior
4. **Use directives for state management** - Let directives handle selection and highlight states
5. **Maintain layer separation** - Don't use primitives or tokens directly in components
