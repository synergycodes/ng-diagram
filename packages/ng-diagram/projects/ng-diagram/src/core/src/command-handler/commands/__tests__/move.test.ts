import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import type { Node } from '../../../types';
import { CommandHandler } from '../../command-handler';
import { moveNodesBy } from '../move';

const MOVEMENT_STEP = 10;

describe('Move Selection Commands', () => {
  let flowCore: FlowCore;
  let commandHandler: CommandHandler;

  beforeEach(() => {
    flowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
      modelLookup: {
        getSelectedNodesWithChildren: vi.fn().mockReturnValue([{ id: '1', position: { x: 0, y: 0 }, selected: true }]),
        getAllDescendants: vi.fn().mockReturnValue([]),
      },
      config: {
        snapping: {
          shouldSnapDragForNode: vi.fn().mockReturnValue(false),
          shouldSnapResizeForNode: vi.fn().mockReturnValue(false),
          computeSnapForNodeDrag: vi.fn().mockReturnValue(null),
          computeSnapForNodeSize: vi.fn().mockReturnValue(null),
          defaultDragSnap: { width: 1, height: 1 },
          defaultResizeSnap: { width: 1, height: 1 },
        },
      },
    } as unknown as FlowCore;
    commandHandler = new CommandHandler(flowCore);
  });

  describe('basic movement', () => {
    it('should move selected nodes by the specified amount', () => {
      const mockNode = {
        id: '1',
        position: { x: 0, y: 0 },
        selected: true,
        data: {},
        type: 'node',
      };

      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        nodes: [mockNode],
      });

      moveNodesBy(commandHandler, {
        name: 'moveNodesBy',
        delta: { x: MOVEMENT_STEP, y: MOVEMENT_STEP },
        nodes: [mockNode],
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: mockNode.id,
              position: { x: MOVEMENT_STEP, y: MOVEMENT_STEP },
            },
          ],
        },
        'moveNodesBy'
      );
    });

    it('should not apply update if no nodes are selected', () => {
      const mockNode = {
        id: '1',
        position: { x: 0, y: 0 },
        selected: false,
        data: {},
        type: 'node',
      };

      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        nodes: [mockNode],
      });

      (flowCore.modelLookup.getSelectedNodesWithChildren as ReturnType<typeof vi.fn>).mockReturnValue([]);

      moveNodesBy(commandHandler, {
        name: 'moveNodesBy',
        delta: { x: MOVEMENT_STEP, y: MOVEMENT_STEP },
        nodes: [],
      });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should move multiple independent nodes', () => {
      const mockNodes = [
        { id: '1', position: { x: 0, y: 0 }, selected: true, data: {}, type: 'node' },
        { id: '2', position: { x: 50, y: 50 }, selected: true, data: {}, type: 'node' },
      ];

      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        nodes: mockNodes,
      });

      moveNodesBy(commandHandler, {
        name: 'moveNodesBy',
        delta: { x: 10, y: 10 },
        nodes: mockNodes,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            { id: '1', position: { x: 10, y: 10 } },
            { id: '2', position: { x: 60, y: 60 } },
          ],
        },
        'moveNodesBy'
      );
    });
  });

  describe('snapping behavior', () => {
    it('should apply snapping to root nodes', () => {
      const shouldSnapMock = vi.fn().mockReturnValue(true);
      flowCore.config.snapping.shouldSnapDragForNode = shouldSnapMock;
      flowCore.config.snapping.computeSnapForNodeDrag = vi.fn().mockReturnValue({ width: 10, height: 10 });

      const mockNode = {
        id: '1',
        position: { x: 0, y: 0 },
        selected: true,
        data: {},
        type: 'node',
      };

      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        nodes: [mockNode],
      });

      moveNodesBy(commandHandler, {
        name: 'moveNodesBy',
        delta: { x: 15, y: 25 }, // Should snap to (20, 30) with grid of 10
        nodes: [mockNode],
      });

      expect(shouldSnapMock).toHaveBeenCalled();
      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [{ id: '1', position: { x: 20, y: 30 } }],
        },
        'moveNodesBy'
      );
    });

    it('should use custom snap from computeSnapForNodeDrag', () => {
      flowCore.config.snapping.shouldSnapDragForNode = vi.fn().mockReturnValue(true);
      flowCore.config.snapping.computeSnapForNodeDrag = vi.fn().mockReturnValue({ width: 5, height: 5 });

      const mockNode = {
        id: '1',
        position: { x: 0, y: 0 },
        selected: true,
        data: {},
        type: 'node',
      };

      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        nodes: [mockNode],
      });

      moveNodesBy(commandHandler, {
        name: 'moveNodesBy',
        delta: { x: 12, y: 13 }, // Should snap to (10, 15) with grid of 5
        nodes: [mockNode],
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [{ id: '1', position: { x: 10, y: 15 } }],
        },
        'moveNodesBy'
      );
    });
  });

  describe('parent-child movement with snapping', () => {
    it("should move children with parent using parent's snapped delta", () => {
      flowCore.config.snapping.shouldSnapDragForNode = vi.fn().mockImplementation((node: Node) => node.id === 'parent');
      flowCore.config.snapping.computeSnapForNodeDrag = vi.fn().mockReturnValue({ width: 10, height: 10 });

      const parent = {
        id: 'parent',
        position: { x: 0, y: 0 },
        selected: true,
        data: {},
        type: 'node',
      };

      const child = {
        id: 'child',
        position: { x: 30, y: 30 },
        selected: true,
        data: {},
        type: 'node',
        groupId: 'parent',
      };

      flowCore.modelLookup.getAllDescendants = vi.fn().mockReturnValue([child]);

      moveNodesBy(commandHandler, {
        name: 'moveNodesBy',
        delta: { x: 15, y: 15 }, // Parent snaps to (20, 20), child should also move by (20, 20)
        nodes: [parent, child],
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            { id: 'parent', position: { x: 20, y: 20 } }, // Snapped
            { id: 'child', position: { x: 50, y: 50 } }, // Moved by parent's actual delta (20, 20)
          ],
        },
        'moveNodesBy'
      );
    });

    it('should maintain relative positions when parent is snapped', () => {
      flowCore.config.snapping.shouldSnapDragForNode = vi.fn().mockImplementation((node: Node) => node.id === 'parent');
      flowCore.config.snapping.computeSnapForNodeDrag = vi.fn().mockReturnValue({ width: 10, height: 10 });

      const parent = {
        id: 'parent',
        position: { x: 0, y: 0 },
        selected: true,
        data: {},
        type: 'node',
      };

      const child1 = {
        id: 'child1',
        position: { x: 10, y: 5 },
        selected: true,
        data: {},
        type: 'node',
        groupId: 'parent',
      };

      const child2 = {
        id: 'child2',
        position: { x: 20, y: 15 },
        selected: true,
        data: {},
        type: 'node',
        groupId: 'parent',
      };

      flowCore.modelLookup.getAllDescendants = vi.fn().mockReturnValue([child1, child2]);

      moveNodesBy(commandHandler, {
        name: 'moveNodesBy',
        delta: { x: 7, y: 8 }, // Parent snaps to (10, 10), actual delta is (10, 10)
        nodes: [parent, child1, child2],
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            { id: 'parent', position: { x: 10, y: 10 } },
            { id: 'child1', position: { x: 20, y: 15 } }, // Moved by (10, 10)
            { id: 'child2', position: { x: 30, y: 25 } }, // Moved by (10, 10)
          ],
        },
        'moveNodesBy'
      );
    });

    it('should not apply snapping to children independently', () => {
      // Only parent has snapping enabled
      flowCore.config.snapping.shouldSnapDragForNode = vi.fn().mockImplementation((node: Node) => node.id === 'parent');
      flowCore.config.snapping.computeSnapForNodeDrag = vi.fn().mockReturnValue({ width: 10, height: 10 });

      const parent = {
        id: 'parent',
        position: { x: 0, y: 0 },
        selected: true,
        data: {},
        type: 'node',
      };

      const child = {
        id: 'child',
        position: { x: 7, y: 8 },
        selected: true,
        data: {},
        type: 'node',
        groupId: 'parent',
      };

      flowCore.modelLookup.getAllDescendants = vi.fn().mockReturnValue([child]);

      moveNodesBy(commandHandler, {
        name: 'moveNodesBy',
        delta: { x: 7, y: 8 }, // Parent snaps to (10, 10)
        nodes: [parent, child],
      });

      // Child should move by parent's delta (10, 10), not snap independently
      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            { id: 'parent', position: { x: 10, y: 10 } },
            { id: 'child', position: { x: 17, y: 18 } }, // 7 + 10, 8 + 10 (no snapping)
          ],
        },
        'moveNodesBy'
      );
    });
  });

  describe('nested groups', () => {
    it('should handle nested groups correctly', () => {
      flowCore.config.snapping.shouldSnapDragForNode = vi
        .fn()
        .mockImplementation((node: Node) => node.id === 'grandparent');
      flowCore.config.snapping.computeSnapForNodeDrag = vi.fn().mockReturnValue({ width: 10, height: 10 });

      const grandparent = {
        id: 'grandparent',
        position: { x: 0, y: 0 },
        selected: true,
        data: {},
        type: 'node',
      };

      const parent = {
        id: 'parent',
        position: { x: 20, y: 20 },
        selected: true,
        data: {},
        type: 'node',
        groupId: 'grandparent',
      };

      const child = {
        id: 'child',
        position: { x: 40, y: 40 },
        selected: true,
        data: {},
        type: 'node',
        groupId: 'parent',
      };

      flowCore.modelLookup.getAllDescendants = vi.fn().mockReturnValue([parent, child]);

      moveNodesBy(commandHandler, {
        name: 'moveNodesBy',
        delta: { x: 15, y: 15 }, // Grandparent snaps to (20, 20)
        nodes: [grandparent, parent, child],
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            { id: 'grandparent', position: { x: 20, y: 20 } }, // Snapped
            { id: 'parent', position: { x: 40, y: 40 } }, // Moved by (20, 20)
            { id: 'child', position: { x: 60, y: 60 } }, // Moved by (20, 20)
          ],
        },
        'moveNodesBy'
      );
    });

    it('should handle multiple independent hierarchies', () => {
      flowCore.config.snapping.shouldSnapDragForNode = vi.fn().mockImplementation((node: Node) => node.id === 'root1');
      flowCore.config.snapping.computeSnapForNodeDrag = vi.fn().mockReturnValue({ width: 10, height: 10 });

      const root1 = { id: 'root1', position: { x: 0, y: 0 }, selected: true, data: {}, type: 'node' };
      const child1 = {
        id: 'child1',
        position: { x: 10, y: 10 },
        selected: true,
        data: {},
        type: 'node',
        groupId: 'root1',
      };
      const root2 = { id: 'root2', position: { x: 100, y: 100 }, selected: true, data: {}, type: 'node' };
      const child2 = {
        id: 'child2',
        position: { x: 110, y: 110 },
        selected: true,
        data: {},
        type: 'node',
        groupId: 'root2',
      };

      flowCore.modelLookup.getAllDescendants = vi.fn().mockImplementation((nodeId: string) => {
        if (nodeId === 'root1') return [child1];
        if (nodeId === 'root2') return [child2];
        return [];
      });

      moveNodesBy(commandHandler, {
        name: 'moveNodesBy',
        delta: { x: 15, y: 15 },
        nodes: [root1, child1, root2, child2],
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            { id: 'root1', position: { x: 20, y: 20 } }, // Snapped
            { id: 'child1', position: { x: 30, y: 30 } }, // Moved by root1's delta (20, 20)
            { id: 'root2', position: { x: 115, y: 115 } }, // No snapping
            { id: 'child2', position: { x: 125, y: 125 } }, // Moved by root2's delta (15, 15)
          ],
        },
        'moveNodesBy'
      );
    });
  });

  describe('edge cases', () => {
    it('should not process descendants that are not in the moved nodes list', () => {
      const parent = { id: 'parent', position: { x: 0, y: 0 }, selected: true, data: {}, type: 'node' };
      const child1 = {
        id: 'child1',
        position: { x: 10, y: 10 },
        selected: true,
        data: {},
        type: 'node',
        groupId: 'parent',
      };
      const child2 = {
        id: 'child2',
        position: { x: 20, y: 20 },
        selected: false,
        data: {},
        type: 'node',
        groupId: 'parent',
      };

      flowCore.modelLookup.getAllDescendants = vi.fn().mockReturnValue([child1, child2]);

      moveNodesBy(commandHandler, {
        name: 'moveNodesBy',
        delta: { x: 10, y: 10 },
        nodes: [parent, child1], // child2 is NOT in the moved nodes
      });

      const updateCall = (flowCore.applyUpdate as ReturnType<typeof vi.fn>).mock.calls[0][0];
      const nodeIds = updateCall.nodesToUpdate.map((n: Node) => n.id);

      expect(nodeIds).toEqual(['parent', 'child1']);
      expect(nodeIds).not.toContain('child2');
    });

    it('should avoid duplicate processing of descendants', () => {
      const parent = { id: 'parent', position: { x: 0, y: 0 }, selected: true, data: {}, type: 'node' };
      const child = {
        id: 'child',
        position: { x: 10, y: 10 },
        selected: true,
        data: {},
        type: 'node',
        groupId: 'parent',
      };

      flowCore.modelLookup.getAllDescendants = vi.fn().mockReturnValue([child]);

      moveNodesBy(commandHandler, {
        name: 'moveNodesBy',
        delta: { x: 5, y: 5 },
        nodes: [parent, child],
      });

      const updateCall = (flowCore.applyUpdate as ReturnType<typeof vi.fn>).mock.calls[0][0];
      const childUpdates = updateCall.nodesToUpdate.filter((n: Node) => n.id === 'child');

      expect(childUpdates).toHaveLength(1);
    });
  });
});
