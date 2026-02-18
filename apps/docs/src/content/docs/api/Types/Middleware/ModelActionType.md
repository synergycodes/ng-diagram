---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "ModelActionType"
---

> **ModelActionType** = `"init"` \| `"changeSelection"` \| `"moveNodesBy"` \| `"deleteSelection"` \| `"addNodes"` \| `"updateNode"` \| `"updateNodes"` \| `"deleteNodes"` \| `"clearModel"` \| `"paletteDropNode"` \| `"addEdges"` \| `"updateEdge"` \| `"deleteEdges"` \| `"deleteElements"` \| `"paste"` \| `"moveViewport"` \| `"resizeNode"` \| `"resizeNodeStart"` \| `"resizeNodeStop"` \| `"startLinking"` \| `"moveTemporaryEdge"` \| `"finishLinking"` \| `"zoom"` \| `"changeZOrder"` \| `"rotateNodeTo"` \| `"rotateNodeStart"` \| `"rotateNodeStop"` \| `"highlightGroup"` \| `"highlightGroupClear"` \| `"moveNodes"` \| `"moveNodesStart"` \| `"moveNodesStop"`

Individual model action type that can trigger middleware execution.
These represent all possible operations that modify the diagram state.

## Example

```typescript
const blockedActions: ModelActionType[] = ['addNodes', 'deleteNodes', 'updateNode'];
```
