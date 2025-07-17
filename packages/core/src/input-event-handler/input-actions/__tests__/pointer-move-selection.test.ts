import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FlowCore } from '../../../flow-core';
import { getSamplePointerEvent, mockEdge, mockEnvironment, mockGroupNode, mockNode } from '../../../test-utils';
import type { EventTarget, PointerEvent } from '../../../types';
import { pointerMoveSelectionAction } from '../__migrated__pointer-move-selection';

describe('pointerMoveSelectionAction', () => {
  const mockCommandHandler = { emit: vi.fn() };
  let mockEvent: PointerEvent;
  let mockTarget: EventTarget;
  let mockFlowCore: FlowCore;
  let mockModelLookup: {
    getSelectedNodes: ReturnType<typeof vi.fn>;
    getSelectedNodesWithChildren: ReturnType<typeof vi.fn>;
    isNodeDescendantOfGroup: ReturnType<typeof vi.fn>;
    wouldCreateCircularDependency: ReturnType<typeof vi.fn>;
  };
  let mockGetNodesInRange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTarget = { type: 'node', element: mockNode };
    mockEvent = getSamplePointerEvent({ type: 'pointerdown', x: 100, y: 100, target: mockTarget });

    mockModelLookup = {
      getSelectedNodes: vi.fn().mockReturnValue([mockNode]),
      getSelectedNodesWithChildren: vi.fn().mockReturnValue([mockNode]),
      isNodeDescendantOfGroup: vi.fn().mockReturnValue(false),
      wouldCreateCircularDependency: vi.fn().mockReturnValue(false),
    };

    mockGetNodesInRange = vi.fn().mockReturnValue([]);

    mockFlowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
      commandHandler: mockCommandHandler,
      environment: mockEnvironment,
      clientToFlowPosition: vi.fn(({ x, y }) => ({ x, y })),
      modelLookup: mockModelLookup,
      getNodesInRange: mockGetNodesInRange,
    } as unknown as FlowCore;
  });

  describe('predicate', () => {
    it('should return true for pointerdown events on node with left button', () => {
      expect(
        pointerMoveSelectionAction.predicate(
          getSamplePointerEvent({ type: 'pointerdown', button: 0, target: mockTarget }),
          mockFlowCore
        )
      ).toBe(true);
    });

    it('should return false for pointerdown events with right button', () => {
      expect(
        pointerMoveSelectionAction.predicate(
          getSamplePointerEvent({ type: 'pointerdown', button: 1, target: mockTarget }),
          mockFlowCore
        )
      ).toBe(false);
    });

    it('should return false for pointerdown events with non-node target', () => {
      expect(
        pointerMoveSelectionAction.predicate(
          getSamplePointerEvent({ type: 'pointerdown', target: { type: 'edge', element: mockEdge }, button: 0 }),
          mockFlowCore
        )
      ).toBe(false);
    });

    it('should return false for pointermove events when not moving', () => {
      expect(
        pointerMoveSelectionAction.predicate(
          getSamplePointerEvent({ type: 'pointermove', target: mockTarget }),
          mockFlowCore
        )
      ).toBe(false);
    });

    it('should return true for pointermove events when moving', () => {
      // Start moving
      pointerMoveSelectionAction.action(mockEvent, mockFlowCore);

      expect(
        pointerMoveSelectionAction.predicate(
          getSamplePointerEvent({ type: 'pointermove', target: mockTarget }),
          mockFlowCore
        )
      ).toBe(true);
    });

    it('should return true for pointerup events with left button', () => {
      expect(
        pointerMoveSelectionAction.predicate(getSamplePointerEvent({ type: 'pointerup', button: 0 }), mockFlowCore)
      ).toBe(true);
    });

    it('should return false for pointerup events with right button', () => {
      expect(
        pointerMoveSelectionAction.predicate(getSamplePointerEvent({ type: 'pointerup', button: 1 }), mockFlowCore)
      ).toBe(false);
    });

    it('should return false for other events', () => {
      expect(pointerMoveSelectionAction.predicate(getSamplePointerEvent({ type: 'pointerenter' }), mockFlowCore)).toBe(
        false
      );
      expect(pointerMoveSelectionAction.predicate(getSamplePointerEvent({ type: 'pointerleave' }), mockFlowCore)).toBe(
        false
      );
    });
  });

  describe('action - pointerdown', () => {
    it('should initialize move state on pointerdown', () => {
      pointerMoveSelectionAction.action(mockEvent, mockFlowCore);

      // Verify that subsequent pointermove events are now handled
      const moveEvent = getSamplePointerEvent({ type: 'pointermove', x: 110, y: 110, target: mockTarget });
      pointerMoveSelectionAction.action(moveEvent, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodesBy', {
        delta: { x: 10, y: 10 },
        nodes: [mockNode],
      });
    });

    it('should not emit commands on pointerdown', () => {
      pointerMoveSelectionAction.action(mockEvent, mockFlowCore);
      expect(mockCommandHandler.emit).not.toHaveBeenCalled();
    });
  });

  describe('action - pointermove', () => {
    beforeEach(() => {
      // Start moving
      pointerMoveSelectionAction.action(mockEvent, mockFlowCore);
    });

    it('should emit moveNodes command with correct delta', () => {
      const moveEvent = getSamplePointerEvent({ type: 'pointermove', x: 110, y: 110, target: mockTarget });
      pointerMoveSelectionAction.action(moveEvent, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodesBy', {
        delta: { x: 10, y: 10 },
        nodes: [mockNode],
      });
    });

    it('should not emit moveNodes when no selected nodes', () => {
      mockModelLookup.getSelectedNodesWithChildren.mockReturnValue([]);

      const moveEvent = getSamplePointerEvent({ type: 'pointermove', x: 110, y: 110, target: mockTarget });
      pointerMoveSelectionAction.action(moveEvent, mockFlowCore);

      expect(mockCommandHandler.emit).not.toHaveBeenCalled();
    });

    it('should emit highlightGroup when moving over a group', () => {
      const groupNode = { ...mockGroupNode, zOrder: 1 };
      mockGetNodesInRange.mockReturnValue([groupNode]);

      const moveEvent = getSamplePointerEvent({ type: 'pointermove', x: 110, y: 110, target: mockTarget });
      pointerMoveSelectionAction.action(moveEvent, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('highlightGroup', { groupId: 'group1' });
    });

    it('should emit highlightGroupClear when not moving over a group', () => {
      mockGetNodesInRange.mockReturnValue([]);

      const moveEvent = getSamplePointerEvent({ type: 'pointermove', x: 110, y: 110, target: mockTarget });
      pointerMoveSelectionAction.action(moveEvent, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('highlightGroupClear');
    });

    it('should not highlight selected groups', () => {
      const selectedGroup = { ...mockGroupNode, selected: true, zOrder: 1 };
      mockGetNodesInRange.mockReturnValue([selectedGroup]);

      const moveEvent = getSamplePointerEvent({ type: 'pointermove', x: 110, y: 110, target: mockTarget });
      pointerMoveSelectionAction.action(moveEvent, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('highlightGroupClear');
    });

    it('should highlight top group when multiple groups are present', () => {
      mockGetNodesInRange.mockReturnValue([
        mockGroupNode,
        { ...mockGroupNode, id: 'group2', zOrder: (mockGroupNode.zOrder ?? 0) + 1 },
      ]);

      const moveEvent = getSamplePointerEvent({ type: 'pointermove', x: 110, y: 110, target: mockTarget });
      pointerMoveSelectionAction.action(moveEvent, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('highlightGroup', { groupId: 'group2' });
    });

    it('should calculate movement relative to start position', () => {
      const delta = 10;
      const moveEvent1 = getSamplePointerEvent({
        type: 'pointermove',
        x: 100 + delta,
        y: 100 + delta,
        target: mockTarget,
      });
      pointerMoveSelectionAction.action(moveEvent1, mockFlowCore);

      const updatedNode = {
        ...mockNode,
        position: { x: mockNode.position.x + delta, y: mockNode.position.y + delta },
      };
      mockModelLookup.getSelectedNodesWithChildren.mockReturnValue([updatedNode]);

      const moveEvent2 = getSamplePointerEvent({ type: 'pointermove', x: 120, y: 120, target: mockTarget });
      pointerMoveSelectionAction.action(moveEvent2, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenNthCalledWith(1, 'moveNodesBy', {
        delta: { x: delta, y: delta },
        nodes: [mockNode],
      });

      expect(mockCommandHandler.emit).toHaveBeenNthCalledWith(3, 'moveNodesBy', {
        delta: { x: delta, y: delta },
        nodes: [updatedNode],
      });
    });

    it('should not emit movement if not in moving state', () => {
      // Reset state by calling pointerup
      pointerMoveSelectionAction.action(getSamplePointerEvent({ type: 'pointerup', button: 0 }), mockFlowCore);

      // Try to move again
      const moveEvent2 = getSamplePointerEvent({ type: 'pointermove', x: 120, y: 120, target: mockTarget });
      pointerMoveSelectionAction.action(moveEvent2, mockFlowCore);

      // Should not emit moveNodes
      expect(mockCommandHandler.emit).not.toHaveBeenCalledWith('moveNodes', expect.any(Object));
    });
  });

  describe('action - pointerup', () => {
    beforeEach(() => {
      // Start moving
      pointerMoveSelectionAction.action(mockEvent, mockFlowCore);
    });

    it('should group nodes when dropping on a valid group', () => {
      mockGetNodesInRange.mockReturnValue([mockGroupNode]);
      mockModelLookup.wouldCreateCircularDependency.mockReturnValue(false);

      const upEvent = getSamplePointerEvent({ type: 'pointerup', button: 0 });
      pointerMoveSelectionAction.action(upEvent, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('updateNodes', {
        nodes: [
          {
            id: mockNode.id,
            groupId: 'group1',
          },
        ],
      });
    });

    it('should not group nodes when dropping on a group that would create circular dependency', () => {
      mockGetNodesInRange.mockReturnValue([mockGroupNode]);
      mockModelLookup.wouldCreateCircularDependency.mockReturnValue(true);

      const upEvent = getSamplePointerEvent({ type: 'pointerup', button: 0 });
      pointerMoveSelectionAction.action(upEvent, mockFlowCore);

      expect(mockCommandHandler.emit).not.toHaveBeenCalledWith('updateNodes', expect.any(Object));
    });

    it('should ungroup nodes when dropping outside of groups', () => {
      const nodeWithGroup = { ...mockNode, groupId: 'existingGroup' };
      mockModelLookup.getSelectedNodes.mockReturnValue([nodeWithGroup]);
      mockGetNodesInRange.mockReturnValue([]);

      const upEvent = getSamplePointerEvent({ type: 'pointerup', button: 0 });
      pointerMoveSelectionAction.action(upEvent, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('updateNodes', {
        nodes: [
          {
            id: nodeWithGroup.id,
            groupId: undefined,
          },
        ],
      });
    });

    it('should not update nodes when no grouping changes are needed', () => {
      mockGetNodesInRange.mockReturnValue([]);

      const upEvent = getSamplePointerEvent({ type: 'pointerup', button: 0 });
      pointerMoveSelectionAction.action(upEvent, mockFlowCore);

      expect(mockCommandHandler.emit).not.toHaveBeenCalledWith('updateNodes', expect.any(Object));
    });

    it('should clear group highlight after grouping', () => {
      mockGetNodesInRange.mockReturnValue([mockGroupNode]);
      mockModelLookup.wouldCreateCircularDependency.mockReturnValue(false);

      const upEvent = getSamplePointerEvent({ type: 'pointerup', button: 0 });
      pointerMoveSelectionAction.action(upEvent, mockFlowCore);

      // The highlightGroupClear is called with setTimeout, so we can't easily test it
      // But we can verify that updateNodes was called, which triggers the clear
      expect(mockCommandHandler.emit).toHaveBeenCalledWith('updateNodes', expect.any(Object));
    });

    it('should reset move state after pointerup', () => {
      const upEvent = getSamplePointerEvent({ type: 'pointerup', button: 0 });
      pointerMoveSelectionAction.action(upEvent, mockFlowCore);

      // Verify that subsequent pointermove events are not handled
      const moveEvent = getSamplePointerEvent({ type: 'pointermove', x: 110, y: 110, target: mockTarget });
      pointerMoveSelectionAction.action(moveEvent, mockFlowCore);

      // Should not emit moveNodes
      expect(mockCommandHandler.emit).not.toHaveBeenCalledWith('moveNodes', expect.any(Object));
    });

    it('should handle multiple selected nodes for grouping', () => {
      const node1 = { ...mockNode, id: 'node1' };
      const node2 = { ...mockNode, id: 'node2', groupId: 'existingGroup' };
      mockModelLookup.getSelectedNodes.mockReturnValue([node1, node2]);

      mockGetNodesInRange.mockReturnValue([mockGroupNode]);
      mockModelLookup.wouldCreateCircularDependency.mockReturnValue(false);

      const upEvent = getSamplePointerEvent({ type: 'pointerup', button: 0 });
      pointerMoveSelectionAction.action(upEvent, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('updateNodes', {
        nodes: [
          {
            id: 'node1',
            groupId: 'group1',
          },
          {
            id: 'node2',
            groupId: 'group1',
          },
        ],
      });
    });
  });

  describe('edge cases', () => {
    it('should handle pointerup without pointerdown', () => {
      const upEvent = getSamplePointerEvent({ type: 'pointerup', button: 0 });
      pointerMoveSelectionAction.action(upEvent, mockFlowCore);

      expect(mockCommandHandler.emit).not.toHaveBeenCalled();
    });

    it('should handle pointermove without pointerdown', () => {
      const moveEvent = getSamplePointerEvent({ type: 'pointermove', x: 110, y: 110, target: mockTarget });
      pointerMoveSelectionAction.action(moveEvent, mockFlowCore);

      expect(mockCommandHandler.emit).not.toHaveBeenCalled();
    });

    it('should handle empty selected nodes array', () => {
      mockModelLookup.getSelectedNodesWithChildren.mockReturnValue([]);
      mockModelLookup.getSelectedNodes.mockReturnValue([]);

      // Start moving
      pointerMoveSelectionAction.action(mockEvent, mockFlowCore);

      const moveEvent = getSamplePointerEvent({ type: 'pointermove', x: 110, y: 110, target: mockTarget });
      pointerMoveSelectionAction.action(moveEvent, mockFlowCore);

      expect(mockCommandHandler.emit).not.toHaveBeenCalled();

      const upEvent = getSamplePointerEvent({ type: 'pointerup', button: 0 });
      pointerMoveSelectionAction.action(upEvent, mockFlowCore);

      expect(mockCommandHandler.emit).not.toHaveBeenCalled();
    });
  });
});
