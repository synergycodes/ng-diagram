import { MeasurementTracker } from '../../../measurement-tracker';
import { Middleware } from '../../../types';

/**
 * Creates a middleware that signals measurement activity to the MeasurementTracker.
 *
 * This middleware runs last in the chain and monitors for:
 * - Newly added nodes and edges (signals activity immediately)
 * - Changes to measurement-related properties (size, position, measuredPorts for nodes;
 *   points, measuredLabels for edges)
 *
 * When changes are detected, it signals the MeasurementTracker to start/reset the
 * debounce timer for the affected entities.
 *
 * This enables the `waitForMeasurements` transaction option to wait for DOM measurements
 * to settle before resolving.
 *
 * @param measurementTracker - The MeasurementTracker instance to signal
 * @returns A middleware that signals measurement activity
 *
 * @internal
 */
export const createMeasurementTrackingMiddleware = (
  measurementTracker: MeasurementTracker
): Middleware<'measurement-tracking'> => ({
  name: 'measurement-tracking',
  execute: (context, next) => {
    const { helpers } = context;

    // Signal activity for newly added nodes
    if (helpers.anyNodesAdded()) {
      const addedNodes = helpers.getAddedNodes();
      for (const node of addedNodes) {
        measurementTracker.signalMeasurementActivity(`node:${node.id}`);
      }
    }

    // Signal activity for newly added edges
    if (helpers.anyEdgesAdded()) {
      const addedEdges = helpers.getAddedEdges();
      for (const edge of addedEdges) {
        measurementTracker.signalMeasurementActivity(`edge:${edge.id}`);
      }
    }

    // Signal node measurement activity when size, position, or ports change
    if (helpers.checkIfAnyNodePropsChanged(['size', 'position'])) {
      const affectedNodeIds = helpers.getAffectedNodeIds(['size', 'position']);
      for (const id of affectedNodeIds) {
        measurementTracker.signalMeasurementActivity(`node:${id}`);
      }
    }

    if (helpers.checkIfAnyNodePropsChanged(['measuredPorts'])) {
      const affectedNodeIds = helpers.getAffectedNodeIds(['measuredPorts']);
      for (const id of affectedNodeIds) {
        measurementTracker.signalMeasurementActivity(`node:${id}`);
      }
    }

    // Signal edge measurement activity when points or labels change
    if (helpers.checkIfAnyEdgePropsChanged(['points'])) {
      const affectedEdgeIds = helpers.getAffectedEdgeIds(['points']);
      for (const id of affectedEdgeIds) {
        measurementTracker.signalMeasurementActivity(`edge:${id}`);
      }
    }

    if (helpers.checkIfAnyEdgePropsChanged(['measuredLabels'])) {
      const affectedEdgeIds = helpers.getAffectedEdgeIds(['measuredLabels']);
      for (const id of affectedEdgeIds) {
        measurementTracker.signalMeasurementActivity(`edge:${id}`);
      }
    }

    next();
  },
});
