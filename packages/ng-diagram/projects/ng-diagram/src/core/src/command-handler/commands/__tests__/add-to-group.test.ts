import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockGroupNode, mockNode } from '../../../test-utils';
import type { CommandHandler, Node } from '../../../types';
import { addToGroup, AddToGroupCommand } from '../add-to-group';

describe('addToGroup', () => {
  let mockCommandHandler: CommandHandler;
  let mockModelLookup: {
    getNodeById: ReturnType<typeof vi.fn>;
    wouldCreateCircularDependency: ReturnType<typeof vi.fn>;
  };
  let mockConfig: {
    grouping: {
      canGroup: ReturnType<typeof vi.fn>;
    };
  };
  let mockFlowCore: {
    modelLookup: typeof mockModelLookup;
    config: typeof mockConfig;
    commandHandler: {
      emit: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockModelLookup = {
      getNodeById: vi.fn(),
      wouldCreateCircularDependency: vi.fn(),
    };

    mockConfig = {
      grouping: {
        canGroup: vi.fn(),
      },
    };

    mockFlowCore = {
      modelLookup: mockModelLookup,
      config: mockConfig,
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

      const command: AddToGroupCommand = {
        name: 'addToGroup',
        groupId: 'nonexistent-group',
        nodeIds: ['node1'],
      };

      await addToGroup(mockCommandHandler, command);

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
      // Mock group lookup to return the group
      mockModelLookup.getNodeById.mockImplementation((id: string) => {
        if (id === 'group1') return groupNode;
        if (id === 'node1') return { ...mockNode, id: 'node1' };
        if (id === 'node2') return { ...mockNode, id: 'node2' };
        if (id === 'node3') return { ...mockNode, id: 'node3', groupId: 'group1' };
        return null;
      });
    });

    it('should skip nodes that do not exist', async () => {
      const command: AddToGroupCommand = {
        name: 'addToGroup',
        groupId: 'group1',
        nodeIds: ['node1', 'nonexistent-node'],
      };

      mockModelLookup.wouldCreateCircularDependency.mockReturnValue(false);
      mockConfig.grouping.canGroup.mockReturnValue(true);

      await addToGroup(mockCommandHandler, command);

      expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('updateNodes', {
        nodes: [{ id: 'node1', groupId: 'group1' }],
      });
    });

    it('should skip nodes that would create circular dependency', async () => {
      const command: AddToGroupCommand = {
        name: 'addToGroup',
        groupId: 'group1',
        nodeIds: ['node1', 'node2'],
      };

      mockModelLookup.wouldCreateCircularDependency.mockImplementation((nodeId: string) => {
        return nodeId === 'node1'; // node1 would create circular dependency
      });
      mockConfig.grouping.canGroup.mockReturnValue(true);

      await addToGroup(mockCommandHandler, command);

      expect(mockModelLookup.wouldCreateCircularDependency).toHaveBeenCalledWith('node1', 'group1');
      expect(mockModelLookup.wouldCreateCircularDependency).toHaveBeenCalledWith('node2', 'group1');
      expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('updateNodes', {
        nodes: [{ id: 'node2', groupId: 'group1' }],
      });
    });

    it('should skip nodes that are already in the group', async () => {
      const command: AddToGroupCommand = {
        name: 'addToGroup',
        groupId: 'group1',
        nodeIds: ['node1', 'node3'], // node3 is already in group1
      };

      mockModelLookup.wouldCreateCircularDependency.mockReturnValue(false);
      mockConfig.grouping.canGroup.mockReturnValue(true);

      await addToGroup(mockCommandHandler, command);

      expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('updateNodes', {
        nodes: [{ id: 'node1', groupId: 'group1' }],
      });
    });

    it('should skip nodes that cannot be grouped according to config', async () => {
      const command: AddToGroupCommand = {
        name: 'addToGroup',
        groupId: 'group1',
        nodeIds: ['node1', 'node2'],
      };

      mockModelLookup.wouldCreateCircularDependency.mockReturnValue(false);
      mockConfig.grouping.canGroup.mockImplementation((node: Node) => {
        return node.id !== 'node1'; // node1 cannot be grouped
      });

      await addToGroup(mockCommandHandler, command);

      expect(mockConfig.grouping.canGroup).toHaveBeenCalledWith({ ...mockNode, id: 'node1' }, groupNode);
      expect(mockConfig.grouping.canGroup).toHaveBeenCalledWith({ ...mockNode, id: 'node2' }, groupNode);
      expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('updateNodes', {
        nodes: [{ id: 'node2', groupId: 'group1' }],
      });
    });

    it('should successfully add valid nodes to group', async () => {
      const command: AddToGroupCommand = {
        name: 'addToGroup',
        groupId: 'group1',
        nodeIds: ['node1', 'node2'],
      };

      mockModelLookup.wouldCreateCircularDependency.mockReturnValue(false);
      mockConfig.grouping.canGroup.mockReturnValue(true);

      await addToGroup(mockCommandHandler, command);

      expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('updateNodes', {
        nodes: [
          { id: 'node1', groupId: 'group1' },
          { id: 'node2', groupId: 'group1' },
        ],
      });
    });

    it('should not emit updateNodes when no valid nodes to update', async () => {
      const command: AddToGroupCommand = {
        name: 'addToGroup',
        groupId: 'group1',
        nodeIds: ['node3'], // already in group
      };

      mockModelLookup.wouldCreateCircularDependency.mockReturnValue(false);
      mockConfig.grouping.canGroup.mockReturnValue(true);

      await addToGroup(mockCommandHandler, command);

      expect(mockFlowCore.commandHandler.emit).not.toHaveBeenCalledWith('updateNodes', expect.anything());
    });

    it('should emit highlightGroupClear when nodes are successfully grouped', async () => {
      const command: AddToGroupCommand = {
        name: 'addToGroup',
        groupId: 'group1',
        nodeIds: ['node1'],
      };

      mockModelLookup.wouldCreateCircularDependency.mockReturnValue(false);
      mockConfig.grouping.canGroup.mockReturnValue(true);

      await addToGroup(mockCommandHandler, command);

      expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('updateNodes', {
        nodes: [{ id: 'node1', groupId: 'group1' }],
      });
      expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('highlightGroupClear');
    });

    it('should not emit highlightGroupClear when no nodes are grouped', async () => {
      const command: AddToGroupCommand = {
        name: 'addToGroup',
        groupId: 'group1',
        nodeIds: ['node3'], // already in group
      };

      mockModelLookup.wouldCreateCircularDependency.mockReturnValue(false);
      mockConfig.grouping.canGroup.mockReturnValue(true);

      await addToGroup(mockCommandHandler, command);

      expect(mockFlowCore.commandHandler.emit).not.toHaveBeenCalledWith('highlightGroupClear');
    });

    it('should handle complex scenario with mixed validation results', async () => {
      const command: AddToGroupCommand = {
        name: 'addToGroup',
        groupId: 'group1',
        nodeIds: ['node1', 'node2', 'node3', 'nonexistent-node'],
      };

      // node1: valid
      // node2: would create circular dependency
      // node3: already in group
      // nonexistent-node: doesn't exist
      mockModelLookup.wouldCreateCircularDependency.mockImplementation((nodeId: string) => {
        return nodeId === 'node2';
      });
      mockConfig.grouping.canGroup.mockReturnValue(true);

      await addToGroup(mockCommandHandler, command);

      expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('updateNodes', {
        nodes: [{ id: 'node1', groupId: 'group1' }],
      });
      expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('highlightGroupClear');
    });

    it('should handle empty nodeIds array', async () => {
      const command: AddToGroupCommand = {
        name: 'addToGroup',
        groupId: 'group1',
        nodeIds: [],
      };

      await addToGroup(mockCommandHandler, command);

      expect(mockFlowCore.commandHandler.emit).not.toHaveBeenCalledWith('updateNodes', expect.anything());
      expect(mockFlowCore.commandHandler.emit).not.toHaveBeenCalledWith('highlightGroupClear');
    });
  });
});
