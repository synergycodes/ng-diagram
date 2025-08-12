---
editUrl: false
next: false
prev: false
title: "getSegmentOrientation"
---

> **getSegmentOrientation**(`startX`, `endX`): `Orientation`

Determines the orientation of a segment based on its start and end X coordinates.

## Parameters

### startX

`number`

The X coordinate of the starting point of the segment.

### endX

`number`

The X coordinate of the ending point of the segment.

## Returns

`Orientation`

The orientation of the segment, either `Orientation.Vertical` if the start and end X coordinates are the same, or `Orientation.Horizontal` otherwise.
