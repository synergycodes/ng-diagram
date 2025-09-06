import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../../flow-core';
import { mockNode, mockPort } from '../../../../test-utils';
import type { CommandHandler, LinkingActionState, Node } from '../../../../types';
import { startLinking, StartLinkingCommand } from '../start-linking';

// Mock the utility functions
vi.mock('../../../../utils', () => ({
  getPortFlowPosition: vi.fn(),
}));

vi.mock('../utils', () => ({
  createTemporaryEdge: vi.fn(),
}));

import { getPortFlowPosition } from '../../../../utils';
import { createTemporaryEdge } from '../utils';
const mockGetPortFlowPosition = vi.mocked(getPortFlowPosition);
const mockCreateTemporaryEdge = vi.mocked(createTemporaryEdge);

describe('startLinking', () => {
  let mockCommandHandler: CommandHandler;
  let mockFlowCore: {
    getNodeById: ReturnType<typeof vi.fn>;
    applyUpdate: ReturnType<typeof vi.fn>;
    config: {
      linking: {
        temporaryEdgeDataBuilder: ReturnType<typeof vi.fn>;
      };
    };
    actionStateManager: {
      clearLinking: ReturnType<typeof vi.fn>;
      isLinking: ReturnType<typeof vi.fn>;
      linking: Partial<LinkingActionState>;
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockFlowCore = {
      getNodeById: vi.fn(),
      applyUpdate: vi.fn(),
      config: {
        linking: {
          temporaryEdgeDataBuilder: vi.fn(),
        },
      },
      actionStateManager: {
        linking: {
          temporaryEdge: null,
        },
        clearLinking: vi.fn(),
        isLinking: vi.fn(() => !!mockFlowCore.actionStateManager.linking),
      },
    };

    mockCommandHandler = {
      flowCore: mockFlowCore as unknown as FlowCore,
      emit: vi.fn(),
      register: vi.fn(),
    } as unknown as CommandHandler;
  });

  describe('when source node does not exist', () => {
    it('should return early and not apply any update', async () => {
      mockFlowCore.getNodeById.mockReturnValue(null);

      const command: StartLinkingCommand = {
        name: 'startLinking',
        source: 'nonexistent-node',
      };

      await startLinking(mockCommandHandler, command);

      expect(mockFlowCore.getNodeById).toHaveBeenCalledWith('nonexistent-node');
      expect(mockFlowCore.applyUpdate).not.toHaveBeenCalled();
    });
  });

  describe('when source node exists', () => {
    const sourceNode: Node = {
      ...mockNode,
      id: 'source-node',
      position: { x: 100, y: 200 },
      ports: [
        {
          ...mockPort,
          id: 'source-port',
          type: 'source',
          side: 'right',
        },
        {
          ...mockPort,
          id: 'target-port',
          type: 'target',
          side: 'left',
        },
      ],
    };

    beforeEach(() => {
      mockFlowCore.getNodeById.mockReturnValue(sourceNode);
    });

    describe('when sourcePort is target type', () => {
      it('should return early and not apply any update', async () => {
        const command: StartLinkingCommand = {
          name: 'startLinking',
          source: 'source-node',
          sourcePort: 'target-port',
        };

        await startLinking(mockCommandHandler, command);

        expect(mockFlowCore.getNodeById).toHaveBeenCalledWith('source-node');
        expect(createTemporaryEdge).not.toHaveBeenCalled();
      });
    });

    describe('when getPortFlowPosition returns null', () => {
      it('should return early and not apply any update', async () => {
        mockGetPortFlowPosition.mockReturnValue(null);

        const command: StartLinkingCommand = {
          name: 'startLinking',
          source: 'source-node',
          sourcePort: 'source-port',
        };

        await startLinking(mockCommandHandler, command);

        expect(mockGetPortFlowPosition).toHaveBeenCalledWith(sourceNode, 'source-port');
        expect(createTemporaryEdge).not.toHaveBeenCalled();
      });
    });

    describe('when node position is null/undefined', () => {
      it('should return early when node has no position', async () => {
        const nodeWithoutPosition = { ...sourceNode, position: undefined };
        mockFlowCore.getNodeById.mockReturnValue(nodeWithoutPosition);

        const command: StartLinkingCommand = {
          name: 'startLinking',
          source: 'source-node',
        };

        await startLinking(mockCommandHandler, command);

        expect(createTemporaryEdge).not.toHaveBeenCalled();
      });
    });

    describe('successful linking scenarios', () => {
      it('should successfully start linking with source port', async () => {
        const portPosition = { x: 150, y: 225 };
        const mockTemporaryEdge = {
          id: 'temp-edge',
          source: 'source-node',
          sourcePort: 'source-port',
          target: '',
          data: {},
        };

        mockGetPortFlowPosition.mockReturnValue(portPosition);
        mockCreateTemporaryEdge.mockReturnValue(mockTemporaryEdge);

        const command: StartLinkingCommand = {
          name: 'startLinking',
          source: 'source-node',
          sourcePort: 'source-port',
        };

        await startLinking(mockCommandHandler, command);

        expect(mockFlowCore.getNodeById).toHaveBeenCalledWith('source-node');
        expect(mockGetPortFlowPosition).toHaveBeenCalledWith(sourceNode, 'source-port');
        expect(mockCreateTemporaryEdge).toHaveBeenCalledWith(mockFlowCore.config, {
          source: 'source-node',
          sourcePort: 'source-port',
          sourcePosition: portPosition,
          target: '',
          targetPosition: portPosition,
        });
        expect(mockFlowCore.actionStateManager.linking).toEqual({
          temporaryEdge: mockTemporaryEdge,
          sourceNodeId: 'source-node',
          sourcePortId: 'source-port',
        });
      });

      it('should successfully start linking without source port', async () => {
        const mockTemporaryEdge = {
          id: 'temp-edge',
          source: 'source-node',
          target: '',
          data: {},
        };

        mockCreateTemporaryEdge.mockReturnValue(mockTemporaryEdge);

        const command: StartLinkingCommand = {
          name: 'startLinking',
          source: 'source-node',
        };

        await startLinking(mockCommandHandler, command);

        expect(mockFlowCore.getNodeById).toHaveBeenCalledWith('source-node');
        expect(mockGetPortFlowPosition).not.toHaveBeenCalled();
        expect(mockCreateTemporaryEdge).toHaveBeenCalledWith(mockFlowCore.config, {
          source: 'source-node',
          sourcePort: undefined,
          sourcePosition: sourceNode.position,
          target: '',
          targetPosition: sourceNode.position,
        });
        expect(mockFlowCore.actionStateManager.linking).toEqual({
          temporaryEdge: mockTemporaryEdge,
          sourceNodeId: 'source-node',
          sourcePortId: '',
        });
      });

      it('should handle source port with type "both"', async () => {
        const nodeWithBothPort: Node = {
          ...sourceNode,
          ports: [
            {
              ...mockPort,
              id: 'both-port',
              type: 'both',
              side: 'right',
            },
          ],
        };

        mockFlowCore.getNodeById.mockReturnValue(nodeWithBothPort);

        const portPosition = { x: 150, y: 225 };
        const mockTemporaryEdge = { id: 'temp-edge', source: 'source-node', target: '', data: {} };

        mockGetPortFlowPosition.mockReturnValue(portPosition);
        mockCreateTemporaryEdge.mockReturnValue(mockTemporaryEdge);

        const command: StartLinkingCommand = {
          name: 'startLinking',
          source: 'source-node',
          sourcePort: 'both-port',
        };

        await startLinking(mockCommandHandler, command);

        expect(mockCreateTemporaryEdge).toHaveBeenCalledWith(mockFlowCore.config, {
          source: 'source-node',
          sourcePort: 'both-port',
          sourcePosition: portPosition,
          target: '',
          targetPosition: portPosition,
        });
        expect(mockFlowCore.actionStateManager.linking).toEqual({
          temporaryEdge: mockTemporaryEdge,
          sourceNodeId: 'source-node',
          sourcePortId: 'both-port',
        });
      });

      it('should handle source port with type "source"', async () => {
        const portPosition = { x: 150, y: 225 };
        const mockTemporaryEdge = { id: 'temp-edge', source: 'source-node', target: '', data: {} };

        mockGetPortFlowPosition.mockReturnValue(portPosition);
        mockCreateTemporaryEdge.mockReturnValue(mockTemporaryEdge);

        const command: StartLinkingCommand = {
          name: 'startLinking',
          source: 'source-node',
          sourcePort: 'source-port',
        };

        await startLinking(mockCommandHandler, command);

        expect(mockCreateTemporaryEdge).toHaveBeenCalledWith(mockFlowCore.config, {
          source: 'source-node',
          sourcePort: 'source-port',
          sourcePosition: portPosition,
          target: '',
          targetPosition: portPosition,
        });
        expect(mockFlowCore.actionStateManager.linking).toEqual({
          temporaryEdge: mockTemporaryEdge,
          sourceNodeId: 'source-node',
          sourcePortId: 'source-port',
        });
      });
    });
  });
});
