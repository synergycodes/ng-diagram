# Custom Edge in AngularFlow

## Context

When diagrams are created, requirements often extend beyond simple `edges` connecting `nodes`.

#### **Edges may need to:**

- Follow `custom paths`
- Contain interactive elements, like a `button` for deleting a connection
- Display `icons` or `badges`
- other

## Decision

A dedicated component - `angular-adapter-custom-edge` - is provided to make defining custom edges easy and consistent
within Angular applications.

### This component allows you to:

- Use one of the built-in path generators (e.g., `straight`, `bezier`, `orthogonal`),
- Or define your own `custom path` using any `logic` you like,
- Add custom elements (e.g., `icons`, `buttons`, `badges`) directly inside the edge,
- Optionally use the built-in 'label' renderer via `angular-adapter-edge-label`

### Implementation Details

#### Related tools

1. `angular-adapter-custom-edge`- base component for creating fully custom edges.
2. `angular-adapter-edge-label` - `default label` renderer (can be reused or replaced).
3. `Built-in path utilities` - a set of pre-defined path functions for quick start.

#### angular-adapter-custom-edge

- A configurable edge component designed for integration within `diagram systems`.
- It allows full control over appearance and behavior, including:
  - Path style (`routing`)
  - `Stroke` color and marker,
  - Optional `label` rendering

This component integrates with the edge `middleware system` and supports all standard edge features (zIndex, selection,
interaction, etc.).

#### How to Use a Basic Label

```html

<angular-adapter-custom-edge
  [data]="data()"
  [routing]="'bezier'"
  [customStroke]="'red'"
  [customMarkerEnd]="'angularflow-arrow'" [displayLabel]="true"
/>
```

| Input               | Type                                                 | Required | Description                                                                |
|---------------------|------------------------------------------------------|----------|----------------------------------------------------------------------------|
| `data`              | `Edge`                                               | Yes      | Edge data object (source, target, metadata, etc.).                         |
| `routing`           | `string`                                             | No       | Path type: `'straight'`, `'bezier'`, `'orthogonal'`. Default: `'straight'` |
| `customStroke`      | `string`                                             | No       | Custom stroke color.                                                       |
| `customMarkerStart` | `string`                                             | No       | Custom marker start                                                        |
| `customMarkerEnd`   | `string`                                             | No       | Custom marker end                                                          |
| `displayLabel`      | `boolean`                                            | No       | Whether to display the default edge label component.                       |
| `pathAndPoints`     | `{ path: string; points: {x: number, y: number}[] }` | No       | Overrides routing with a custom path and list of points.                   |

#### How to Use a Custom Path

```html

<angular-adapter-custom-edge
  [pathAndPoints]="pathAndPoints"
  [data]="data()"
  [customMarkerEnd]="'angularflow-arrow'"
/>

```

#### angular-adapter-edge-label

A flexible `label component` that allows attaching interactive content directly to an edge.

- Rendering `custom labels` directly on the edge path,
- Adding interactive UI elements like `buttons`, `icons`, `tooltips` or `status`,
- `Full control` over the positioning, alignment, and event handling within the edge label area.

#### How to Use a Custom Label

`[positionOnEdge]` - Defines the position of the `label` along the edge path.

```html

<angular-adapter-custom-edge
  [data]="data()"
  [displayLabel]="false"
>
  <angular-adapter-edge-label [id]="'test-label'" [positionOnEdge]="0.5">
    <button (mousedown)="onButtonClick()">Button</button>
  </angular-adapter-edge-label>
</angular-adapter-custom-edge>
```


