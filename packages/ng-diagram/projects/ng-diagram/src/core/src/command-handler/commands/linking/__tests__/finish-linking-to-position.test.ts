import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../../flow-core';
import type { CommandHandler, Edge, LinkingActionState } from '../../../../types';
import type { InternalLinkingActionState } from '../../../../types/action-state.interface';
import { finishLinkingToPosition, FinishLinkingToPositionCommand } from '../finish-linking-to-position';

vi.mock('../utils', () => ({
  createFinalEdge: vi.fn(),
}));

import { createFinalEdge } from '../utils';
const mockCreateFinalEdge = vi.mocked(createFinalEdge);

describe('finishLinkingToPosition', () => {
  let mockCommandHandler: CommandHandler;
  let mockFlowCore: {
    getState: ReturnType<typeof vi.fn>;
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
    target: '',
    targetPort: '',
    data: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockFlowCore = {
      getState: vi.fn(),
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

    const command: FinishLinkingToPositionCommand = {
      name: 'finishLinkingToPosition',
      position: { x: 100, y: 200 },
    };

    await finishLinkingToPosition(mockCommandHandler, command);

    expect(mockFlowCore.applyUpdate).not.toHaveBeenCalled();
  });

  it('should clear linking state when linking exists but temporaryEdge is null', async () => {
    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: null,
    };

    const command: FinishLinkingToPositionCommand = {
      name: 'finishLinkingToPosition',
      position: { x: 100, y: 200 },
    };

    await finishLinkingToPosition(mockCommandHandler, command);

    expect(mockFlowCore.applyUpdate).not.toHaveBeenCalled();
    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });

  it('should create final edge to position when temporary edge exists', async () => {
    const position = { x: 150, y: 250 };
    const finalEdge = {
      id: 'final-edge',
      source: 'source-node',
      target: '',
      data: {},
    };

    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
    };
    mockCreateFinalEdge.mockReturnValue(finalEdge);

    const command: FinishLinkingToPositionCommand = {
      name: 'finishLinkingToPosition',
      position,
    };

    await finishLinkingToPosition(mockCommandHandler, command);

    expect(mockCreateFinalEdge).toHaveBeenCalledWith(mockFlowCore.config, mockTemporaryEdge, {
      target: '',
      targetPort: '',
      targetPosition: position,
    });

    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith(
      {
        edgesToAdd: [finalEdge],
      },
      'finishLinking'
    );
    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });

  it('should set dropPosition on linking state before applyUpdate', async () => {
    const position = { x: 300, y: 400 };
    const finalEdge = { id: 'final-edge', source: 'source-node', target: '', data: {} };

    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
    };
    mockCreateFinalEdge.mockReturnValue(finalEdge);

    const command: FinishLinkingToPositionCommand = {
      name: 'finishLinkingToPosition',
      position,
    };

    await finishLinkingToPosition(mockCommandHandler, command);

    expect(mockFlowCore.actionStateManager.linking!.dropPosition).toEqual(position);
  });

  it('should always create edge with empty target and targetPort', async () => {
    const position = { x: 300, y: 400 };
    const finalEdge = { id: 'final-edge', source: 'source-node', target: '', data: {} };

    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
    };
    mockCreateFinalEdge.mockReturnValue(finalEdge);

    const command: FinishLinkingToPositionCommand = {
      name: 'finishLinkingToPosition',
      position,
    };

    await finishLinkingToPosition(mockCommandHandler, command);

    // Verify that target and targetPort are always empty strings
    const createFinalEdgeCall = mockCreateFinalEdge.mock.calls[0][2];
    expect(createFinalEdgeCall.target).toBe('');
    expect(createFinalEdgeCall.targetPort).toBe('');
    expect(createFinalEdgeCall.targetPosition).toEqual(position);
  });

  it('should clear temporary edge', async () => {
    const position = { x: 500, y: 600 };
    const finalEdge = { id: 'final-edge', source: 'source-node', target: '', data: {} };

    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
    };
    mockCreateFinalEdge.mockReturnValue(finalEdge);

    const command: FinishLinkingToPositionCommand = {
      name: 'finishLinkingToPosition',
      position,
    };

    await finishLinkingToPosition(mockCommandHandler, command);

    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith(
      {
        edgesToAdd: [finalEdge],
      },
      'finishLinking'
    );
    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });

  it('should clear linking when createFinalEdge throws', async () => {
    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
    };
    mockCreateFinalEdge.mockImplementation(() => {
      // finalEdgeDataBuilder / computeEdgeId are user callbacks — they can throw.
      throw new Error('builder exploded');
    });

    await expect(
      finishLinkingToPosition(mockCommandHandler, { name: 'finishLinkingToPosition', position: { x: 1, y: 2 } })
    ).rejects.toThrow('builder exploded');

    // A stranded linking state would permanently block new links.
    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });

  it('should clear linking when the awaited update rejects', async () => {
    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
    };
    mockCreateFinalEdge.mockReturnValue({ id: 'final-edge', source: 'source-node', target: '', data: {} });
    mockFlowCore.applyUpdate.mockRejectedValue(new Error('pass failed'));

    await expect(
      finishLinkingToPosition(mockCommandHandler, { name: 'finishLinkingToPosition', position: { x: 1, y: 2 } })
    ).rejects.toThrow('pass failed');

    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });

  it('should not clear a different gesture that replaced the state while the update was in flight', async () => {
    const ownGesture: InternalLinkingActionState = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
      _gestureId: 1,
    };
    const newGesture: InternalLinkingActionState = {
      sourceNodeId: 'other-node',
      sourcePortId: 'other-port',
      temporaryEdge: null,
      _gestureId: 2,
    };
    mockFlowCore.actionStateManager.linking = ownGesture;
    mockCreateFinalEdge.mockReturnValue({ id: 'final-edge', source: 'source-node', target: '', data: {} });
    mockFlowCore.applyUpdate.mockImplementation(async () => {
      mockFlowCore.actionStateManager.linking = newGesture;
    });

    await finishLinkingToPosition(mockCommandHandler, { name: 'finishLinkingToPosition', position: { x: 1, y: 2 } });

    expect(mockFlowCore.actionStateManager.clearLinking).not.toHaveBeenCalled();
    expect(mockFlowCore.actionStateManager.linking).toBe(newGesture);
  });
});
