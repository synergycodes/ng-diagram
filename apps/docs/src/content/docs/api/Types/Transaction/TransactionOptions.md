---
version: "since v0.10.0"
editUrl: false
next: false
prev: false
title: "TransactionOptions"
---

Options for configuring transaction behavior.

## Properties

### waitForMeasurements?

> `optional` **waitForMeasurements**: `boolean`

When true, the transaction promise will not resolve until all measurements
(node sizes, port positions, etc.) triggered by the transaction are complete.

This is useful when you need to perform operations that depend on measured values,
such as `zoomToFit()` after adding nodes.

The measurement tracking uses a debounce-based approach: when DOM measurements
change (e.g., ResizeObserver fires), the debounce timer resets. Only when the
debounce expires without new changes is the measurement considered complete.

#### Default

```ts
false
```

#### Example

```typescript
// Without waitForMeasurements - zoomToFit might not include new nodes
await flowCore.transaction(async (tx) => {
  await tx.emit('addNodes', { nodes: [newNode] });
});
await viewportService.zoomToFit(); // May not account for new node dimensions

// With waitForMeasurements - zoomToFit will include new nodes
await flowCore.transaction(async (tx) => {
  await tx.emit('addNodes', { nodes: [newNode] });
}, { waitForMeasurements: true });
await viewportService.zoomToFit(); // Correctly includes new node dimensions
```
