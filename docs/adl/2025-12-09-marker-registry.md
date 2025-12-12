# Marker Registry for Safari Compatibility

## Context

SVG markers use `context-stroke` to inherit the stroke color from the referencing path. This enables markers (arrowheads) to automatically match the edge color and support dynamic states like hover and selection.

### The Problem

Safari does not support `context-stroke` for SVG markers. When using global markers with `context-stroke`, Safari renders them with default colors instead of inheriting from the edge.

```html
<!-- Works in Chrome/Firefox, broken in Safari -->
<marker id="arrow">
  <path stroke="context-stroke" />
</marker>
<path marker-end="url(#arrow)" stroke="red" />
```

### Requirements

- Markers must inherit edge stroke color
- Must support hover, selection, and other dynamic states
- Solution must work across Chrome, Firefox, and Safari
- API should be simple for users creating custom markers

## Decision

Implement a **Marker Registry** system with automatic Safari fallback:

1. **Chrome/Firefox**: Use global markers with `context-stroke` (native behavior)
2. **Safari**: Clone markers inline per edge with `currentColor` substitution

### Why `currentColor`?

Safari supports `currentColor` which inherits from the CSS `color` property. By setting `color` on the SVG element to match the edge stroke, markers can inherit the correct color dynamically.

```html
<svg style="color: red">
  <defs>
    <marker id="arrow-edge1-target">
      <path stroke="currentColor" />
      <!-- Inherits red -->
    </marker>
  </defs>
  <path marker-end="url(#arrow-edge1-target)" stroke="red" />
</svg>
```

## Architecture

### MarkerRegistryService

Central service that:

- Detects feature support via `CSS.supports('stroke', 'context-stroke')`
- Stores references to `SVGMarkerElement` instances
- Provides `getMarkerUrl()` for marker-start/marker-end attributes
- Provides `cloneMarkerElement()` for creating Safari inline markers

### InlineMarkersDirective

Angular directive that manages Safari inline markers via DOM API:

- Placed on `<defs>` element in the edge SVG
- Clones marker elements and appends them to the host element
- Handles cleanup on destroy and input changes
- No `innerHTML` or `DomSanitizer` - pure DOM manipulation

```html
<defs
  ngDiagramInlineMarkers
  [sourceMarkerId]="sourceMarkerId()"
  [targetMarkerId]="targetMarkerId()"
  [edgeId]="edge().id"
></defs>
```

### NgDiagramMarkerComponent

Wrapper component that simplifies marker creation:

- Renders the marker SVG for Chrome/Firefox (global)
- Automatically registers with MarkerRegistryService for Safari fallback
- Users don't need to know about Safari compatibility

```html
<ng-diagram-marker>
  <svg>
    <defs>
      <marker id="custom-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="10" markerHeight="10">
        <path d="M 2 2 L 8 5 L 2 8" stroke="context-stroke" fill="none" />
      </marker>
    </defs>
  </svg>
</ng-diagram-marker>
```

### Base Edge Integration

The base edge component:

- Uses `markerRegistry.getMarkerUrl()` for marker-start/marker-end attributes
- Conditionally renders `InlineMarkersDirective` for Safari inline markers

## Important Notes

- Markers must be wrapped in `<ng-diagram-marker>` to work on Safari
- The `id` attribute on the `<marker>` element is required
- Use `context-stroke` and `context-fill` in marker definitions (automatically converted to `currentColor` for Safari)
- Both `fill="context-stroke"` and `fill="context-fill"` are supported (common for filled arrowheads)
- Each edge in Safari gets its own marker copies (slight DOM overhead, but necessary for correct rendering)
- Cloning only happens on init and when marker IDs change, not on every re-render
