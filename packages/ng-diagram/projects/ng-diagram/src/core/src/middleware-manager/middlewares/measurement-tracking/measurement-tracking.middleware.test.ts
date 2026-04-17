import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MeasurementTracker } from '../../../measurement-tracker/measurement-tracker';
import { mockEnvironment } from '../../../test-utils';
import type { MiddlewareContext } from '../../../types';
import { createMeasurementTrackingMiddleware } from './measurement-tracking.middleware';

describe('MeasurementTrackingMiddleware', () => {
  let measurementTracker: MeasurementTracker;
  let context: MiddlewareContext;
  let nextMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    measurementTracker = new MeasurementTracker();
    nextMock = vi.fn();

    context = {
      modelActionType: 'addNodes',
      modelActionTypes: ['addNodes'],
      initialState: {
        nodes: [],
        edges: [],
        metadata: { viewport: { x: 0, y: 0, scale: 1 } },
      },
      state: {
        nodes: [],
        edges: [],
        metadata: { viewport: { x: 0, y: 0, scale: 1 } },
      },
      nodesMap: new Map(),
      edgesMap: new Map(),
      initialNodesMap: new Map(),
      initialEdgesMap: new Map(),
      initialUpdate: {},
      history: [],
      helpers: {
        anyNodesAdded: vi.fn().mockReturnValue(false),
        anyEdgesAdded: vi.fn().mockReturnValue(false),
        getAddedNodes: vi.fn().mockReturnValue([]),
        getAddedEdges: vi.fn().mockReturnValue([]),
        checkIfAnyNodePropsChanged: vi.fn().mockReturnValue(false),
        checkIfAnyEdgePropsChanged: vi.fn().mockReturnValue(false),
        getAffectedNodeIds: vi.fn().mockReturnValue([]),
        getAffectedEdgeIds: vi.fn().mockReturnValue([]),
      },
      environment: mockEnvironment,
    } as unknown as MiddlewareContext;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('execute()', () => {
    it('should call next and skip processing when no tracking requested and no pending measurements', () => {
      const middleware = createMeasurementTrackingMiddleware(measurementTracker);

      middleware.execute(context, nextMock, () => null);

      expect(nextMock).toHaveBeenCalledTimes(1);
      expect(context.helpers.anyNodesAdded).not.toHaveBeenCalled();
      expect(context.helpers.anyEdgesAdded).not.toHaveBeenCalled();
    });

    it('should process when tracking is requested (first pass)', () => {
      measurementTracker.setNextTrackingConfig();

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);

      middleware.execute(context, nextMock, () => null);

      expect(nextMock).toHaveBeenCalledTimes(1);
      expect(context.helpers.anyNodesAdded).toHaveBeenCalled();
      expect(context.helpers.anyEdgesAdded).toHaveBeenCalled();
    });

    it('should process when there are pending measurements (subsequent pass)', () => {
      measurementTracker.setNextTrackingConfig();
      measurementTracker.trackEntities(['node:node1']);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);

      middleware.execute(context, nextMock, () => null);

      expect(nextMock).toHaveBeenCalledTimes(1);
      expect(context.helpers.anyNodesAdded).toHaveBeenCalled();
      expect(context.helpers.anyEdgesAdded).toHaveBeenCalled();
    });

    it('should always call next even when changes are detected', () => {
      measurementTracker.setNextTrackingConfig();

      context.helpers.anyNodesAdded = vi.fn().mockReturnValue(true);
      context.helpers.anyEdgesAdded = vi.fn().mockReturnValue(true);
      context.helpers.getAddedNodes = vi.fn().mockReturnValue([{ id: 'node1', position: { x: 0, y: 0 }, data: {} }]);
      context.helpers.getAddedEdges = vi.fn().mockReturnValue([{ id: 'edge1', source: 'n1', target: 'n2', data: {} }]);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(nextMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('first pass (tracking requested)', () => {
    beforeEach(() => {
      measurementTracker.setNextTrackingConfig();
    });

    it('should call trackEntities with added node IDs', () => {
      const trackSpy = vi.spyOn(measurementTracker, 'trackEntities');

      context.helpers.anyNodesAdded = vi.fn().mockReturnValue(true);
      context.helpers.getAddedNodes = vi.fn().mockReturnValue([
        { id: 'node1', position: { x: 0, y: 0 }, data: {} },
        { id: 'node2', position: { x: 100, y: 100 }, data: {} },
      ]);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(trackSpy).toHaveBeenCalledWith(['node:node1', 'node:node2']);
    });

    it('should call trackEntities with added edge IDs', () => {
      const trackSpy = vi.spyOn(measurementTracker, 'trackEntities');

      context.helpers.anyEdgesAdded = vi.fn().mockReturnValue(true);
      context.helpers.getAddedEdges = vi.fn().mockReturnValue([{ id: 'edge1', source: 'n1', target: 'n2', data: {} }]);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(trackSpy).toHaveBeenCalledWith(['edge:edge1']);
    });

    it('should call trackEntities with changed node prop IDs', () => {
      const trackSpy = vi.spyOn(measurementTracker, 'trackEntities');

      context.helpers.checkIfAnyNodePropsChanged = vi.fn().mockReturnValue(true);
      context.helpers.getAffectedNodeIds = vi.fn().mockReturnValue(['node1']);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(trackSpy).toHaveBeenCalledWith(['node:node1']);
    });

    it('should call trackEntities with changed edge prop IDs', () => {
      const trackSpy = vi.spyOn(measurementTracker, 'trackEntities');

      context.helpers.checkIfAnyEdgePropsChanged = vi.fn().mockReturnValue(true);
      context.helpers.getAffectedEdgeIds = vi.fn().mockReturnValue(['edge1']);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(trackSpy).toHaveBeenCalledWith(['edge:edge1']);
    });

    it('should call trackEntities with combined node and edge IDs', () => {
      const trackSpy = vi.spyOn(measurementTracker, 'trackEntities');

      context.helpers.anyNodesAdded = vi.fn().mockReturnValue(true);
      context.helpers.anyEdgesAdded = vi.fn().mockReturnValue(true);
      context.helpers.getAddedNodes = vi.fn().mockReturnValue([{ id: 'node1', position: { x: 0, y: 0 }, data: {} }]);
      context.helpers.getAddedEdges = vi.fn().mockReturnValue([{ id: 'edge1', source: 'n1', target: 'n2', data: {} }]);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(trackSpy).toHaveBeenCalledWith(['node:node1', 'edge:edge1']);
    });

    it('should call trackEntities with empty array when no changes detected (no-op)', () => {
      const trackSpy = vi.spyOn(measurementTracker, 'trackEntities');

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(trackSpy).toHaveBeenCalledWith([]);
      expect(measurementTracker.hasPendingMeasurements()).toBe(false);
    });

    it('should not call signalNodeMeasurement or signalEdgeMeasurement', () => {
      const nodeSignalSpy = vi.spyOn(measurementTracker, 'signalNodeMeasurement');
      const edgeSignalSpy = vi.spyOn(measurementTracker, 'signalEdgeMeasurement');

      context.helpers.anyNodesAdded = vi.fn().mockReturnValue(true);
      context.helpers.getAddedNodes = vi.fn().mockReturnValue([{ id: 'node1', position: { x: 0, y: 0 }, data: {} }]);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(nodeSignalSpy).not.toHaveBeenCalled();
      expect(edgeSignalSpy).not.toHaveBeenCalled();
    });

    it('should check correct node props', () => {
      const trackSpy = vi.spyOn(measurementTracker, 'trackEntities');

      context.helpers.checkIfAnyNodePropsChanged = vi.fn().mockImplementation((props: string[]) => {
        return props.includes('size');
      });
      context.helpers.getAffectedNodeIds = vi.fn().mockReturnValue(['node1']);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(context.helpers.checkIfAnyNodePropsChanged).toHaveBeenCalledWith(['size', 'position', 'measuredPorts']);
      expect(trackSpy).toHaveBeenCalledWith(['node:node1']);
    });

    it('should check correct edge props', () => {
      const trackSpy = vi.spyOn(measurementTracker, 'trackEntities');

      context.helpers.checkIfAnyEdgePropsChanged = vi.fn().mockImplementation((props: string[]) => {
        return props.includes('points');
      });
      context.helpers.getAffectedEdgeIds = vi.fn().mockReturnValue(['edge1']);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(context.helpers.checkIfAnyEdgePropsChanged).toHaveBeenCalledWith(['points', 'measuredLabels']);
      expect(trackSpy).toHaveBeenCalledWith(['edge:edge1']);
    });

    it('should include both added entities and changed props', () => {
      const trackSpy = vi.spyOn(measurementTracker, 'trackEntities');

      context.helpers.anyNodesAdded = vi.fn().mockReturnValue(true);
      context.helpers.getAddedNodes = vi.fn().mockReturnValue([{ id: 'node1', position: { x: 0, y: 0 }, data: {} }]);
      context.helpers.checkIfAnyNodePropsChanged = vi.fn().mockReturnValue(true);
      context.helpers.getAffectedNodeIds = vi.fn().mockReturnValue(['node2']);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(trackSpy).toHaveBeenCalledWith(['node:node1', 'node:node2']);
    });
  });

  describe('subsequent pass (pending measurements)', () => {
    beforeEach(() => {
      // Simulate entities already tracked from a previous first-pass
      measurementTracker.setNextTrackingConfig();
      measurementTracker.trackEntities(['node:node1', 'edge:edge1']);
    });

    it('should call signalNodeMeasurement for added nodes', () => {
      const signalSpy = vi.spyOn(measurementTracker, 'signalNodeMeasurement');

      context.helpers.anyNodesAdded = vi.fn().mockReturnValue(true);
      context.helpers.getAddedNodes = vi.fn().mockReturnValue([
        { id: 'node1', position: { x: 0, y: 0 }, data: {} },
        { id: 'node2', position: { x: 100, y: 100 }, data: {} },
      ]);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(signalSpy).toHaveBeenCalledWith('node1');
      expect(signalSpy).toHaveBeenCalledWith('node2');
      expect(signalSpy).toHaveBeenCalledTimes(2);
    });

    it('should call signalEdgeMeasurement for added edges', () => {
      const signalSpy = vi.spyOn(measurementTracker, 'signalEdgeMeasurement');

      context.helpers.anyEdgesAdded = vi.fn().mockReturnValue(true);
      context.helpers.getAddedEdges = vi.fn().mockReturnValue([
        { id: 'edge1', source: 'n1', target: 'n2', data: {} },
        { id: 'edge2', source: 'n2', target: 'n3', data: {} },
      ]);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(signalSpy).toHaveBeenCalledWith('edge1');
      expect(signalSpy).toHaveBeenCalledWith('edge2');
      expect(signalSpy).toHaveBeenCalledTimes(2);
    });

    it('should call signalNodeMeasurement for nodes with changed size', () => {
      const signalSpy = vi.spyOn(measurementTracker, 'signalNodeMeasurement');

      context.helpers.checkIfAnyNodePropsChanged = vi.fn().mockImplementation((props: string[]) => {
        return props.includes('size');
      });
      context.helpers.getAffectedNodeIds = vi.fn().mockReturnValue(['node1']);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(context.helpers.checkIfAnyNodePropsChanged).toHaveBeenCalledWith(['size', 'position', 'measuredPorts']);
      expect(signalSpy).toHaveBeenCalledWith('node1');
    });

    it('should call signalNodeMeasurement for nodes with changed position', () => {
      const signalSpy = vi.spyOn(measurementTracker, 'signalNodeMeasurement');

      context.helpers.checkIfAnyNodePropsChanged = vi.fn().mockImplementation((props: string[]) => {
        return props.includes('position');
      });
      context.helpers.getAffectedNodeIds = vi.fn().mockReturnValue(['node1']);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(signalSpy).toHaveBeenCalledWith('node1');
    });

    it('should call signalNodeMeasurement for nodes with changed measuredPorts', () => {
      const signalSpy = vi.spyOn(measurementTracker, 'signalNodeMeasurement');

      context.helpers.checkIfAnyNodePropsChanged = vi.fn().mockImplementation((props: string[]) => {
        return props.includes('measuredPorts');
      });
      context.helpers.getAffectedNodeIds = vi.fn().mockReturnValue(['node1']);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(signalSpy).toHaveBeenCalledWith('node1');
    });

    it('should call signalEdgeMeasurement for edges with changed points', () => {
      const signalSpy = vi.spyOn(measurementTracker, 'signalEdgeMeasurement');

      context.helpers.checkIfAnyEdgePropsChanged = vi.fn().mockImplementation((props: string[]) => {
        return props.includes('points');
      });
      context.helpers.getAffectedEdgeIds = vi.fn().mockReturnValue(['edge1']);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(context.helpers.checkIfAnyEdgePropsChanged).toHaveBeenCalledWith(['points', 'measuredLabels']);
      expect(signalSpy).toHaveBeenCalledWith('edge1');
    });

    it('should call signalEdgeMeasurement for edges with changed measuredLabels', () => {
      const signalSpy = vi.spyOn(measurementTracker, 'signalEdgeMeasurement');

      context.helpers.checkIfAnyEdgePropsChanged = vi.fn().mockImplementation((props: string[]) => {
        return props.includes('measuredLabels');
      });
      context.helpers.getAffectedEdgeIds = vi.fn().mockReturnValue(['edge1']);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(signalSpy).toHaveBeenCalledWith('edge1');
    });

    it('should not signal when no changes detected', () => {
      const nodeSignalSpy = vi.spyOn(measurementTracker, 'signalNodeMeasurement');
      const edgeSignalSpy = vi.spyOn(measurementTracker, 'signalEdgeMeasurement');

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(nodeSignalSpy).not.toHaveBeenCalled();
      expect(edgeSignalSpy).not.toHaveBeenCalled();
    });

    it('should not call trackEntities', () => {
      const trackSpy = vi.spyOn(measurementTracker, 'trackEntities');

      context.helpers.anyNodesAdded = vi.fn().mockReturnValue(true);
      context.helpers.getAddedNodes = vi.fn().mockReturnValue([{ id: 'node1', position: { x: 0, y: 0 }, data: {} }]);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(trackSpy).not.toHaveBeenCalled();
    });

    it('should signal both nodes and edges', () => {
      const nodeSignalSpy = vi.spyOn(measurementTracker, 'signalNodeMeasurement');
      const edgeSignalSpy = vi.spyOn(measurementTracker, 'signalEdgeMeasurement');

      context.helpers.anyNodesAdded = vi.fn().mockReturnValue(true);
      context.helpers.anyEdgesAdded = vi.fn().mockReturnValue(true);
      context.helpers.getAddedNodes = vi.fn().mockReturnValue([{ id: 'node1', position: { x: 0, y: 0 }, data: {} }]);
      context.helpers.getAddedEdges = vi.fn().mockReturnValue([{ id: 'edge1', source: 'n1', target: 'n2', data: {} }]);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(nodeSignalSpy).toHaveBeenCalledWith('node1');
      expect(edgeSignalSpy).toHaveBeenCalledWith('edge1');
    });
  });
});
