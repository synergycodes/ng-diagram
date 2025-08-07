# Styling

AngularFlow provides a comprehensive design system with clear separation of concerns through CSS layers. The styling system is built on primitives, tokens, and component variables that work together to provide consistent theming and customization options.

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

Semantic design tokens that map primitives to specific use cases, supporting both light and dark themes:

```css
html[data-theme='dark'] {
  --ngd-node-bg-primary-default: var(--ngd-colors-gray-700);
  --ngd-node-stroke-primary-default: var(--ngd-colors-gray-600);
  --ngd-node-stroke-primary-hover: var(--ngd-colors-acc1-400);
  /* ... more tokens */
}

html[data-theme='light'] {
  --ngd-node-bg-primary-default: var(--ngd-colors-gray-100);
  --ngd-node-stroke-primary-default: var(--ngd-colors-gray-400);
  --ngd-node-stroke-primary-hover: var(--ngd-colors-acc1-500);
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

AngularFlow supports both light and dark themes out of the box. The theme is controlled by the `data-theme` attribute on the `html` element:

- `data-theme="light"` - Light theme (default)
- `data-theme="dark"` - Dark theme

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

## Usage Examples

### Custom Node with Default Styling

```html
<div class="custom-node ng-diagram-port-hoverable-over-node" ngDiagramNodeSelected [data]="nodeData">
  <div class="ng-diagram-port"></div>
  <div class="ng-diagram-port"></div>
</div>
```

### Custom Group with Highlight Support

```html
<div class="custom-group" ngDiagramNodeSelected ngDiagramGroupHighlighted [data]="groupData">
  <div class="group-content">
    <!-- Group content -->
  </div>
</div>
```

### Custom Port with Individual Hover

```html
<div class="custom-port ng-diagram-port ng-diagram-port-hoverable">
  <!-- Port content -->
</div>
```

## Best Practices

1. **Use primitives for global color changes** - Override `--ngd-colors-*` variables for brand consistency
2. **Use component variables for specific adjustments** - Override `--ngd-*` variables for precise control
3. **Leverage utility classes** - Use provided classes for consistent behavior
4. **Use directives for state management** - Let directives handle selection and highlight states
5. **Maintain layer separation** - Don't use primitives or tokens directly in components
