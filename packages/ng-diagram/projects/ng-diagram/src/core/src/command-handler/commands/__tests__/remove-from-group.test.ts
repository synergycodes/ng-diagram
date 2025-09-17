import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockGroupNode, mockNode } from '../../../test-utils';
import type { CommandHandler, Node } from '../../../types';
import { removeFromGroup, RemoveFromGroupCommand } from '../remove-from-group';

describe('removeFromGroup', () => {
  let mockCommandHandler: CommandHandler;
  let mockModelLookup: {
    getNodeById: ReturnType<typeof vi.fn>;
  };
  let mockFlowCore: {
    modelLookup: typeof mockModelLookup;
    commandHandler: {
      emit: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockModelLookup = {
      getNodeById: vi.fn(),
    };

    mockFlowCore = {
      modelLookup: mockModelLookup,
      commandHandler: {
        emit: vi.fn(),
      },
    };

    mockCommandHandler = {
      flowCore: mockFlowCore as unknown as FlowCore,
      emit: vi.fn(),
      register: vi.fn(),
    } as unknown as CommandHandler;
  });

  describe('when group does not exist', () => {
    it('should return early and not emit any commands', async () => {
      mockModelLookup.getNodeById.mockReturnValue(null);

      const command: RemoveFromGroupCommand = {
        name: 'removeFromGroup',
        groupId: 'nonexistent-group',
        nodeIds: ['node1'],
      };

      await removeFromGroup(mockCommandHandler, command);

      expect(mockModelLookup.getNodeById).toHaveBeenCalledWith('nonexistent-group');
      expect(mockFlowCore.commandHandler.emit).not.toHaveBeenCalled();
    });
  });

  describe('when group exists', () => {
    const groupNode: Node = {
      ...mockGroupNode,
      id: 'group1',
    };

    beforeEach(() => {
      mockModelLookup.getNodeById.mockImplementation((id: string) => {
        if (id === 'group1') return groupNode;
        if (id === 'node1') return { ...mockNode, id: 'node1', groupId: 'group1' };
        if (id === 'node2') return { ...mockNode, id: 'node2', groupId: 'group1' };
        if (id === 'node3') return { ...mockNode, id: 'node3', groupId: 'group2' };
        if (id === 'node4') return { ...mockNode, id: 'node4' };
        return null;
      });
    });

    it('should skip nodes that do not exist', async () => {
      const command: RemoveFromGroupCommand = {
        name: 'removeFromGroup',
        groupId: 'group1',
        nodeIds: ['node1', 'nonexistent-node'],
      };

      await removeFromGroup(mockCommandHandler, command);

      expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('updateNodes', {
        nodes: [{ id: 'node1', groupId: undefined }],
      });
    });

    it('should remove all nodes that are in the specified group', async () => {
      const command: RemoveFromGroupCommand = {
        name: 'removeFromGroup',
        groupId: 'group1',
        nodeIds: ['node1', 'node2'],
      };

      await removeFromGroup(mockCommandHandler, command);

      expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('updateNodes', {
        nodes: [
          { id: 'node1', groupId: undefined },
          { id: 'node2', groupId: undefined },
        ],
      });
    });

    it('should skip nodes that are not in the specified group', async () => {
      const command: RemoveFromGroupCommand = {
        name: 'removeFromGroup',
        groupId: 'group1',
        nodeIds: ['node1', 'node3'], // node3 is in group2, not group1
      };

      await removeFromGroup(mockCommandHandler, command);

      expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('updateNodes', {
        nodes: [{ id: 'node1', groupId: undefined }],
      });
    });

    it('should skip nodes that have no groupId', async () => {
      const command: RemoveFromGroupCommand = {
        name: 'removeFromGroup',
        groupId: 'group1',
        nodeIds: ['node1', 'node4'], // node4 has no groupId
      };

      await removeFromGroup(mockCommandHandler, command);

      expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('updateNodes', {
        nodes: [{ id: 'node1', groupId: undefined }],
      });
    });

    it('should successfully remove valid nodes from group', async () => {
      const command: RemoveFromGroupCommand = {
        name: 'removeFromGroup',
        groupId: 'group1',
        nodeIds: ['node1', 'node2'],
      };

      await removeFromGroup(mockCommandHandler, command);

      expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('updateNodes', {
        nodes: [
          { id: 'node1', groupId: undefined },
          { id: 'node2', groupId: undefined },
        ],
      });
    });

    it('should not emit any commands when no valid nodes to update', async () => {
      const command: RemoveFromGroupCommand = {
        name: 'removeFromGroup',
        groupId: 'group1',
        nodeIds: ['node3', 'node4'], // node3 is in different group, node4 has no group
      };

      await removeFromGroup(mockCommandHandler, command);

      expect(mockFlowCore.commandHandler.emit).not.toHaveBeenCalled();
    });

    it('should emit updateNodes when nodes are removed', async () => {
      const command: RemoveFromGroupCommand = {
        name: 'removeFromGroup',
        groupId: 'group1',
        nodeIds: ['node1'],
      };

      await removeFromGroup(mockCommandHandler, command);

      expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('updateNodes', {
        nodes: [{ id: 'node1', groupId: undefined }],
      });
    });

    it('should handle complex scenario with mixed node states', async () => {
      const command: RemoveFromGroupCommand = {
        name: 'removeFromGroup',
        groupId: 'group1',
        nodeIds: ['node1', 'node2', 'node3', 'node4', 'nonexistent-node'],
      };

      // node1: valid (in group1)
      // node2: valid (in group1)
      // node3: in different group (group2)
      // node4: has no group
      // nonexistent-node: doesn't exist

      await removeFromGroup(mockCommandHandler, command);

      expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('updateNodes', {
        nodes: [
          { id: 'node1', groupId: undefined },
          { id: 'node2', groupId: undefined },
        ],
      });
    });

    it('should handle empty nodeIds array', async () => {
      const command: RemoveFromGroupCommand = {
        name: 'removeFromGroup',
        groupId: 'group1',
        nodeIds: [],
      };

      await removeFromGroup(mockCommandHandler, command);

      expect(mockFlowCore.commandHandler.emit).not.toHaveBeenCalled();
    });

    it('should handle nodes with undefined groupId correctly', async () => {
      mockModelLookup.getNodeById.mockImplementation((id: string) => {
        if (id === 'group1') return groupNode;
        if (id === 'node-undefined') return { ...mockNode, id: 'node-undefined', groupId: undefined };
        return null;
      });

      const command: RemoveFromGroupCommand = {
        name: 'removeFromGroup',
        groupId: 'group1',
        nodeIds: ['node-undefined'],
      };

      await removeFromGroup(mockCommandHandler, command);

      expect(mockFlowCore.commandHandler.emit).not.toHaveBeenCalled();
    });

    it('should handle nodes with null groupId correctly', async () => {
      mockModelLookup.getNodeById.mockImplementation((id: string) => {
        if (id === 'group1') return groupNode;
        if (id === 'node-null') return { ...mockNode, id: 'node-null', groupId: null };
        return null;
      });

      const command: RemoveFromGroupCommand = {
        name: 'removeFromGroup',
        groupId: 'group1',
        nodeIds: ['node-null'],
      };

      await removeFromGroup(mockCommandHandler, command);

      expect(mockFlowCore.commandHandler.emit).not.toHaveBeenCalled();
    });
  });
});
