/**
 * Options for selective invalidation of diagram element measurements.
 * When provided to `invalidateMeasurements()`, only the specified elements
 * are re-measured. When omitted, all elements are re-measured.
 *
 * @public
 * @since 1.2.3
 */
export interface InvalidateMeasurementsOptions {
  /**
   * Nodes to re-measure. Invalidating a node also re-measures all its ports.
   */
  nodes?: { nodeId: string }[];

  /**
   * Edges whose labels should be re-measured.
   */
  edgeLabels?: { edgeId: string }[];
}
