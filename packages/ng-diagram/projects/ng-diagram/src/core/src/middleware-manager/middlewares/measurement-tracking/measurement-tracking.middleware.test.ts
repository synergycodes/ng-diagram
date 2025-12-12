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
    it('should call next and skip processing when no pending measurements', () => {
      const middleware = createMeasurementTrackingMiddleware(measurementTracker);

      middleware.execute(context, nextMock, () => null);

      expect(nextMock).toHaveBeenCalledTimes(1);
      expect(context.helpers.anyNodesAdded).not.toHaveBeenCalled();
      expect(context.helpers.anyEdgesAdded).not.toHaveBeenCalled();
    });

    it('should process when there are pending measurements', () => {
      measurementTracker.trackStateUpdate({
        nodesToAdd: [{ id: 'node1', position: { x: 0, y: 0 }, data: {} }],
      });

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);

      middleware.execute(context, nextMock, () => null);

      expect(nextMock).toHaveBeenCalledTimes(1);
      expect(context.helpers.anyNodesAdded).toHaveBeenCalled();
      expect(context.helpers.anyEdgesAdded).toHaveBeenCalled();
    });
  });

  describe('node tracking', () => {
    beforeEach(() => {
      measurementTracker.trackStateUpdate({
        nodesToAdd: [{ id: 'node1', position: { x: 0, y: 0 }, data: {} }],
      });
    });

    it('should signal measurement for added nodes', () => {
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

    it('should signal measurement for nodes with changed size', () => {
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

    it('should signal measurement for nodes with changed position', () => {
      const signalSpy = vi.spyOn(measurementTracker, 'signalNodeMeasurement');

      context.helpers.checkIfAnyNodePropsChanged = vi.fn().mockImplementation((props: string[]) => {
        return props.includes('position');
      });
      context.helpers.getAffectedNodeIds = vi.fn().mockReturnValue(['node1']);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(signalSpy).toHaveBeenCalledWith('node1');
    });

    it('should signal measurement for nodes with changed measuredPorts', () => {
      const signalSpy = vi.spyOn(measurementTracker, 'signalNodeMeasurement');

      context.helpers.checkIfAnyNodePropsChanged = vi.fn().mockImplementation((props: string[]) => {
        return props.includes('measuredPorts');
      });
      context.helpers.getAffectedNodeIds = vi.fn().mockReturnValue(['node1']);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(signalSpy).toHaveBeenCalledWith('node1');
    });

    it('should not signal when no nodes added and no node props changed', () => {
      const signalSpy = vi.spyOn(measurementTracker, 'signalNodeMeasurement');

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(signalSpy).not.toHaveBeenCalled();
    });
  });

  describe('edge tracking', () => {
    beforeEach(() => {
      measurementTracker.trackStateUpdate({
        edgesToAdd: [{ id: 'edge1', source: 'n1', target: 'n2', data: {} }],
      });
    });

    it('should signal measurement for added edges', () => {
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

    it('should signal measurement for edges with changed points', () => {
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

    it('should signal measurement for edges with changed measuredLabels', () => {
      const signalSpy = vi.spyOn(measurementTracker, 'signalEdgeMeasurement');

      context.helpers.checkIfAnyEdgePropsChanged = vi.fn().mockImplementation((props: string[]) => {
        return props.includes('measuredLabels');
      });
      context.helpers.getAffectedEdgeIds = vi.fn().mockReturnValue(['edge1']);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(signalSpy).toHaveBeenCalledWith('edge1');
    });

    it('should not signal when no edges added and no edge props changed', () => {
      const signalSpy = vi.spyOn(measurementTracker, 'signalEdgeMeasurement');

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(signalSpy).not.toHaveBeenCalled();
    });
  });

  describe('combined tracking', () => {
    beforeEach(() => {
      measurementTracker.trackStateUpdate({
        nodesToAdd: [{ id: 'node1', position: { x: 0, y: 0 }, data: {} }],
        edgesToAdd: [{ id: 'edge1', source: 'n1', target: 'n2', data: {} }],
      });
    });

    it('should signal measurements for both nodes and edges', () => {
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

    it('should signal for both added entities and changed props', () => {
      const nodeSignalSpy = vi.spyOn(measurementTracker, 'signalNodeMeasurement');

      context.helpers.anyNodesAdded = vi.fn().mockReturnValue(true);
      context.helpers.getAddedNodes = vi.fn().mockReturnValue([{ id: 'node1', position: { x: 0, y: 0 }, data: {} }]);
      context.helpers.checkIfAnyNodePropsChanged = vi.fn().mockReturnValue(true);
      context.helpers.getAffectedNodeIds = vi.fn().mockReturnValue(['node2']);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(nodeSignalSpy).toHaveBeenCalledWith('node1');
      expect(nodeSignalSpy).toHaveBeenCalledWith('node2');
      expect(nodeSignalSpy).toHaveBeenCalledTimes(2);
    });

    it('should always call next', () => {
      context.helpers.anyNodesAdded = vi.fn().mockReturnValue(true);
      context.helpers.anyEdgesAdded = vi.fn().mockReturnValue(true);
      context.helpers.getAddedNodes = vi.fn().mockReturnValue([{ id: 'node1', position: { x: 0, y: 0 }, data: {} }]);
      context.helpers.getAddedEdges = vi.fn().mockReturnValue([{ id: 'edge1', source: 'n1', target: 'n2', data: {} }]);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(nextMock).toHaveBeenCalledTimes(1);
    });
  });
});
