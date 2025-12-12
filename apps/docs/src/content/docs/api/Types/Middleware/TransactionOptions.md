---
version: "since v0.9.0"
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
such as `zoomToFit()` after adding nodes or edges.

#### Default

```ts
false
```

#### Example

```typescript
// Without waitForMeasurements - zoomToFit might not include new nodes
await diagramService.transaction(() => {
  modelService.addNodes([newNode]);
});
viewportService.zoomToFit(); // May not account for new node dimensions

// With waitForMeasurements - zoomToFit will include new nodes
await diagramService.transaction(() => {
  modelService.addNodes([newNode]);
}, { waitForMeasurements: true });
viewportService.zoomToFit(); // Correctly includes new node dimensions
```
