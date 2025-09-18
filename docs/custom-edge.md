# Custom Edge in ng-diagram

## Context

When diagrams are created, requirements often extend beyond simple `edges` connecting `nodes`.

#### **Edges may need to:**

- Follow `custom paths`
- Contain interactive elements, like a `button` for deleting a connection
- Display `icons` or `badges`
- other

## Decision

A dedicated component - `ng-diagram-custom-edge` - is provided to make defining custom edges easy and consistent
within Angular applications.

### This component allows you to:

- Use one of the built-in path generators (e.g., `polyline`, `bezier`, `orthogonal`),
- Or define your own `custom path` using any `logic` you like,
- Add custom elements (e.g., `icons`, `buttons`, `badges`) directly inside the edge,
- Optionally use the built-in 'label' renderer via `ng-diagram-edge-label`

### Implementation Details

#### Related tools

1. `ng-diagram-custom-edge`- base component for creating fully custom edges.
2. `ng-diagram-edge-label` - `default label` renderer (can be reused or replaced).
3. `Built-in path utilities` - a set of pre-defined path functions for quick start.

#### ng-diagram-custom-edge

- A configurable edge component designed for integration within `diagram systems`.
- It allows full control over appearance and behavior, including:
  - Path style (`routing`)
  - `Stroke` color and marker,
  - Optional `label` rendering

This component integrates with the edge `middleware system` and supports all standard edge features (zIndex, selection,
interaction, etc.).

#### How to Use a Basic Label

```html
<ng-diagram-custom-edge
  [data]="data()"
  [routing]="'bezier'"
  [customStroke]="'red'"
  [targetArrowhead]="'ng-diagram-arrow'"
  [displayLabel]="true"
/>
```

| Input             | Type                                                 | Required | Description                                                                |
| ----------------- | ---------------------------------------------------- | -------- | -------------------------------------------------------------------------- |
| `data`            | `Edge`                                               | Yes      | Edge data object (source, target, metadata, etc.).                         |
| `routing`         | `string`                                             | No       | Path type: `'polyline'`, `'bezier'`, `'orthogonal'`. Default: `'polyline'` |
| `customStroke`    | `string`                                             | No       | Custom stroke color.                                                       |
| `sourceArrowhead` | `string`                                             | No       | Custom marker start                                                        |
| `targetArrowhead` | `string`                                             | No       | Custom marker end                                                          |
| `displayLabel`    | `boolean`                                            | No       | Whether to display the default edge label component.                       |
| `pathAndPoints`   | `{ path: string; points: {x: number, y: number}[] }` | No       | Overrides routing with a custom path and list of points.                   |

#### How to Use a Custom Path

```html
<ng-diagram-custom-edge [pathAndPoints]="pathAndPoints" [data]="data()" [targetArrowhead]="'ng-diagram-arrow'" />
```

#### ng-diagram-edge-label

A flexible `label component` that allows attaching interactive content directly to an edge.

- Rendering `custom labels` directly on the edge path,
- Adding interactive UI elements like `buttons`, `icons`, `tooltips` or `status`,
- `Full control` over the positioning, alignment, and event handling within the edge label area.

#### How to Use a Custom Label

`[positionOnEdge]` - Defines the position of the `label` along the edge path.

```html
<ng-diagram-custom-edge [data]="data()" [displayLabel]="false">
  <ng-diagram-edge-label [id]="'test-label'" [positionOnEdge]="0.5">
    <button (mousedown)="onButtonClick()">Button</button>
  </ng-diagram-edge-label>
</ng-diagram-custom-edge>
```
