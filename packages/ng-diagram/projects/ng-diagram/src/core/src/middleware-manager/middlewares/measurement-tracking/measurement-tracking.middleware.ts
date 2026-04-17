import { MeasurementTracker } from '../../../measurement-tracker/measurement-tracker';
import { Middleware } from '../../../types';

/**
 * Tracks and signals DOM measurement activity to enable `waitForMeasurements` transaction option.
 *
 * Operates in two modes:
 * - **First pass** (tracking requested via `setNextTrackingConfig`): registers only actually-changed
 *   entities via `trackEntities()`, avoiding the no-op tracking problem.
 * - **Subsequent passes** (pending measurements exist): signals individual entities to reset the
 *   debounce timer as DOM measurements flow back through `applyUpdate()`.
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
    const nodeIds: string[] = [];
    const edgeIds: string[] = [];

    if (helpers.anyNodesAdded()) {
      for (const node of helpers.getAddedNodes()) {
        nodeIds.push(node.id);
      }
    }

    if (helpers.anyEdgesAdded()) {
      for (const edge of helpers.getAddedEdges()) {
        edgeIds.push(edge.id);
      }
    }

    if (helpers.checkIfAnyNodePropsChanged(['size', 'position', 'measuredPorts'])) {
      for (const id of helpers.getAffectedNodeIds(['size', 'position', 'measuredPorts'])) {
        nodeIds.push(id);
      }
    }

    if (helpers.checkIfAnyEdgePropsChanged(['points', 'measuredLabels'])) {
      for (const id of helpers.getAffectedEdgeIds(['points', 'measuredLabels'])) {
        edgeIds.push(id);
      }
    }

    if (isFirstPass) {
      const entityIds = [...nodeIds.map((id) => `node:${id}`), ...edgeIds.map((id) => `edge:${id}`)];
      measurementTracker.trackEntities(entityIds);
    } else {
      for (const id of nodeIds) {
        measurementTracker.signalNodeMeasurement(id);
      }
      for (const id of edgeIds) {
        measurementTracker.signalEdgeMeasurement(id);
      }
    }

    next();
  },
});
