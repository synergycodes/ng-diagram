import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../../flow-core';
import { mockNode, mockPort } from '../../../../test-utils';
import type { CommandHandler, Edge, LinkingActionState, Node, Port } from '../../../../types';
import type { InternalLinkingActionState } from '../../../../types/action-state.interface';
import { moveTemporaryEdge, MoveTemporaryEdgeCommand } from '../move-temporary-edge';

vi.mock('../utils', () => ({
  createTemporaryEdge: vi.fn(),
  isProperTargetPort: vi.fn(),
  isProperSourcePort: vi.fn(),
  validateConnection: vi.fn(),
  connectionContextForGesture: vi.fn().mockReturnValue({ reason: 'draw' }),
  relinkPreviewBase: vi.fn().mockReturnValue({}),
}));

import { createTemporaryEdge, isProperSourcePort, isProperTargetPort, validateConnection } from '../utils';
const mockCreateTemporaryEdge = vi.mocked(createTemporaryEdge);
const mockIsProperTargetPort = vi.mocked(isProperTargetPort);
const mockIsProperSourcePort = vi.mocked(isProperSourcePort);
const mockValidateConnection = vi.mocked(validateConnection);

describe('moveTemporaryEdge', () => {
  let mockCommandHandler: CommandHandler;
  let mockFlowCore: {
    getState: ReturnType<typeof vi.fn>;
    getNearestPortInRange: ReturnType<typeof vi.fn>;
    getNodeById: ReturnType<typeof vi.fn>;
    applyUpdate: ReturnType<typeof vi.fn>;
    config: { linking: { portSnapDistance: number } };
    actionStateManager: {
      linking: LinkingActionState | null;
    };
  };

  const mockTemporaryEdge: Edge = {
    id: 'temp-edge',
    source: 'source-node',
    sourcePort: 'source-port',
    target: '',
    targetPort: '',
    data: {},
  };

  const mockTargetPort: Port = {
    ...mockPort,
    id: 'target-port',
    nodeId: 'target-node',
  };

  const mockTargetNode: Node = {
    ...mockNode,
    id: 'target-node',
    measuredPorts: [mockTargetPort],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockFlowCore = {
      getState: vi.fn(),
      getNearestPortInRange: vi.fn(),
      getNodeById: vi.fn(),
      applyUpdate: vi.fn().mockResolvedValue(undefined),
      config: { linking: { portSnapDistance: 10 } },
      actionStateManager: {
        linking: null,
      },
    };

    mockCommandHandler = {
      flowCore: mockFlowCore as unknown as FlowCore,
      emit: vi.fn(),
      register: vi.fn(),
    } as unknown as CommandHandler;
  });

  it('should return early when no temporary edge exists', async () => {
    mockFlowCore.actionStateManager.linking = null;

    const command: MoveTemporaryEdgeCommand = {
      name: 'moveTemporaryEdge',
      position: { x: 100, y: 200 },
    };

    await moveTemporaryEdge(mockCommandHandler, command);

    expect(mockFlowCore.applyUpdate).not.toHaveBeenCalled();
  });

  it('should return early when target is the same', async () => {
    const existingEdge = {
      ...mockTemporaryEdge,
      target: 'target-node',
      targetPort: 'target-port',
    };

    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: existingEdge,
    };
    mockFlowCore.getNearestPortInRange.mockReturnValue(mockTargetPort);
    mockIsProperTargetPort.mockReturnValue(true);

    const command: MoveTemporaryEdgeCommand = {
      name: 'moveTemporaryEdge',
      position: { x: 100, y: 200 },
    };

    await moveTemporaryEdge(mockCommandHandler, command);

    expect(mockFlowCore.applyUpdate).not.toHaveBeenCalled();
  });

  it('should create floating edge when no target port found', async () => {
    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
    };
    mockFlowCore.getNearestPortInRange.mockReturnValue(null);

    const floatingEdge = { ...mockTemporaryEdge, target: '', targetPort: '' };
    mockCreateTemporaryEdge.mockReturnValue(floatingEdge);

    const command: MoveTemporaryEdgeCommand = {
      name: 'moveTemporaryEdge',
      position: { x: 100, y: 200 },
    };

    await moveTemporaryEdge(mockCommandHandler, command);

    expect(mockCreateTemporaryEdge).toHaveBeenCalledWith(mockFlowCore.config, {
      source: mockTemporaryEdge.source,
      sourcePort: mockTemporaryEdge.sourcePort,
      target: '',
      targetPort: '',
      targetPosition: { x: 100, y: 200 },
    });

    expect(mockFlowCore.actionStateManager.linking).toEqual({
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: floatingEdge,
    });
    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'moveTemporaryEdge');
  });

  it('should create connected edge when valid target found', async () => {
    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
    };
    mockFlowCore.getNearestPortInRange.mockReturnValue(mockTargetPort);
    mockIsProperTargetPort.mockReturnValue(true);
    mockFlowCore.getNodeById.mockReturnValue(mockTargetNode);
    mockValidateConnection.mockReturnValue(true);

    const connectedEdge = {
      ...mockTemporaryEdge,
      target: 'target-node',
      targetPort: 'target-port',
    };
    mockCreateTemporaryEdge.mockReturnValue(connectedEdge);

    const command: MoveTemporaryEdgeCommand = {
      name: 'moveTemporaryEdge',
      position: { x: 100, y: 200 },
    };

    await moveTemporaryEdge(mockCommandHandler, command);

    expect(mockCreateTemporaryEdge).toHaveBeenCalledWith(mockFlowCore.config, {
      source: mockTemporaryEdge.source,
      sourcePort: mockTemporaryEdge.sourcePort,
      target: 'target-node',
      targetPort: 'target-port',
      targetPosition: { x: 100, y: 200 },
    });

    expect(mockFlowCore.actionStateManager.linking).toEqual({
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: connectedEdge,
    });
    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'moveTemporaryEdge');
  });

  it('should create floating edge when connection validation fails', async () => {
    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
    };
    mockFlowCore.getNearestPortInRange.mockReturnValue(mockTargetPort);
    mockIsProperTargetPort.mockReturnValue(true);
    mockFlowCore.getNodeById.mockReturnValue(mockTargetNode);
    mockValidateConnection.mockReturnValue(false); // Connection invalid

    const floatingEdge = { ...mockTemporaryEdge, target: '', targetPort: '' };
    mockCreateTemporaryEdge.mockReturnValue(floatingEdge);

    const command: MoveTemporaryEdgeCommand = {
      name: 'moveTemporaryEdge',
      position: { x: 100, y: 200 },
    };

    await moveTemporaryEdge(mockCommandHandler, command);

    expect(mockValidateConnection).toHaveBeenCalledWith(
      mockFlowCore,
      mockTemporaryEdge.source,
      mockTemporaryEdge.sourcePort,
      'target-node',
      'target-port',
      undefined,
      { reason: 'draw' }
    );

    expect(mockCreateTemporaryEdge).toHaveBeenCalledWith(mockFlowCore.config, {
      source: mockTemporaryEdge.source,
      sourcePort: mockTemporaryEdge.sourcePort,
      target: '',
      targetPort: '',
      targetPosition: { x: 100, y: 200 },
    });
  });

  it('should use port snap distance for target detection', async () => {
    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
    };
    mockFlowCore.getNearestPortInRange.mockReturnValue(null);
    mockCreateTemporaryEdge.mockReturnValue(mockTemporaryEdge);

    const position = { x: 150, y: 250 };
    const command: MoveTemporaryEdgeCommand = {
      name: 'moveTemporaryEdge',
      position,
    };

    await moveTemporaryEdge(mockCommandHandler, command);

    expect(mockFlowCore.getNearestPortInRange).toHaveBeenCalledWith(
      position,
      mockFlowCore.config.linking.portSnapDistance
    );
  });

  describe('relinking the source end', () => {
    const originalEdge: Edge = {
      id: 'edge-1',
      source: 'old-source-node',
      sourcePort: 'old-source-port',
      target: 'fixed-target-node',
      targetPort: 'fixed-target-port',
      data: {},
    };

    const sourceRelinkTemporaryEdge: Edge = {
      id: 'temp-edge',
      source: '',
      sourcePort: '',
      target: 'fixed-target-node',
      targetPort: 'fixed-target-port',
      data: {},
    };

    const candidatePort: Port = {
      ...mockPort,
      id: 'candidate-port',
      type: 'source',
      nodeId: 'candidate-node',
    };

    const candidateNode: Node = {
      ...mockNode,
      id: 'candidate-node',
      measuredPorts: [candidatePort],
    };

    const setSourceRelink = (temporaryEdge: Edge = sourceRelinkTemporaryEdge): InternalLinkingActionState => {
      const linking: InternalLinkingActionState = {
        sourceNodeId: 'old-source-node',
        sourcePortId: 'old-source-port',
        temporaryEdge,
        relink: { edgeId: 'edge-1', end: 'source', originalEdge },
      };
      mockFlowCore.actionStateManager.linking = linking;
      return linking;
    };

    it('should snap the dragged source end using isProperSourcePort', async () => {
      setSourceRelink();
      mockFlowCore.getNearestPortInRange.mockReturnValue(candidatePort);
      mockIsProperSourcePort.mockReturnValue(true);
      mockFlowCore.getNodeById.mockReturnValue(candidateNode);
      mockValidateConnection.mockReturnValue(true);
      const snappedEdge = { ...sourceRelinkTemporaryEdge, source: 'candidate-node', sourcePort: 'candidate-port' };
      mockCreateTemporaryEdge.mockReturnValue(snappedEdge);

      await moveTemporaryEdge(mockCommandHandler, { name: 'moveTemporaryEdge', position: { x: 100, y: 200 } });

      // The candidate must be source-capable and distinct from the FIXED
      // (target) end — the target-port check does not apply.
      expect(mockIsProperSourcePort).toHaveBeenCalledWith(candidatePort, 'fixed-target-node', 'fixed-target-port');
      expect(mockIsProperTargetPort).not.toHaveBeenCalled();
      expect(mockCreateTemporaryEdge).toHaveBeenCalledWith(mockFlowCore.config, {
        target: 'fixed-target-node',
        targetPort: 'fixed-target-port',
        targetPosition: undefined,
        source: 'candidate-node',
        sourcePort: 'candidate-port',
        sourcePosition: { x: 100, y: 200 },
      });
      expect(mockFlowCore.actionStateManager.linking!.temporaryEdge).toBe(snappedEdge);
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'moveTemporaryEdge');
    });

    it('should return early when the source end already snaps to the same candidate', async () => {
      const linking = setSourceRelink({
        ...sourceRelinkTemporaryEdge,
        source: 'candidate-node',
        sourcePort: 'candidate-port',
      });
      mockFlowCore.getNearestPortInRange.mockReturnValue(candidatePort);
      mockIsProperSourcePort.mockReturnValue(true);

      await moveTemporaryEdge(mockCommandHandler, { name: 'moveTemporaryEdge', position: { x: 100, y: 200 } });

      expect(mockCreateTemporaryEdge).not.toHaveBeenCalled();
      expect(mockFlowCore.applyUpdate).not.toHaveBeenCalled();
      // No state write — the live linking object is untouched.
      expect(mockFlowCore.actionStateManager.linking).toBe(linking);
    });

    it('should validate with the candidate in the source role', async () => {
      setSourceRelink();
      mockFlowCore.getNearestPortInRange.mockReturnValue(candidatePort);
      mockIsProperSourcePort.mockReturnValue(true);
      mockFlowCore.getNodeById.mockReturnValue(candidateNode);
      mockValidateConnection.mockReturnValue(true);
      mockCreateTemporaryEdge.mockReturnValue(sourceRelinkTemporaryEdge);

      await moveTemporaryEdge(mockCommandHandler, { name: 'moveTemporaryEdge', position: { x: 100, y: 200 } });

      expect(mockValidateConnection).toHaveBeenCalledWith(
        mockFlowCore,
        'candidate-node',
        'candidate-port',
        'fixed-target-node',
        'fixed-target-port',
        undefined,
        { reason: 'draw' }
      );
    });

    it('should un-snap to a floating source end when the candidate fails validation', async () => {
      setSourceRelink();
      mockFlowCore.getNearestPortInRange.mockReturnValue(candidatePort);
      mockIsProperSourcePort.mockReturnValue(true);
      mockFlowCore.getNodeById.mockReturnValue(candidateNode);
      mockValidateConnection.mockReturnValue(false);
      mockCreateTemporaryEdge.mockReturnValue(sourceRelinkTemporaryEdge);

      await moveTemporaryEdge(mockCommandHandler, { name: 'moveTemporaryEdge', position: { x: 100, y: 200 } });

      expect(mockCreateTemporaryEdge).toHaveBeenCalledWith(mockFlowCore.config, {
        target: 'fixed-target-node',
        targetPort: 'fixed-target-port',
        targetPosition: undefined,
        source: '',
        sourcePort: '',
        sourcePosition: { x: 100, y: 200 },
      });
    });
  });

  it('should preserve the gesture stamp when replacing the linking state', async () => {
    const stamped: InternalLinkingActionState = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
      _gestureId: 42,
    };
    mockFlowCore.actionStateManager.linking = stamped;
    mockFlowCore.getNearestPortInRange.mockReturnValue(null);
    mockCreateTemporaryEdge.mockReturnValue({ ...mockTemporaryEdge, target: '', targetPort: '' });

    await moveTemporaryEdge(mockCommandHandler, { name: 'moveTemporaryEdge', position: { x: 100, y: 200 } });

    const replaced = mockFlowCore.actionStateManager.linking as InternalLinkingActionState;
    // The finish commands' clear guards depend on the stamp surviving this replacement.
    expect(replaced).not.toBe(stamped);
    expect(replaced._gestureId).toBe(42);
  });
});
