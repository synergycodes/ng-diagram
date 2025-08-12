---
editUrl: false
next: false
prev: false
title: "NgDiagramBaseEdgeComponent"
---

To create an edge with a custom path, you must provide the `pathAndPoints` property.
If you want to use one of the default edge types, set the `routing` property in `edge`
or provide the `routing` property as a component prop

- For custom paths:
 - Provide the `pathAndPoints` prop to the component with your custom `path` string and `points` array.

- For default paths:
  - Set `routing` in `edge` to one of the supported types (e.g., `'straight'`, `'bezier'`, `'orthogonal'`).
  - Or provide the `routing` property as a component prop
  - The edge will automatically generate its path based on the routing type and provided points.
