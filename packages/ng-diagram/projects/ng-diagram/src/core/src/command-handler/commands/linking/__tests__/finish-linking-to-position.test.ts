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
    getNodeById: ReturnType<typeof vi.fn>;
    applyUpdate: ReturnType<typeof vi.fn>;
    config: { danglingEdges?: { enabled: boolean; shouldKeepOnDrop?: ReturnType<typeof vi.fn> } };
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
      // A drop to a position keeps a dangling edge, so the feature is on and
      // the source node is visible unless a test says otherwise.
      getNodeById: vi.fn().mockReturnValue({ id: 'source-node', position: { x: 0, y: 0 }, data: {} }),
      applyUpdate: vi.fn().mockResolvedValue(undefined),
      config: { danglingEdges: { enabled: true } },
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
      targetPort: undefined,
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

  it('should return immediately when a relink owns the linking state', async () => {
    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
      relink: {
        edgeId: 'edge-1',
        end: 'target',
        originalEdge: { id: 'edge-1', source: 'source-node', target: 'other-node', data: {} },
      },
    };

    await finishLinkingToPosition(mockCommandHandler, {
      name: 'finishLinkingToPosition',
      position: { x: 1, y: 2 },
    });

    // finishRelinking is the only legal finish for a relink — committing here
    // would ADD a new edge instead of updating the relinked one.
    expect(mockCreateFinalEdge).not.toHaveBeenCalled();
    expect(mockFlowCore.applyUpdate).not.toHaveBeenCalled();
    expect(mockFlowCore.actionStateManager.clearLinking).not.toHaveBeenCalled();
  });

  it('should return immediately when a teardown is already in progress', async () => {
    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
      _finishing: true,
    } as InternalLinkingActionState;

    await finishLinkingToPosition(mockCommandHandler, {
      name: 'finishLinkingToPosition',
      position: { x: 1, y: 2 },
    });

    expect(mockFlowCore.applyUpdate).not.toHaveBeenCalled();
  });

  it('should always create edge with empty target and undefined targetPort', async () => {
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

    // A free end always has an empty target and an undefined port (never '').
    const createFinalEdgeCall = mockCreateFinalEdge.mock.calls[0][2];
    expect(createFinalEdgeCall.target).toBe('');
    expect(createFinalEdgeCall.targetPort).toBeUndefined();
    expect(createFinalEdgeCall.targetPosition).toEqual(position);
  });

  it('should keep a connected source port untouched', async () => {
    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
    };
    mockCreateFinalEdge.mockReturnValue({ id: 'final-edge', source: 'source-node', target: '', data: {} });

    await finishLinkingToPosition(mockCommandHandler, {
      name: 'finishLinkingToPosition',
      position: { x: 300, y: 400 },
    });

    // The partial must not mention sourcePort, so the temporary edge's real
    // port survives the spread in createFinalEdge.
    expect(mockCreateFinalEdge.mock.calls[0][2]).not.toHaveProperty('sourcePort');
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

  it('should claim the teardown so a racing cancel no-ops', async () => {
    const linking: InternalLinkingActionState = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
    };
    mockFlowCore.actionStateManager.linking = linking;
    mockCreateFinalEdge.mockReturnValue({ id: 'final-edge', source: 'source-node', target: '', data: {} });

    await finishLinkingToPosition(mockCommandHandler, { name: 'finishLinkingToPosition', position: { x: 1, y: 2 } });

    // clearLinkingForGesture replaces the manager's slot, not this object.
    expect(linking._finishing).toBe(true);
  });

  it('should cancel with noTarget when dangling edges are off', async () => {
    mockFlowCore.config.danglingEdges = { enabled: false };
    const linking: InternalLinkingActionState = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
    };
    mockFlowCore.actionStateManager.linking = linking;

    await finishLinkingToPosition(mockCommandHandler, { name: 'finishLinkingToPosition', position: { x: 1, y: 2 } });

    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishLinking');
    expect(mockFlowCore.applyUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({ edgesToAdd: expect.anything() }),
      'finishLinking'
    );
    expect(linking.cancelReason).toBe('noTarget');
    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });

  it('should cancel with noTarget when shouldKeepOnDrop declines the edge', async () => {
    const shouldKeepOnDrop = vi.fn().mockReturnValue(false);
    mockFlowCore.config.danglingEdges = { enabled: true, shouldKeepOnDrop };
    const linking: InternalLinkingActionState = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
    };
    mockFlowCore.actionStateManager.linking = linking;
    mockCreateFinalEdge.mockReturnValue({ id: 'final-edge', source: 'source-node', target: '', data: {} });

    await finishLinkingToPosition(mockCommandHandler, { name: 'finishLinkingToPosition', position: { x: 1, y: 2 } });

    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishLinking');
    expect(mockFlowCore.applyUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({ edgesToAdd: expect.anything() }),
      'finishLinking'
    );
    expect(linking.cancelReason).toBe('noTarget');
    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });

  it('should pass the built final edge and the drop position to shouldKeepOnDrop', async () => {
    const shouldKeepOnDrop = vi.fn().mockReturnValue(true);
    mockFlowCore.config.danglingEdges = { enabled: true, shouldKeepOnDrop };
    const finalEdge = { id: 'final-edge', source: 'source-node', target: '', data: {} };
    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
    };
    mockCreateFinalEdge.mockReturnValue(finalEdge);

    await finishLinkingToPosition(mockCommandHandler, { name: 'finishLinkingToPosition', position: { x: 7, y: 8 } });

    // The callback decides on the edge that would actually be committed.
    expect(shouldKeepOnDrop).toHaveBeenCalledWith(finalEdge, { x: 7, y: 8 });
    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({ edgesToAdd: [finalEdge] }, 'finishLinking');
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
