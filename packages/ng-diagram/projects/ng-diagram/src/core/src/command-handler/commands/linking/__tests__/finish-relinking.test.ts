import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../../flow-core';
import { mockEdge, mockNode, mockPort } from '../../../../test-utils';
import type { CommandHandler, Edge, LinkingActionState, Node } from '../../../../types';
import type { InternalLinkingActionState } from '../../../../types/action-state.interface';
import { finishRelinking } from '../finish-relinking';

describe('finishRelinking', () => {
  let mockCommandHandler: CommandHandler;
  let mockFlowCore: {
    getEdgeById: ReturnType<typeof vi.fn>;
    getNodeById: ReturnType<typeof vi.fn>;
    applyUpdate: ReturnType<typeof vi.fn>;
    config: {
      danglingEdges: {
        enabled: boolean;
        shouldKeepOnDrop?: ReturnType<typeof vi.fn>;
      };
      edgeRelinking: {
        enabled: boolean;
        validateRelink?: ReturnType<typeof vi.fn>;
      };
      linking: { validateConnection: ReturnType<typeof vi.fn> };
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
    measuredPorts: [
      { ...mockPort, id: 'in-c', type: 'target', side: 'left', nodeId: 'node-c' },
      { ...mockPort, id: 'out-c', type: 'source', side: 'right', nodeId: 'node-c' },
    ],
  };
  const nodes: Record<string, Node> = { 'node-a': sourceNode, 'node-b': targetNode, 'node-c': candidateNode };

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
      applyUpdate: vi.fn().mockResolvedValue(undefined),
      config: {
        danglingEdges: { enabled: false },
        edgeRelinking: { enabled: true },
        linking: { validateConnection: vi.fn().mockReturnValue(true) },
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

  it('should commit the target end to the candidate port on drop', async () => {
    setLinking('target', { source: 'node-a', sourcePort: 'out', target: 'node-c', targetPort: 'in-c' });

    await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 5, y: 6 } });

    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith(
      { edgesToUpdate: [{ id: 'edge-1', target: 'node-c', targetPort: 'in-c', targetPosition: undefined }] },
      'finishRelinking'
    );
    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });

  it('should commit the source end to the candidate port on drop', async () => {
    setLinking('source', { source: 'node-c', sourcePort: 'out-c', target: 'node-b', targetPort: 'in' });

    await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 5, y: 6 } });

    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith(
      { edgesToUpdate: [{ id: 'edge-1', source: 'node-c', sourcePort: 'out-c', sourcePosition: undefined }] },
      'finishRelinking'
    );
    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });

  describe('empty-canvas drop', () => {
    it('should detach the dragged end at the drop position when dangling edges are enabled', async () => {
      mockFlowCore.config.danglingEdges.enabled = true;
      setLinking('target', { source: 'node-a', sourcePort: 'out', target: '', targetPort: '' });

      await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 400, y: 500 } });

      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith(
        { edgesToUpdate: [{ id: 'edge-1', target: '', targetPort: undefined, targetPosition: { x: 400, y: 500 } }] },
        'finishRelinking'
      );
      expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
    });

    it('should detach the source end at the drop position when dragging the source', async () => {
      mockFlowCore.config.danglingEdges.enabled = true;
      setLinking('source', { source: '', sourcePort: '', target: 'node-b', targetPort: 'in' });

      await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 40, y: 50 } });

      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith(
        { edgesToUpdate: [{ id: 'edge-1', source: '', sourcePort: undefined, sourcePosition: { x: 40, y: 50 } }] },
        'finishRelinking'
      );
    });

    it('should revert with noTarget when dangling edges are disabled', async () => {
      const linking = setLinking('target', { source: 'node-a', sourcePort: 'out', target: '', targetPort: '' });

      await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 400, y: 500 } });

      expect(linking.relinkCancelReason).toBe('noTarget');
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishRelinking');
      expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
    });

    it('should revert with noTarget when shouldKeepOnDrop declines the detached edge', async () => {
      const shouldKeepOnDrop = vi.fn().mockReturnValue(false);
      mockFlowCore.config.danglingEdges = { enabled: true, shouldKeepOnDrop };
      const linking = setLinking('target', { source: 'node-a', sourcePort: 'out', target: '', targetPort: '' });

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
    it('should use validateRelink when provided and revert on false', async () => {
      const validateRelink = vi.fn().mockReturnValue(false);
      mockFlowCore.config.edgeRelinking.validateRelink = validateRelink;
      const linking = setLinking('target', {
        source: 'node-a',
        sourcePort: 'out',
        target: 'node-c',
        targetPort: 'in-c',
      });

      await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 0, y: 0 } });

      expect(validateRelink).toHaveBeenCalledWith(
        originalEdge,
        'target',
        candidateNode,
        candidateNode.measuredPorts![0]
      );
      expect(mockFlowCore.config.linking.validateConnection).not.toHaveBeenCalled();
      expect(linking.relinkCancelReason).toBe('invalidConnection');
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishRelinking');
      expect(mockFlowCore.applyUpdate).not.toHaveBeenCalledWith(
        expect.objectContaining({ edgesToUpdate: expect.anything() }),
        'finishRelinking'
      );
    });

    it('should commit when validateRelink allows the drop', async () => {
      mockFlowCore.config.edgeRelinking.validateRelink = vi.fn().mockReturnValue(true);
      setLinking('target', { source: 'node-a', sourcePort: 'out', target: 'node-c', targetPort: 'in-c' });

      await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 0, y: 0 } });

      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith(
        { edgesToUpdate: [{ id: 'edge-1', target: 'node-c', targetPort: 'in-c', targetPosition: undefined }] },
        'finishRelinking'
      );
    });

    it('should fall back to linking.validateConnection with the endpoints in their proper roles (target end)', async () => {
      setLinking('target', { source: 'node-a', sourcePort: 'out', target: 'node-c', targetPort: 'in-c' });

      await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 0, y: 0 } });

      expect(mockFlowCore.config.linking.validateConnection).toHaveBeenCalledWith(
        sourceNode,
        sourceNode.measuredPorts![0],
        candidateNode,
        candidateNode.measuredPorts![0]
      );
    });

    it('should fall back to linking.validateConnection with the endpoints in their proper roles (source end)', async () => {
      setLinking('source', { source: 'node-c', sourcePort: 'out-c', target: 'node-b', targetPort: 'in' });

      await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 0, y: 0 } });

      expect(mockFlowCore.config.linking.validateConnection).toHaveBeenCalledWith(
        candidateNode,
        candidateNode.measuredPorts![1],
        targetNode,
        targetNode.measuredPorts![0]
      );
    });

    it('should revert when validateConnection rejects the candidate', async () => {
      mockFlowCore.config.linking.validateConnection.mockReturnValue(false);
      const linking = setLinking('target', {
        source: 'node-a',
        sourcePort: 'out',
        target: 'node-c',
        targetPort: 'in-c',
      });

      await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 0, y: 0 } });

      expect(linking.relinkCancelReason).toBe('invalidConnection');
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishRelinking');
    });

    it('should revert when the candidate node is effectively hidden', async () => {
      mockFlowCore.getNodeById.mockImplementation((id: string) =>
        id === 'node-c' ? { ...candidateNode, computedHidden: true } : nodes[id]
      );
      const linking = setLinking('target', {
        source: 'node-a',
        sourcePort: 'out',
        target: 'node-c',
        targetPort: 'in-c',
      });

      await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 0, y: 0 } });

      expect(linking.relinkCancelReason).toBe('invalidConnection');
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishRelinking');
    });

    it('should revert a target-end drop on a source-typed port', async () => {
      const linking = setLinking('target', {
        source: 'node-a',
        sourcePort: 'out',
        target: 'node-c',
        targetPort: 'out-c',
      });

      await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 0, y: 0 } });

      expect(linking.relinkCancelReason).toBe('invalidConnection');
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishRelinking');
      expect(mockFlowCore.config.linking.validateConnection).not.toHaveBeenCalled();
    });

    it('should revert a source-end drop on a target-typed port', async () => {
      const linking = setLinking('source', {
        source: 'node-c',
        sourcePort: 'in-c',
        target: 'node-b',
        targetPort: 'in',
      });

      await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 0, y: 0 } });

      expect(linking.relinkCancelReason).toBe('invalidConnection');
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishRelinking');
    });
  });

  it('should revert with cancelled when the relinked edge no longer exists', async () => {
    mockFlowCore.getEdgeById.mockReturnValue(undefined);
    const linking = setLinking('target', { source: 'node-a', sourcePort: 'out', target: 'node-c', targetPort: 'in-c' });

    await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 0, y: 0 } });

    expect(linking.relinkCancelReason).toBe('cancelled');
    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishRelinking');
    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });

  it('should revert with cancelled when the fixed end became hidden mid-gesture', async () => {
    mockFlowCore.getNodeById.mockImplementation((id: string) =>
      id === 'node-a' ? { ...sourceNode, computedHidden: true } : nodes[id]
    );
    const linking = setLinking('target', { source: 'node-a', sourcePort: 'out', target: 'node-c', targetPort: 'in-c' });

    await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 0, y: 0 } });

    expect(linking.relinkCancelReason).toBe('cancelled');
    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishRelinking');
  });

  it('should record the drop position on the linking state', async () => {
    const linking = setLinking('target', { source: 'node-a', sourcePort: 'out', target: 'node-c', targetPort: 'in-c' });

    await finishRelinking(mockCommandHandler, { name: 'finishRelinking', position: { x: 12, y: 34 } });

    expect(linking.dropPosition).toEqual({ x: 12, y: 34 });
  });
});
