---
version: "since v0.9.0"
editUrl: false
next: false
prev: false
title: "NgDiagramMarkerComponent"
---

Component for defining SVG markers with cross-browser SVG2 support.

This component enables the use of SVG2 properties like `context-stroke` and `context-fill`
in marker definitions across all browsers. These properties allow markers to automatically
inherit the stroke/fill color from the referencing edge, enabling dynamic color changes
on hover, selection, and other states.

Safari does not natively support `context-stroke`/`context-fill`, so this component
registers the marker element for automatic inline rendering with `currentColor` fallback.

## Example

```html
<ng-diagram-marker>
  <svg>
    <defs>
      <marker
        id="square-arrowhead"
        viewBox="0 0 10 10"
        refX="8"
        refY="5"
        markerWidth="10"
        markerHeight="10"
      >
        <rect x="1" y="1" width="8" height="8" fill="context-stroke" />
      </marker>
    </defs>
  </svg>
</ng-diagram-marker>
```

## Implements

- `AfterViewInit`

## Methods

### ngAfterViewInit()

> **ngAfterViewInit**(): `void`

A callback method that is invoked immediately after
Angular has completed initialization of a component's view.
It is invoked only once when the view is instantiated.

#### Returns

`void`

#### Implementation of

`AfterViewInit.ngAfterViewInit`
