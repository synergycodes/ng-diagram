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

    const { helpers, nodesMap, edgesMap } = context;

    // Effectively hidden elements render as display: none and never deliver
    // valid measurements — they must not be waited for.
    const isNodeHidden = (id: string) => nodesMap.get(id)?.computedHidden === true;
    const isEdgeHidden = (id: string) => edgesMap.get(id)?.computedHidden === true;

    if (isFirstPass) {
      // First pass: register ALL changed visible entities as participants.
      // Any property change (data, position, size, custom fields, etc.) could indirectly
      // trigger DOM measurements via Angular template bindings or CSS changes.
      const entityIds: string[] = [];
      const hiddenEntityIds: string[] = [];

      if (helpers.anyNodesAdded()) {
        for (const node of helpers.getAddedNodes()) {
          (node.computedHidden ? hiddenEntityIds : entityIds).push(`node:${node.id}`);
        }
      }

      if (helpers.anyEdgesAdded()) {
        for (const edge of helpers.getAddedEdges()) {
          (edge.computedHidden ? hiddenEntityIds : entityIds).push(`edge:${edge.id}`);
        }
      }

      for (const id of helpers.getChangedNodeIds()) {
        (isNodeHidden(id) ? hiddenEntityIds : entityIds).push(`node:${id}`);
      }

      for (const id of helpers.getChangedEdgeIds()) {
        (isEdgeHidden(id) ? hiddenEntityIds : entityIds).push(`edge:${id}`);
      }

      measurementTracker.registerParticipants(entityIds);
      // Entities hidden in this same pass may still be pending from an earlier
      // round — hiding clears their measurement expectations.
      measurementTracker.unregisterParticipants(hiddenEntityIds);
    } else {
      // Entities that became hidden while a round is pending stop being waited for.
      const hiddenToggledIds = [
        ...helpers
          .getAffectedNodeIds(['computedHidden'])
          .filter(isNodeHidden)
          .map((id) => `node:${id}`),
        ...helpers
          .getAffectedEdgeIds(['computedHidden'])
          .filter(isEdgeHidden)
          .map((id) => `edge:${id}`),
      ];
      measurementTracker.unregisterParticipants(hiddenToggledIds);

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
