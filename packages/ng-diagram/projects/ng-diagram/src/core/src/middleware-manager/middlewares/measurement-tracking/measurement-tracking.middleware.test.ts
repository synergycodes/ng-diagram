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
        getChangedNodeIds: vi.fn().mockReturnValue([]),
        getChangedEdgeIds: vi.fn().mockReturnValue([]),
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
      measurementTracker.requestTracking();

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);

      middleware.execute(context, nextMock, () => null);

      expect(nextMock).toHaveBeenCalledTimes(1);
      expect(context.helpers.anyNodesAdded).toHaveBeenCalled();
      expect(context.helpers.anyEdgesAdded).toHaveBeenCalled();
    });

    it('should process when there are pending measurements (subsequent pass)', () => {
      measurementTracker.requestTracking();
      measurementTracker.registerParticipants(['node:node1']);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);

      middleware.execute(context, nextMock, () => null);

      expect(nextMock).toHaveBeenCalledTimes(1);
    });

    it('should always call next even when changes are detected', () => {
      measurementTracker.requestTracking();

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
      measurementTracker.requestTracking();
    });

    it('should call registerParticipants with added node IDs', () => {
      const registerSpy = vi.spyOn(measurementTracker, 'registerParticipants');

      context.helpers.anyNodesAdded = vi.fn().mockReturnValue(true);
      context.helpers.getAddedNodes = vi.fn().mockReturnValue([
        { id: 'node1', position: { x: 0, y: 0 }, data: {} },
        { id: 'node2', position: { x: 100, y: 100 }, data: {} },
      ]);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(registerSpy).toHaveBeenCalledWith(['node:node1', 'node:node2']);
    });

    it('should call registerParticipants with added edge IDs', () => {
      const registerSpy = vi.spyOn(measurementTracker, 'registerParticipants');

      context.helpers.anyEdgesAdded = vi.fn().mockReturnValue(true);
      context.helpers.getAddedEdges = vi.fn().mockReturnValue([{ id: 'edge1', source: 'n1', target: 'n2', data: {} }]);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(registerSpy).toHaveBeenCalledWith(['edge:edge1']);
    });

    it('should include ALL changed node IDs regardless of property', () => {
      const registerSpy = vi.spyOn(measurementTracker, 'registerParticipants');

      context.helpers.getChangedNodeIds = vi.fn().mockReturnValue(['node1', 'node2']);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(registerSpy).toHaveBeenCalledWith(['node:node1', 'node:node2']);
    });

    it('should include ALL changed edge IDs regardless of property', () => {
      const registerSpy = vi.spyOn(measurementTracker, 'registerParticipants');

      context.helpers.getChangedEdgeIds = vi.fn().mockReturnValue(['edge1']);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(registerSpy).toHaveBeenCalledWith(['edge:edge1']);
    });

    it('should register data-only changes as participants', () => {
      const registerSpy = vi.spyOn(measurementTracker, 'registerParticipants');

      // Only data changed — no size, position, or measuredPorts
      context.helpers.getChangedNodeIds = vi.fn().mockReturnValue(['node1']);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(registerSpy).toHaveBeenCalledWith(['node:node1']);
      expect(measurementTracker.hasPendingMeasurements()).toBe(true);
    });

    it('should combine added entities and changed entities', () => {
      const registerSpy = vi.spyOn(measurementTracker, 'registerParticipants');

      context.helpers.anyNodesAdded = vi.fn().mockReturnValue(true);
      context.helpers.anyEdgesAdded = vi.fn().mockReturnValue(true);
      context.helpers.getAddedNodes = vi.fn().mockReturnValue([{ id: 'node1', position: { x: 0, y: 0 }, data: {} }]);
      context.helpers.getAddedEdges = vi.fn().mockReturnValue([{ id: 'edge1', source: 'n1', target: 'n2', data: {} }]);
      context.helpers.getChangedNodeIds = vi.fn().mockReturnValue(['node2']);
      context.helpers.getChangedEdgeIds = vi.fn().mockReturnValue(['edge2']);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(registerSpy).toHaveBeenCalledWith(['node:node1', 'edge:edge1', 'node:node2', 'edge:edge2']);
    });

    it('should call registerParticipants with empty array when no changes detected (no-op)', () => {
      const registerSpy = vi.spyOn(measurementTracker, 'registerParticipants');

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(registerSpy).toHaveBeenCalledWith([]);
      expect(measurementTracker.hasPendingMeasurements()).toBe(false);
    });

    it('should not call signalMeasurement', () => {
      const signalSpy = vi.spyOn(measurementTracker, 'signalMeasurement');

      context.helpers.anyNodesAdded = vi.fn().mockReturnValue(true);
      context.helpers.getAddedNodes = vi.fn().mockReturnValue([{ id: 'node1', position: { x: 0, y: 0 }, data: {} }]);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(signalSpy).not.toHaveBeenCalled();
    });
  });

  describe('subsequent pass (pending measurements)', () => {
    beforeEach(() => {
      // Simulate entities already registered from a previous first-pass
      measurementTracker.requestTracking();
      measurementTracker.registerParticipants(['node:node1', 'edge:edge1']);
    });

    it('should call signalMeasurement for nodes with changed measuredPorts', () => {
      const signalSpy = vi.spyOn(measurementTracker, 'signalMeasurement');

      context.helpers.checkIfAnyNodePropsChanged = vi.fn().mockImplementation((props: string[]) => {
        return props.includes('measuredPorts');
      });
      context.helpers.getAffectedNodeIds = vi.fn().mockReturnValue(['node1']);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(signalSpy).toHaveBeenCalledWith('node:node1');
    });

    it('should call signalMeasurement for nodes with changed size', () => {
      const signalSpy = vi.spyOn(measurementTracker, 'signalMeasurement');

      context.helpers.checkIfAnyNodePropsChanged = vi.fn().mockImplementation((props: string[]) => {
        return props.includes('size');
      });
      context.helpers.getAffectedNodeIds = vi.fn().mockReturnValue(['node1']);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(context.helpers.checkIfAnyNodePropsChanged).toHaveBeenCalledWith([
        'size',
        'position',
        'measuredPorts',
        'angle',
      ]);
      expect(signalSpy).toHaveBeenCalledWith('node:node1');
    });

    it('should call signalMeasurement for nodes with changed position', () => {
      const signalSpy = vi.spyOn(measurementTracker, 'signalMeasurement');

      context.helpers.checkIfAnyNodePropsChanged = vi.fn().mockImplementation((props: string[]) => {
        return props.includes('position');
      });
      context.helpers.getAffectedNodeIds = vi.fn().mockReturnValue(['node1']);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(signalSpy).toHaveBeenCalledWith('node:node1');
    });

    it('should call signalMeasurement for edges with changed points', () => {
      const signalSpy = vi.spyOn(measurementTracker, 'signalMeasurement');

      context.helpers.checkIfAnyEdgePropsChanged = vi.fn().mockImplementation((props: string[]) => {
        return props.includes('points');
      });
      context.helpers.getAffectedEdgeIds = vi.fn().mockReturnValue(['edge1']);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(context.helpers.checkIfAnyEdgePropsChanged).toHaveBeenCalledWith(['points', 'measuredLabels']);
      expect(signalSpy).toHaveBeenCalledWith('edge:edge1');
    });

    it('should call signalMeasurement for edges with changed measuredLabels', () => {
      const signalSpy = vi.spyOn(measurementTracker, 'signalMeasurement');

      context.helpers.checkIfAnyEdgePropsChanged = vi.fn().mockImplementation((props: string[]) => {
        return props.includes('measuredLabels');
      });
      context.helpers.getAffectedEdgeIds = vi.fn().mockReturnValue(['edge1']);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(signalSpy).toHaveBeenCalledWith('edge:edge1');
    });

    it('should not signal when no measurement-related changes detected', () => {
      const signalSpy = vi.spyOn(measurementTracker, 'signalMeasurement');

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(signalSpy).not.toHaveBeenCalled();
    });

    it('should not call registerParticipants', () => {
      const registerSpy = vi.spyOn(measurementTracker, 'registerParticipants');

      context.helpers.anyNodesAdded = vi.fn().mockReturnValue(true);
      context.helpers.getAddedNodes = vi.fn().mockReturnValue([{ id: 'node1', position: { x: 0, y: 0 }, data: {} }]);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(registerSpy).not.toHaveBeenCalled();
    });

    it('should signal both nodes and edges', () => {
      const signalSpy = vi.spyOn(measurementTracker, 'signalMeasurement');

      context.helpers.checkIfAnyNodePropsChanged = vi.fn().mockReturnValue(true);
      context.helpers.getAffectedNodeIds = vi.fn().mockReturnValue(['node1']);
      context.helpers.checkIfAnyEdgePropsChanged = vi.fn().mockReturnValue(true);
      context.helpers.getAffectedEdgeIds = vi.fn().mockReturnValue(['edge1']);

      const middleware = createMeasurementTrackingMiddleware(measurementTracker);
      middleware.execute(context, nextMock, () => null);

      expect(signalSpy).toHaveBeenCalledWith('node:node1');
      expect(signalSpy).toHaveBeenCalledWith('edge:edge1');
    });
  });
});
