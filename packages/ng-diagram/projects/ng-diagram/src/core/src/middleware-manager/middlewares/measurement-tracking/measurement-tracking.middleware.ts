import { MeasurementTracker } from '../../../measurement-tracker';
import { Middleware } from '../../../types';

/**
 * Signals DOM measurement activity to enable `waitForMeasurements` transaction option.
 *
 * @internal
 */
export const createMeasurementTrackingMiddleware = (
  measurementTracker: MeasurementTracker
): Middleware<'measurement-tracking'> => ({
  name: 'measurement-tracking',
  execute: (context, next) => {
    if (!measurementTracker.hasPendingMeasurements()) {
      next();
      return;
    }

    const { helpers } = context;

    if (helpers.anyNodesAdded()) {
      const addedNodes = helpers.getAddedNodes();
      for (const node of addedNodes) {
        measurementTracker.signalNodeMeasurement(node.id);
      }
    }

    if (helpers.anyEdgesAdded()) {
      const addedEdges = helpers.getAddedEdges();
      for (const edge of addedEdges) {
        measurementTracker.signalEdgeMeasurement(edge.id);
      }
    }

    if (helpers.checkIfAnyNodePropsChanged(['size', 'position', 'measuredPorts'])) {
      const affectedNodeIds = helpers.getAffectedNodeIds(['size', 'position', 'measuredPorts']);
      for (const id of affectedNodeIds) {
        measurementTracker.signalNodeMeasurement(id);
      }
    }

    if (helpers.checkIfAnyEdgePropsChanged(['points', 'measuredLabels'])) {
      const affectedEdgeIds = helpers.getAffectedEdgeIds(['points', 'measuredLabels']);
      for (const id of affectedEdgeIds) {
        measurementTracker.signalEdgeMeasurement(id);
      }
    }

    next();
  },
});
