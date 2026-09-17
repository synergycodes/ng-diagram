import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../../flow-core';
import { mockEdge, mockNode, mockPort } from '../../../../test-utils';
import type { CommandHandler, Edge, LinkingActionState, Node, Port } from '../../../../types';
import type { InternalLinkingActionState } from '../../../../types/action-state.interface';
import { finishRelinking } from '../finish-relinking';

describe('finishRelinking', () => {
  let mockCommandHandler: CommandHandler;
  let mockFlowCore: {
    getEdgeById: ReturnType<typeof vi.fn>;
    getNodeById: ReturnType<typeof vi.fn>;
    getNearestPortInRange: ReturnType<typeof vi.fn>;
    applyUpdate: ReturnType<typeof vi.fn>;
    templateVisibilityRegistry?: { isPortHidden: (nodeId: string, portId: string) => boolean };
    config: {
      danglingEdges: {
        enabled: boolean;
        shouldKeepOnDrop?: ReturnType<typeof vi.fn>;
      };
      linking: {
        defaultRelinkable: boolean;
        portSnapDistance: number;
        validateConnection: ReturnType<typeof vi.fn>;
      };
    };
    actionStateManager: {
      linking: LinkingActionState | null;
      clearLinking: ReturnType<typeof vi.fn>;
    };
  };

  const originalEdge: Edge = {
    ...mockEdge,
    id: 'edge-1',
    source: 'node-a',
    sourcePort: 'out',
    target: 'node-b',
    targetPort: 'in',
  };

  const sourceNode: Node = {
    ...mockNode,
    id: 'node-a',
    measuredPorts: [{ ...mockPort, id: 'out', type: 'source', side: 'right', nodeId: 'node-a' }],
  };
  const targetNode: Node = {
    ...mockNode,
    id: 'node-b',
    measuredPorts: [{ ...mockPort, id: 'in', type: 'target', side: 'left', nodeId: 'node-b' }],
  };
  const candidateNode: Node = {
    ...mockNode,
    id: 'node-c',
    position: { x: 200, y: 100 },
    measuredPorts: [
      { ...mockPort, id: 'in-c', type: 'target', side: 'left', position: { x: 0, y: 20 }, nodeId: 'node-c' },
      { ...mockPort, id: 'out-c', type: 'source', side: 'right', position: { x: 40, y: 20 }, nodeId: 'node-c' },
    ],
  };
  const nodes: Record<string, Node> = { 'node-a': sourceNode, 'node-b': targetNode, 'node-c': candidateNode };

  // Ports as the spatial hit test reports them (what getNearestPortInRange
  // returns for the drop position).
  const hitPort = (id: string, nodeId: string, type: Port['type']): Port => ({
    ...mockPort,
    id,
    nodeId,
    type,
  });

  const setLinking = (end: 'source' | 'target', temporaryEdge: Partial<Edge>): InternalLinkingActionState => {
    const linking: InternalLinkingActionState = {
      sourceNodeId: originalEdge.source,
      sourcePortId: originalEdge.sourcePort ?? '',
      temporaryEdge: { ...mockEdge, id: 'TEMPORARY_EDGE', temporary: true, ...temporaryEdge },
      relink: { edgeId: 'edge-1', end, originalEdge },
    };
    mockFlowCore.actionStateManager.linking = linking;
    return linking;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockFlowCore = {
      getEdgeById: vi.fn().mockReturnValue(originalEdge),
      getNodeById: vi.fn((id: string) => nodes[id]),
      getNearestPortInRange: vi.fn().mockReturnValue(null),
      applyUpdate: vi.fn().mockResolvedValue(undefined),
      config: {
        danglingEdges: { enabled: false },
        linking: {
          defaultRelinkable: true,
          portSnapDistance: 12,
          validateConnection: vi.fn().mockReturnValue(true),
        },
      },
      actionStateManager: {
        linking: null,
        clearLinking: vi.fn(),
      },
    };

    mockCommandHandler = {
      flowCore: mockFlowCore as unknown as FlowCore,
      emit: vi.fn(),
      register: vi.fn(),
    } as unknown as CommandHandler;
  });

  it('should do nothing when no relink is in progress', async () => {
    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'node-a',
      sourcePortId: 'out',
      temporaryEdge: null,
    };

    await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 0, y: 0 } });

    expect(mockFlowCore.applyUpdate).not.toHaveBeenCalled();
    expect(mockFlowCore.actionStateManager.clearLinking).not.toHaveBeenCalled();
  });

  it('should do nothing when a teardown is already in progress', async () => {
    const linking = setLinking('target', { source: 'node-a', sourcePort: 'out' });
    linking._finishing = true;

    await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 0, y: 0 } });

    expect(mockFlowCore.applyUpdate).not.toHaveBeenCalled();
    expect(mockFlowCore.actionStateManager.clearLinking).not.toHaveBeenCalled();
  });

  it('should run only one teardown for two overlapping finishRelinking calls', async () => {
    mockFlowCore.getNearestPortInRange.mockReturnValue(hitPort('in-c', 'node-c', 'target'));
    setLinking('target', { source: 'node-a', sourcePort: 'out' });

    // Both start before either resolves — the second must see _finishing and
    // bail without committing a second update.
    await Promise.all([
      finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 5, y: 6 } }),
      finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 5, y: 6 } }),
    ]);

    expect(mockFlowCore.applyUpdate).toHaveBeenCalledTimes(1);
  });

  it('should commit the target end to the port under the drop position', async () => {
    mockFlowCore.getNearestPortInRange.mockReturnValue(hitPort('in-c', 'node-c', 'target'));
    setLinking('target', { source: 'node-a', sourcePort: 'out' });

    await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 5, y: 6 } });

    expect(mockFlowCore.getNearestPortInRange).toHaveBeenCalledWith({ x: 5, y: 6 }, 12);
    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith(
      { edgesToUpdate: [{ id: 'edge-1', target: 'node-c', targetPort: 'in-c', targetPosition: undefined }] },
      'finishRelinking'
    );
    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });

  it('should commit the source end to the port under the drop position', async () => {
    mockFlowCore.getNearestPortInRange.mockReturnValue(hitPort('out-c', 'node-c', 'source'));
    setLinking('source', { target: 'node-b', targetPort: 'in' });

    await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 5, y: 6 } });

    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith(
      { edgesToUpdate: [{ id: 'edge-1', source: 'node-c', sourcePort: 'out-c', sourcePosition: undefined }] },
      'finishRelinking'
    );
    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });

  it('should revert with cancelled when dropped back on the original node and port', async () => {
    mockFlowCore.getNearestPortInRange.mockReturnValue(hitPort('in', 'node-b', 'target'));
    const linking = setLinking('target', { source: 'node-a', sourcePort: 'out' });

    await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 5, y: 6 } });

    expect(linking.relinkCancelReason).toBe('cancelled');
    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishRelinking');
    expect(mockFlowCore.applyUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({ edgesToUpdate: expect.anything() }),
      'finishRelinking'
    );
    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });

  describe('empty-canvas drop', () => {
    it('should detach the dragged end at the drop position when dangling edges are enabled', async () => {
      mockFlowCore.config.danglingEdges.enabled = true;
      setLinking('target', { source: 'node-a', sourcePort: 'out' });

      await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 400, y: 500 } });

      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith(
        { edgesToUpdate: [{ id: 'edge-1', target: '', targetPort: undefined, targetPosition: { x: 400, y: 500 } }] },
        'finishRelinking'
      );
      expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
    });

    it('should detach the source end at the drop position when dragging the source', async () => {
      mockFlowCore.config.danglingEdges.enabled = true;
      setLinking('source', { target: 'node-b', targetPort: 'in' });

      await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 40, y: 50 } });

      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith(
        { edgesToUpdate: [{ id: 'edge-1', source: '', sourcePort: undefined, sourcePosition: { x: 40, y: 50 } }] },
        'finishRelinking'
      );
    });

    it('should not consult the connection validator on a canvas drop', async () => {
      mockFlowCore.config.danglingEdges.enabled = true;
      setLinking('target', { source: 'node-a', sourcePort: 'out' });

      await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 400, y: 500 } });

      // A detach is not a connection — only danglingEdges.enabled and
      // shouldKeepOnDrop decide it.
      expect(mockFlowCore.config.linking.validateConnection).not.toHaveBeenCalled();
    });

    it('should align the manual points of a detached manual-routing edge to the drop position', async () => {
      mockFlowCore.config.danglingEdges.enabled = true;
      const manualEdge: Edge = {
        ...originalEdge,
        routingMode: 'manual',
        points: [
          { x: 10, y: 20 },
          { x: 60, y: 70 },
          { x: 110, y: 120 },
        ],
      };
      mockFlowCore.getEdgeById.mockReturnValue(manualEdge);
      setLinking('target', { source: 'node-a', sourcePort: 'out' });

      await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 400, y: 500 } });

      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith(
        {
          edgesToUpdate: [
            {
              id: 'edge-1',
              target: '',
              targetPort: undefined,
              targetPosition: { x: 400, y: 500 },
              points: [
                { x: 10, y: 20 },
                { x: 60, y: 70 },
                { x: 400, y: 500 },
              ],
            },
          ],
        },
        'finishRelinking'
      );
    });

    it('should revert with noTarget when dangling edges are disabled', async () => {
      const linking = setLinking('target', { source: 'node-a', sourcePort: 'out' });

      await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 400, y: 500 } });

      expect(linking.relinkCancelReason).toBe('noTarget');
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishRelinking');
      expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
    });

    it('should revert with noTarget when shouldKeepOnDrop declines the detached edge', async () => {
      const shouldKeepOnDrop = vi.fn().mockReturnValue(false);
      mockFlowCore.config.danglingEdges = { enabled: true, shouldKeepOnDrop };
      const linking = setLinking('target', { source: 'node-a', sourcePort: 'out' });

      await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 400, y: 500 } });

      // The callback sees the edge as it would be committed (detached end).
      expect(shouldKeepOnDrop).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'edge-1', target: '', targetPosition: { x: 400, y: 500 } }),
        { x: 400, y: 500 }
      );
      expect(linking.relinkCancelReason).toBe('noTarget');
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishRelinking');
    });
  });

  describe('validation', () => {
    it('should revert a target-end drop on a source-typed port instead of detaching it', async () => {
      // A port that cannot take the dragged end is a refused connection: the
      // dangling-edges feature must not turn it into a detach.
      mockFlowCore.config.danglingEdges.enabled = true;
      mockFlowCore.getNearestPortInRange.mockReturnValue(hitPort('out-c', 'node-c', 'source'));
      const linking = setLinking('target', { source: 'node-a', sourcePort: 'out' });

      await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 0, y: 0 } });

      expect(linking.relinkCancelReason).toBe('invalidConnection');
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishRelinking');
      expect(mockFlowCore.applyUpdate).not.toHaveBeenCalledWith(
        expect.objectContaining({ edgesToUpdate: expect.anything() }),
        'finishRelinking'
      );
      expect(mockFlowCore.config.linking.validateConnection).not.toHaveBeenCalled();
    });

    it('should revert a source-end drop on a target-typed port instead of detaching it', async () => {
      mockFlowCore.config.danglingEdges.enabled = true;
      mockFlowCore.getNearestPortInRange.mockReturnValue(hitPort('in-c', 'node-c', 'target'));
      const linking = setLinking('source', { target: 'node-b', targetPort: 'in' });

      await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 0, y: 0 } });

      expect(linking.relinkCancelReason).toBe('invalidConnection');
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishRelinking');
      expect(mockFlowCore.applyUpdate).not.toHaveBeenCalledWith(
        expect.objectContaining({ edgesToUpdate: expect.anything() }),
        'finishRelinking'
      );
      expect(mockFlowCore.config.linking.validateConnection).not.toHaveBeenCalled();
    });

    it('should revert a target-end drop on the fixed source node when the edge has no source port', async () => {
      // With no source port the fixed end is the whole node, so any port of it
      // is rejected as the target end — a detach would silently change the edge.
      const sourceNodeWithInput: Node = {
        ...sourceNode,
        measuredPorts: [
          ...sourceNode.measuredPorts!,
          { ...mockPort, id: 'in-a', type: 'target', side: 'left', nodeId: 'node-a' },
        ],
      };
      mockFlowCore.config.danglingEdges.enabled = true;
      mockFlowCore.getEdgeById.mockReturnValue({ ...originalEdge, sourcePort: undefined });
      mockFlowCore.getNodeById.mockImplementation((id: string) => (id === 'node-a' ? sourceNodeWithInput : nodes[id]));
      mockFlowCore.getNearestPortInRange.mockReturnValue(hitPort('in-a', 'node-a', 'target'));
      const linking = setLinking('target', { source: 'node-a', sourcePort: '' });

      await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 0, y: 0 } });

      expect(linking.relinkCancelReason).toBe('invalidConnection');
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishRelinking');
      expect(mockFlowCore.applyUpdate).not.toHaveBeenCalledWith(
        expect.objectContaining({ edgesToUpdate: expect.anything() }),
        'finishRelinking'
      );
      expect(mockFlowCore.config.linking.validateConnection).not.toHaveBeenCalled();
    });

    it('should pass reason relink and the endpoints in their proper roles (target end)', async () => {
      mockFlowCore.getNearestPortInRange.mockReturnValue(hitPort('in-c', 'node-c', 'target'));
      setLinking('target', { source: 'node-a', sourcePort: 'out' });

      await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 0, y: 0 } });

      expect(mockFlowCore.config.linking.validateConnection).toHaveBeenCalledWith(
        sourceNode,
        sourceNode.measuredPorts![0],
        candidateNode,
        candidateNode.measuredPorts![0],
        { reason: 'relink', edge: originalEdge, end: 'target' }
      );
    });

    it('should pass reason relink and the endpoints in their proper roles (source end)', async () => {
      mockFlowCore.getNearestPortInRange.mockReturnValue(hitPort('out-c', 'node-c', 'source'));
      setLinking('source', { target: 'node-b', targetPort: 'in' });

      await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 0, y: 0 } });

      expect(mockFlowCore.config.linking.validateConnection).toHaveBeenCalledWith(
        candidateNode,
        candidateNode.measuredPorts![1],
        targetNode,
        targetNode.measuredPorts![0],
        { reason: 'relink', edge: originalEdge, end: 'source' }
      );
    });

    it('should revert when validateConnection rejects the candidate', async () => {
      mockFlowCore.config.linking.validateConnection.mockReturnValue(false);
      mockFlowCore.getNearestPortInRange.mockReturnValue(hitPort('in-c', 'node-c', 'target'));
      const linking = setLinking('target', { source: 'node-a', sourcePort: 'out' });

      await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 0, y: 0 } });

      expect(linking.relinkCancelReason).toBe('invalidConnection');
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishRelinking');
      expect(mockFlowCore.applyUpdate).not.toHaveBeenCalledWith(
        expect.objectContaining({ edgesToUpdate: expect.anything() }),
        'finishRelinking'
      );
    });

    it('should revert when the candidate node is effectively hidden', async () => {
      mockFlowCore.getNodeById.mockImplementation((id: string) =>
        id === 'node-c' ? { ...candidateNode, computedHidden: true } : nodes[id]
      );
      mockFlowCore.getNearestPortInRange.mockReturnValue(hitPort('in-c', 'node-c', 'target'));
      const linking = setLinking('target', { source: 'node-a', sourcePort: 'out' });

      await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 0, y: 0 } });

      expect(linking.relinkCancelReason).toBe('invalidConnection');
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishRelinking');
      // Structural rejection — the app validator is never consulted.
      expect(mockFlowCore.config.linking.validateConnection).not.toHaveBeenCalled();
    });

    it('should revert a target-end drop on a port measured as source-typed', async () => {
      // The spatial hit still reports the port as connectable, but the node's
      // measuredPorts say it is source-typed — a stale index must not let a
      // target end commit to it.
      mockFlowCore.getNearestPortInRange.mockReturnValue(hitPort('out-c', 'node-c', 'both'));
      const linking = setLinking('target', { source: 'node-a', sourcePort: 'out' });

      await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 0, y: 0 } });

      expect(linking.relinkCancelReason).toBe('invalidConnection');
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishRelinking');
      expect(mockFlowCore.config.linking.validateConnection).not.toHaveBeenCalled();
    });

    it('should revert a source-end drop on a port measured as target-typed', async () => {
      mockFlowCore.getNearestPortInRange.mockReturnValue(hitPort('in-c', 'node-c', 'both'));
      const linking = setLinking('source', { target: 'node-b', targetPort: 'in' });

      await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 0, y: 0 } });

      expect(linking.relinkCancelReason).toBe('invalidConnection');
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishRelinking');
    });

    it('should revert when the candidate port is missing from measuredPorts', async () => {
      mockFlowCore.getNearestPortInRange.mockReturnValue(hitPort('ghost-port', 'node-c', 'target'));
      const linking = setLinking('target', { source: 'node-a', sourcePort: 'out' });

      await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 0, y: 0 } });

      expect(linking.relinkCancelReason).toBe('invalidConnection');
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishRelinking');
      expect(mockFlowCore.config.linking.validateConnection).not.toHaveBeenCalled();
    });

    it('should revert when the candidate port is template-hidden', async () => {
      mockFlowCore.templateVisibilityRegistry = {
        isPortHidden: (nodeId: string, portId: string) => nodeId === 'node-c' && portId === 'in-c',
      };
      mockFlowCore.getNearestPortInRange.mockReturnValue(hitPort('in-c', 'node-c', 'target'));
      const linking = setLinking('target', { source: 'node-a', sourcePort: 'out' });

      await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 0, y: 0 } });

      expect(linking.relinkCancelReason).toBe('invalidConnection');
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishRelinking');
      expect(mockFlowCore.config.linking.validateConnection).not.toHaveBeenCalled();
    });
  });

  it('should align the manual points of a reconnected manual-routing edge to the new port anchor', async () => {
    const manualEdge: Edge = {
      ...originalEdge,
      routingMode: 'manual',
      points: [
        { x: 10, y: 20 },
        { x: 60, y: 70 },
        { x: 110, y: 120 },
      ],
    };
    mockFlowCore.getEdgeById.mockReturnValue(manualEdge);
    mockFlowCore.getNearestPortInRange.mockReturnValue(hitPort('in-c', 'node-c', 'target'));
    setLinking('target', { source: 'node-a', sourcePort: 'out' });

    await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 0, y: 0 } });

    // Port 'in-c': node position (200, 100) + port position (0, 20), side left
    // → anchor at (200, 100 + 20 + height / 2) = (200, 125).
    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith(
      {
        edgesToUpdate: [
          {
            id: 'edge-1',
            target: 'node-c',
            targetPort: 'in-c',
            targetPosition: undefined,
            points: [
              { x: 10, y: 20 },
              { x: 60, y: 70 },
              { x: 200, y: 125 },
            ],
          },
        ],
      },
      'finishRelinking'
    );
  });

  it('should revert with cancelled when the relinked edge no longer exists', async () => {
    mockFlowCore.getEdgeById.mockReturnValue(undefined);
    const linking = setLinking('target', { source: 'node-a', sourcePort: 'out' });

    await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 0, y: 0 } });

    expect(linking.relinkCancelReason).toBe('cancelled');
    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishRelinking');
    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });

  it('should revert with cancelled when the fixed end became hidden mid-gesture', async () => {
    mockFlowCore.getNodeById.mockImplementation((id: string) =>
      id === 'node-a' ? { ...sourceNode, computedHidden: true } : nodes[id]
    );
    mockFlowCore.getNearestPortInRange.mockReturnValue(hitPort('in-c', 'node-c', 'target'));
    const linking = setLinking('target', { source: 'node-a', sourcePort: 'out' });

    await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 0, y: 0 } });

    expect(linking.relinkCancelReason).toBe('cancelled');
    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishRelinking');
  });

  it('should record the drop position on the linking state', async () => {
    mockFlowCore.getNearestPortInRange.mockReturnValue(hitPort('in-c', 'node-c', 'target'));
    const linking = setLinking('target', { source: 'node-a', sourcePort: 'out' });

    await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 12, y: 34 } });

    expect(linking.dropPosition).toEqual({ x: 12, y: 34 });
  });
});
