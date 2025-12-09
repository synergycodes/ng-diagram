---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "ModelActionType"
---

> **ModelActionType** = `"init"` \| `"changeSelection"` \| `"moveNodesBy"` \| `"deleteSelection"` \| `"addNodes"` \| `"updateNode"` \| `"updateNodes"` \| `"deleteNodes"` \| `"clearModel"` \| `"paletteDropNode"` \| `"addEdges"` \| `"updateEdge"` \| `"deleteEdges"` \| `"deleteElements"` \| `"paste"` \| `"moveViewport"` \| `"resizeNode"` \| `"startLinking"` \| `"moveTemporaryEdge"` \| `"finishLinking"` \| `"zoom"` \| `"changeZOrder"` \| `"rotateNodeTo"` \| `"highlightGroup"` \| `"highlightGroupClear"` \| `"moveNodes"` \| `"moveNodesStop"`

Model action types that can trigger middleware execution.
These represent all possible operations that modify the diagram state.

## Example

```typescript
const middleware: Middleware = {
  name: 'logger',
  execute: (context, next) => {
    console.log('Action types:', context.modelActionTypes.join(', '));
    next();
  }
};
```
