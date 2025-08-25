---
editUrl: false
next: false
prev: false
title: "NgDiagramBaseEdgeComponent"
---

Base edge component that handles edge rendering.

Path is determined based on edge routing mode:
- Auto mode (default): Path is computed from source/target positions using routing algorithm
- Manual mode: Path is computed from user-provided points using routing algorithm
The routing algorithm determines how the path is rendered (orthogonal, bezier, polyline, etc.)
