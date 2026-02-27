---
version: "since v1.1.0"
editUrl: false
next: false
prev: false
title: "EdgeLabelPosition"
---

> **EdgeLabelPosition** = `number` \| [`AbsoluteEdgeLabelPosition`](/docs/api/types/model/absoluteedgelabelposition/)

Type representing edge label position — either relative (0-1) or absolute (`'Npx'`).

- **Relative** (`number`, 0-1): percentage along the path. Clamped to [0, 1].
- **Absolute** (`string`, `'Npx'`): pixel distance from source (positive) or target (negative). Clamped to path length.
