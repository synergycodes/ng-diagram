import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../../flow-core';
import type { CommandHandler, Edge, LinkingActionState } from '../../../../types';
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
