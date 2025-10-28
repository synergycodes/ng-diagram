---
editUrl: false
next: false
prev: false
title: "NgDiagramBackgroundComponent"
---

The `NgDiagramBackgroundComponent` is responsible for rendering the background of the diagram.

## Example usage
```html
<ng-diagram ... >
  <!-- Built-in backgrounds -->
  <ng-diagram-background type="grid" />
  <ng-diagram-background type="dots" />
  <ng-diagram-background /> <!-- Defaults to dots -->

  <!-- Custom background via content projection -->
  <ng-diagram-background>
    <!-- Optional: custom SVG, HTML or IMAGE for background -->
  </ng-diagram-background>
</ng-diagram>
```

## Implements

- `AfterContentInit`

## Properties

### type

> **type**: `InputSignal`\<`"grid"` \| `"dots"`\>

The type of background pattern to display.

#### Default

```ts
'dots'
```
