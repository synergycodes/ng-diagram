import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../../flow-core';
import type { CommandHandler, LinkingActionState } from '../../../../types';
import { startLinkingFromPosition, StartLinkingFromPositionCommand } from '../start-linking-from-position';

vi.mock('../utils', () => ({
  createTemporaryEdge: vi.fn(),
}));

import { createTemporaryEdge } from '../utils';
const mockCreateTemporaryEdge = vi.mocked(createTemporaryEdge);

describe('startLinkingFromPosition', () => {
  let mockCommandHandler: CommandHandler;
  let mockFlowCore: {
    applyUpdate: ReturnType<typeof vi.fn>;
    config: {
      linking: {
        temporaryEdgeDataBuilder: ReturnType<typeof vi.fn>;
      };
    };
    actionStateManager: {
      linking: LinkingActionState | null;
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockFlowCore = {
      applyUpdate: vi.fn().mockResolvedValue(undefined),
      config: {
        linking: {
          temporaryEdgeDataBuilder: vi.fn(),
        },
      },
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

  describe('basic functionality', () => {
    it('should create temporary edge and apply update with correct parameters', async () => {
      const position = { x: 100, y: 200 };
      const mockTemporaryEdge = {
        id: 'temp-edge',
        source: '',
        target: '',
        data: {},
        sourcePosition: position,
        targetPosition: position,
      };

      mockCreateTemporaryEdge.mockReturnValue(mockTemporaryEdge);

      const command: StartLinkingFromPositionCommand = {
        name: 'startLinkingFromPosition',
        position,
      };

      await startLinkingFromPosition(mockCommandHandler, command);

      expect(mockCreateTemporaryEdge).toHaveBeenCalledWith(mockFlowCore.config, {
        source: '',
        sourcePosition: position,
        target: '',
        targetPosition: position,
      });

      expect(mockFlowCore.actionStateManager.linking).toEqual({
        sourceNodeId: '',
        sourcePortId: '',
        temporaryEdge: mockTemporaryEdge,
      });

      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'startLinkingFromPosition');
    });
  });

  describe('temporary edge creation', () => {
    it('should create temporary edge with empty source and target', async () => {
      const position = { x: 200, y: 300 };
      const mockTemporaryEdge = {
        id: 'temp-edge',
        source: '',
        target: '',
        data: {},
      };

      mockCreateTemporaryEdge.mockReturnValue(mockTemporaryEdge);

      const command: StartLinkingFromPositionCommand = {
        name: 'startLinkingFromPosition',
        position,
      };

      await startLinkingFromPosition(mockCommandHandler, command);

      const expectedEdgeData = {
        source: '',
        sourcePosition: position,
        target: '',
        targetPosition: position,
      };

      expect(mockCreateTemporaryEdge).toHaveBeenCalledWith(mockFlowCore.config, expectedEdgeData);

      expect(mockFlowCore.actionStateManager.linking).toEqual({
        sourceNodeId: '',
        sourcePortId: '',
        temporaryEdge: mockTemporaryEdge,
      });
    });

    it('should use same position for both source and target positions', async () => {
      const position = { x: 150, y: 250 };
      const mockTemporaryEdge = {
        id: 'temp-edge',
        source: '',
        target: '',
        data: {},
      };

      mockCreateTemporaryEdge.mockReturnValue(mockTemporaryEdge);

      const command: StartLinkingFromPositionCommand = {
        name: 'startLinkingFromPosition',
        position,
      };

      await startLinkingFromPosition(mockCommandHandler, command);

      expect(mockCreateTemporaryEdge).toHaveBeenCalledWith(mockFlowCore.config, {
        source: '',
        sourcePosition: position,
        target: '',
        targetPosition: position,
      });

      expect(mockFlowCore.actionStateManager.linking).toEqual({
        sourceNodeId: '',
        sourcePortId: '',
        temporaryEdge: mockTemporaryEdge,
      });
    });
  });
});
