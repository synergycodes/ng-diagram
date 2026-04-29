import { MeasurementTracker } from '../../../measurement-tracker/measurement-tracker';
import { Middleware } from '../../../types';

/**
 * Tracks and signals DOM measurement activity to enable `waitForMeasurements` transaction option.
 *
 * Operates in two modes:
 * - **First pass** (tracking requested via `requestTracking`): registers ALL changed entities
 *   as participants via `registerParticipants()`, starting the observation window.
 * - **Subsequent passes** (pending measurements exist): signals measurement arrivals for
 *   measurement-related property changes (`size`, `position`, `measuredPorts`, `points`, `measuredLabels`).
 *
 * @internal
 */
export const createMeasurementTrackingMiddleware = (
  measurementTracker: MeasurementTracker
): Middleware<'measurement-tracking'> => ({
  name: 'measurement-tracking',
  execute: (context, next) => {
    const isFirstPass = measurementTracker.isTrackingRequested();
    const hasPending = measurementTracker.hasPendingMeasurements();

    if (!isFirstPass && !hasPending) {
      next();
      return;
    }

    const { helpers } = context;

    if (isFirstPass) {
      // First pass: register ALL changed entities as participants.
      // Any property change (data, position, size, custom fields, etc.) could indirectly
      // trigger DOM measurements via Angular template bindings or CSS changes.
      const entityIds: string[] = [];

      if (helpers.anyNodesAdded()) {
        for (const node of helpers.getAddedNodes()) {
          entityIds.push(`node:${node.id}`);
        }
      }

      if (helpers.anyEdgesAdded()) {
        for (const edge of helpers.getAddedEdges()) {
          entityIds.push(`edge:${edge.id}`);
        }
      }

      for (const id of helpers.getChangedNodeIds()) {
        entityIds.push(`node:${id}`);
      }

      for (const id of helpers.getChangedEdgeIds()) {
        entityIds.push(`edge:${id}`);
      }

      measurementTracker.registerParticipants(entityIds);
    } else {
      // Subsequent passes: signal measurement arrivals only for measurement-related properties.
      // These are the properties that indicate DOM measurements have been applied.
      if (helpers.checkIfAnyNodePropsChanged(['size', 'position', 'measuredPorts', 'angle'])) {
        for (const id of helpers.getAffectedNodeIds(['size', 'position', 'measuredPorts', 'angle'])) {
          measurementTracker.signalMeasurement(`node:${id}`);
        }
      }

      if (helpers.checkIfAnyEdgePropsChanged(['points', 'measuredLabels'])) {
        for (const id of helpers.getAffectedEdgeIds(['points', 'measuredLabels'])) {
          measurementTracker.signalMeasurement(`edge:${id}`);
        }
      }
    }

    next();
  },
});
