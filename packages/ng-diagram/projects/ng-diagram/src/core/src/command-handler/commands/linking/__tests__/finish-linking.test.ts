import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../../flow-core';
import { mockNode } from '../../../../test-utils';
import type { CommandHandler, Edge, LinkingActionState, Node } from '../../../../types';
import type { InternalLinkingActionState } from '../../../../types/action-state.interface';
import { finishLinking } from '../finish-linking';

vi.mock('../../../../utils', () => ({
  getPortFlowPosition: vi.fn(),
}));

vi.mock('../utils', () => ({
  createFinalEdge: vi.fn(),
  validateConnection: vi.fn(),
}));

import { getPortFlowPosition } from '../../../../utils';
import { createFinalEdge, validateConnection } from '../utils';
const mockGetPortFlowPosition = vi.mocked(getPortFlowPosition);
const mockCreateFinalEdge = vi.mocked(createFinalEdge);
const mockValidateConnection = vi.mocked(validateConnection);

describe('finishLinking', () => {
  let mockCommandHandler: CommandHandler;
  let mockFlowCore: {
    getState: ReturnType<typeof vi.fn>;
    getNodeById: ReturnType<typeof vi.fn>;
    applyUpdate: ReturnType<typeof vi.fn>;
    config: object;
    actionStateManager: {
      linking: LinkingActionState | null;
      clearLinking: ReturnType<typeof vi.fn>;
    };
  };

  const mockTemporaryEdge: Edge = {
    id: 'temp-edge',
    source: 'source-node',
    sourcePort: 'source-port',
    target: 'target-node',
    targetPort: 'target-port',
    data: {},
  };

  const mockTargetNode: Node = {
    ...mockNode,
    id: 'target-node',
    position: { x: 100, y: 200 },
    measuredPorts: [
      {
        id: 'target-port',
        type: 'target',
        side: 'left',
        position: { x: 0, y: 0 },
        size: { width: 10, height: 10 },
        nodeId: 'target-node',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockFlowCore = {
      getState: vi.fn(),
      getNodeById: vi.fn(),
      applyUpdate: vi.fn().mockResolvedValue(undefined),
      config: {},
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

  it('should return early when no temporary edge exists', async () => {
    mockFlowCore.actionStateManager.linking = null;

    await finishLinking(mockCommandHandler, { name: 'finishLinking', position: { x: 0, y: 0 } });

    expect(mockFlowCore.applyUpdate).not.toHaveBeenCalled();
    expect(mockFlowCore.actionStateManager.clearLinking).not.toHaveBeenCalled();
  });

  it('should clear linking state when linking exists but temporaryEdge is null', async () => {
    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: null,
    };

    await finishLinking(mockCommandHandler, { name: 'finishLinking', position: { x: 0, y: 0 } });

    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishLinking');
    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });

  it('should clear the linking state even when connection validation throws', async () => {
    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
    };
    mockValidateConnection.mockImplementation(() => {
      throw new Error('user validation failed');
    });

    await expect(
      finishLinking(mockCommandHandler, { name: 'finishLinking', position: { x: 0, y: 0 } })
    ).rejects.toThrow('user validation failed');

    // A stranded linking state would permanently block new links (the linking
    // directive refuses to start while isLinking() is true).
    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });

  it('should clear the linking state even when the state object was replaced during the awaited update', async () => {
    // The edges-routing middleware replaces actionStateManager.linking with a copy
    // during finishLinking's own applyUpdate — the clear must still run, or the
    // temporary edge is stranded.
    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: null,
    };

    const replacedByMiddleware: LinkingActionState = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: null,
    };
    mockFlowCore.applyUpdate.mockImplementation(async () => {
      mockFlowCore.actionStateManager.linking = replacedByMiddleware;
    });

    await finishLinking(mockCommandHandler, { name: 'finishLinking', position: { x: 0, y: 0 } });

    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });

  it('should clear linking with noTarget reason when temporary edge has no target', async () => {
    const temporaryEdgeNoTarget: Edge = {
      ...mockTemporaryEdge,
      target: '',
      targetPort: '',
    };

    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: temporaryEdgeNoTarget,
    };

    await finishLinking(mockCommandHandler, { name: 'finishLinking', position: { x: 50, y: 60 } });

    expect(mockFlowCore.actionStateManager.linking!.cancelReason).toBe('noTarget');
    expect(mockFlowCore.actionStateManager.linking!.dropPosition).toEqual({ x: 50, y: 60 });
    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishLinking');
    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });

  it('should clear temporary edge when connection validation fails', async () => {
    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
    };
    mockValidateConnection.mockReturnValue(false);

    await finishLinking(mockCommandHandler, { name: 'finishLinking', position: { x: 0, y: 0 } });

    expect(mockValidateConnection).toHaveBeenCalledWith(
      mockFlowCore,
      'source-node',
      'source-port',
      'target-node',
      'target-port',
      true
    );

    expect(mockFlowCore.actionStateManager.linking!.cancelReason).toBe('invalidConnection');
    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishLinking');
    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });

  it('should clear temporary edge when target node does not exist', async () => {
    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
    };
    mockValidateConnection.mockReturnValue(true);
    mockFlowCore.getNodeById.mockReturnValue(null);

    await finishLinking(mockCommandHandler, { name: 'finishLinking', position: { x: 0, y: 0 } });

    expect(mockFlowCore.getNodeById).toHaveBeenCalledWith('target-node');
    expect(mockFlowCore.actionStateManager.linking!.cancelReason).toBe('invalidTarget');
    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishLinking');
    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });

  it('should clear temporary edge when target port is source type', async () => {
    const targetNodeWithSourcePort = {
      ...mockTargetNode,
      measuredPorts: [
        {
          id: 'target-port',
          type: 'source', // Invalid for target
          side: 'right',
          position: { x: 0, y: 0 },
          size: { width: 10, height: 10 },
          nodeId: 'target-node',
        },
      ],
    };

    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
    };
    mockValidateConnection.mockReturnValue(true);
    mockFlowCore.getNodeById.mockReturnValue(targetNodeWithSourcePort);

    await finishLinking(mockCommandHandler, { name: 'finishLinking', position: { x: 0, y: 0 } });

    expect(mockFlowCore.actionStateManager.linking!.cancelReason).toBe('invalidTarget');
    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishLinking');
    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });

  it('should clear temporary edge when target position cannot be determined', async () => {
    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
    };
    mockValidateConnection.mockReturnValue(true);
    mockFlowCore.getNodeById.mockReturnValue(mockTargetNode);
    mockGetPortFlowPosition.mockReturnValue(null); // No position available

    await finishLinking(mockCommandHandler, { name: 'finishLinking', position: { x: 0, y: 0 } });

    expect(mockGetPortFlowPosition).toHaveBeenCalledWith(mockTargetNode, 'target-port');
    expect(mockFlowCore.actionStateManager.linking!.cancelReason).toBe('invalidTarget');
    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishLinking');
    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });

  it('should call clearLinking after applyUpdate on failure paths', async () => {
    const callOrder: string[] = [];
    mockFlowCore.applyUpdate.mockImplementation(async () => {
      callOrder.push('applyUpdate');
    });
    mockFlowCore.actionStateManager.clearLinking.mockImplementation(() => {
      callOrder.push('clearLinking');
    });

    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: { ...mockTemporaryEdge, target: '', targetPort: '' },
    };

    await finishLinking(mockCommandHandler, { name: 'finishLinking', position: { x: 0, y: 0 } });

    expect(callOrder).toEqual(['applyUpdate', 'clearLinking']);
  });

  it('should call clearLinking after applyUpdate on success path', async () => {
    const callOrder: string[] = [];
    mockFlowCore.applyUpdate.mockImplementation(async () => {
      callOrder.push('applyUpdate');
    });
    mockFlowCore.actionStateManager.clearLinking.mockImplementation(() => {
      callOrder.push('clearLinking');
    });

    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
    };
    mockValidateConnection.mockReturnValue(true);
    mockFlowCore.getNodeById.mockReturnValue(mockTargetNode);
    mockGetPortFlowPosition.mockReturnValue({ x: 150, y: 250 });
    mockCreateFinalEdge.mockReturnValue({ id: 'final', source: 'source-node', target: 'target-node', data: {} });

    await finishLinking(mockCommandHandler, { name: 'finishLinking', position: { x: 0, y: 0 } });

    expect(callOrder).toEqual(['applyUpdate', 'clearLinking']);
  });

  it('should create final edge when all validations pass with port', async () => {
    const targetPosition = { x: 150, y: 250 };
    const finalEdge = {
      id: 'final-edge',
      source: 'source-node',
      target: 'target-node',
      data: {},
    };

    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
    };
    mockValidateConnection.mockReturnValue(true);
    mockFlowCore.getNodeById.mockReturnValue(mockTargetNode);
    mockGetPortFlowPosition.mockReturnValue(targetPosition);
    mockCreateFinalEdge.mockReturnValue(finalEdge);

    await finishLinking(mockCommandHandler, { name: 'finishLinking', position: { x: 0, y: 0 } });

    expect(mockCreateFinalEdge).toHaveBeenCalledWith(mockFlowCore.config, mockTemporaryEdge, {
      target: 'target-node',
      targetPort: 'target-port',
      targetPosition,
    });

    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith(
      {
        edgesToAdd: [finalEdge],
      },
      'finishLinking'
    );
    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });

  it('should create final edge using node position when no port specified', async () => {
    const temporaryEdgeWithoutPort = {
      ...mockTemporaryEdge,
      target: 'target-node',
      targetPort: '',
    };
    const finalEdge = { id: 'final-edge', source: 'source-node', target: 'target-node', data: {} };

    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: temporaryEdgeWithoutPort,
    };
    mockValidateConnection.mockReturnValue(true);
    mockFlowCore.getNodeById.mockReturnValue(mockTargetNode);
    mockCreateFinalEdge.mockReturnValue(finalEdge);

    await finishLinking(mockCommandHandler, { name: 'finishLinking', position: { x: 0, y: 0 } });

    expect(mockCreateFinalEdge).toHaveBeenCalledWith(mockFlowCore.config, temporaryEdgeWithoutPort, {
      target: 'target-node',
      targetPort: undefined,
      targetPosition: mockTargetNode.position,
    });

    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith(
      {
        edgesToAdd: [finalEdge],
      },
      'finishLinking'
    );
    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });

  it('should not clear a new linking gesture that replaced the state while finishLinking was suspended', async () => {
    const ownGesture: InternalLinkingActionState = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: null,
      _gestureId: 1,
    };
    const newGesture: InternalLinkingActionState = {
      sourceNodeId: 'other-node',
      sourcePortId: 'other-port',
      temporaryEdge: null,
      _gestureId: 2,
    };
    mockFlowCore.actionStateManager.linking = ownGesture;
    // A programmatic startLinking issued while this command awaits its pass.
    mockFlowCore.applyUpdate.mockImplementation(async () => {
      mockFlowCore.actionStateManager.linking = newGesture;
    });

    await finishLinking(mockCommandHandler, { name: 'finishLinking', position: { x: 0, y: 0 } });

    expect(mockFlowCore.actionStateManager.clearLinking).not.toHaveBeenCalled();
    expect(mockFlowCore.actionStateManager.linking).toBe(newGesture);
  });

  it('should clear its own gesture when the state was replaced by a same-gesture copy mid-update', async () => {
    const ownGesture: InternalLinkingActionState = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
      _gestureId: 7,
    };
    mockFlowCore.actionStateManager.linking = ownGesture;
    mockValidateConnection.mockReturnValue(true);
    mockFlowCore.getNodeById.mockReturnValue(mockTargetNode);
    mockGetPortFlowPosition.mockReturnValue({ x: 150, y: 250 });
    mockCreateFinalEdge.mockReturnValue({ id: 'final-edge', source: 'source-node', target: 'target-node', data: {} });
    // The edges-routing middleware replaces the linking object with a spread
    // copy during this command's own pass — the stamp survives the copy.
    mockFlowCore.applyUpdate.mockImplementation(async () => {
      mockFlowCore.actionStateManager.linking = {
        ...(mockFlowCore.actionStateManager.linking as InternalLinkingActionState),
        temporaryEdge: { ...mockTemporaryEdge, points: [{ x: 1, y: 1 }] },
      };
    });

    await finishLinking(mockCommandHandler, { name: 'finishLinking', position: { x: 0, y: 0 } });

    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });
});
