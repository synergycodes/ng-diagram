import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../../flow-core';
import type { CommandHandler, Edge, LinkingActionState } from '../../../../types';
import type { InternalLinkingActionState } from '../../../../types/action-state.interface';
import { cancelLinking } from '../cancel-linking';

describe('cancelLinking', () => {
  let mockCommandHandler: CommandHandler;
  let mockFlowCore: {
    applyUpdate: ReturnType<typeof vi.fn>;
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
    targetPosition: { x: 150, y: 250 },
    data: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockFlowCore = {
      applyUpdate: vi.fn().mockResolvedValue(undefined),
      actionStateManager: {
        linking: null,
        clearLinking: vi.fn(),
      },
    };

    mockCommandHandler = {
      flowCore: mockFlowCore as unknown as FlowCore,
      emit: vi.fn(),
    } as unknown as CommandHandler;
  });

  it('should do nothing when no linking is in progress', async () => {
    await cancelLinking(mockCommandHandler);

    expect(mockFlowCore.applyUpdate).not.toHaveBeenCalled();
    expect(mockFlowCore.actionStateManager.clearLinking).not.toHaveBeenCalled();
  });

  it('should set the cancelled reason and clear the linking state', async () => {
    const linking: LinkingActionState = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
    };
    mockFlowCore.actionStateManager.linking = linking;

    await cancelLinking(mockCommandHandler);

    expect(linking.cancelReason).toBe('cancelled');
    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishLinking');
    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });

  it('should use the temporary edge end as the drop position', async () => {
    const linking: LinkingActionState = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
    };
    mockFlowCore.actionStateManager.linking = linking;

    await cancelLinking(mockCommandHandler);

    expect(linking.dropPosition).toEqual({ x: 150, y: 250 });
  });

  it('should no-op when a finishLinking already owns the teardown', async () => {
    const linking: InternalLinkingActionState = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
      _finishing: true,
    };
    mockFlowCore.actionStateManager.linking = linking;

    await cancelLinking(mockCommandHandler);

    expect(linking.cancelReason).toBeUndefined();
    expect(mockFlowCore.applyUpdate).not.toHaveBeenCalled();
    expect(mockFlowCore.actionStateManager.clearLinking).not.toHaveBeenCalled();
  });

  it('should not clear a linking state that replaced the cancelled one mid-pass', async () => {
    const linking: InternalLinkingActionState = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
      _gestureId: 1,
    };
    mockFlowCore.actionStateManager.linking = linking;
    mockFlowCore.applyUpdate.mockImplementation(async () => {
      // A new linking gesture starts while the cancelled finish pass is suspended
      mockFlowCore.actionStateManager.linking = {
        sourceNodeId: 'other-node',
        sourcePortId: 'other-port',
        temporaryEdge: null,
        _gestureId: 2,
      } as InternalLinkingActionState;
    });

    await cancelLinking(mockCommandHandler);

    expect(mockFlowCore.actionStateManager.clearLinking).not.toHaveBeenCalled();
  });

  describe('during a relink gesture', () => {
    const originalEdge: Edge = {
      id: 'edge-1',
      source: 'source-node',
      sourcePort: 'source-port',
      target: 'target-node',
      targetPort: 'target-port',
      data: {},
    };

    it('should run a finishRelinking pass with the cancelled relink reason', async () => {
      const linking: LinkingActionState = {
        sourceNodeId: 'source-node',
        sourcePortId: 'source-port',
        temporaryEdge: mockTemporaryEdge,
        relink: { edgeId: 'edge-1', end: 'target', originalEdge },
      };
      mockFlowCore.actionStateManager.linking = linking;

      await cancelLinking(mockCommandHandler);

      expect(linking.relinkCancelReason).toBe('cancelled');
      expect(linking.cancelReason).toBeUndefined();
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishRelinking');
      expect(mockFlowCore.applyUpdate).not.toHaveBeenCalledWith({}, 'finishLinking');
      expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
    });

    it('should keep the finishLinking pass for a plain draw gesture', async () => {
      const linking: LinkingActionState = {
        sourceNodeId: 'source-node',
        sourcePortId: 'source-port',
        temporaryEdge: mockTemporaryEdge,
      };
      mockFlowCore.actionStateManager.linking = linking;

      await cancelLinking(mockCommandHandler);

      expect(linking.cancelReason).toBe('cancelled');
      expect(linking.relinkCancelReason).toBeUndefined();
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'finishLinking');
      expect(mockFlowCore.applyUpdate).not.toHaveBeenCalledWith({}, 'finishRelinking');
    });
  });

  it('should fall back to a zero drop position without a temporary edge', async () => {
    const linking: LinkingActionState = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: null,
    };
    mockFlowCore.actionStateManager.linking = linking;

    await cancelLinking(mockCommandHandler);

    expect(linking.dropPosition).toEqual({ x: 0, y: 0 });
    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });
});
