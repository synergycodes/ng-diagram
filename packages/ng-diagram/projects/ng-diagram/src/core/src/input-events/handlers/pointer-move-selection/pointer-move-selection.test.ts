import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FlowCore } from '../../../flow-core';
import { mockEnvironment, mockGroupNode, mockNode } from '../../../test-utils';
import { DraggingActionState, HighlightGroupActionState } from '../../../types';
import { sortNodesByZIndex } from '../../../utils';
import { PointerMoveSelectionEvent } from './pointer-move-selection.event';
import { MOVE_THRESHOLD, PointerMoveSelectionEventHandler } from './pointer-move-selection.handler';

vi.mock('../../../utils', () => ({
  sortNodesByZIndex: vi.fn((nodes) => [...nodes].sort((a, b) => (b.computedZIndex ?? 0) - (a.computedZIndex ?? 0))),
  isGroup: vi.fn((node) => node?.isGroup === true),
}));

function getSamplePointerMoveSelectionEvent(
  overrides: Partial<PointerMoveSelectionEvent> = {}
): PointerMoveSelectionEvent {
  return {
    name: 'pointerMoveSelection',
    phase: 'start',
    lastInputPoint: { x: 100, y: 100 },
    target: mockNode,
    targetType: 'node',
    id: 'test-id',
    timestamp: Date.now(),
    modifiers: {
      primary: false,
      secondary: false,
      shift: false,
      meta: false,
    },
    panningForce: null,
    ...overrides,
  };
}

describe('PointerMoveSelectionEventHandler', () => {
  let handler: PointerMoveSelectionEventHandler;
  let mockFlowCore: FlowCore;
  let mockEmit = vi.fn();
  let mockModelLookup: {
    getSelectedNodes: ReturnType<typeof vi.fn>;
    getSelectedNodesWithChildren: ReturnType<typeof vi.fn>;
    wouldCreateCircularDependency: ReturnType<typeof vi.fn>;
  };
  let mockGetNodesInRange: ReturnType<typeof vi.fn>;
  let mockActionStateManager: {
    dragging: DraggingActionState | undefined;
    highlightGroup: HighlightGroupActionState | undefined;
    clearDragging: ReturnType<typeof vi.fn>;
  };
  let mockGetState: ReturnType<typeof vi.fn>;
  let lastInputPointOverThreshold = { x: 100, y: 100 };
  let lastInputPointBelowThreshold = { x: 100, y: 100 };

  beforeEach(() => {
    vi.clearAllMocks();
    mockEmit = vi.fn();

    mockModelLookup = {
      getSelectedNodes: vi.fn().mockReturnValue([mockNode]),
      getSelectedNodesWithChildren: vi.fn().mockReturnValue([mockNode]),
      wouldCreateCircularDependency: vi.fn().mockReturnValue(false),
    };

    mockGetNodesInRange = vi.fn().mockReturnValue([]);

    mockActionStateManager = {
      dragging: undefined,
      highlightGroup: undefined,
      clearDragging: vi.fn(),
    };

    mockGetState = vi.fn().mockReturnValue({ nodes: [], edges: [] });

    mockFlowCore = {
      getState: mockGetState,
      applyUpdate: vi.fn(),
      commandHandler: { emit: mockEmit },
      environment: mockEnvironment,
      clientToFlowPosition: vi.fn(({ x, y }) => ({ x, y })),
      modelLookup: mockModelLookup,
      getNodesInRange: mockGetNodesInRange,
      actionStateManager: mockActionStateManager,
      transaction: vi.fn().mockImplementation(async (_name, callback) => {
        const txContext = { emit: mockEmit };
        return await callback(txContext);
      }),
      config: {
        selectionMoving: {
          edgePanningForce: 20,
          edgePanningThreshold: 10,
        },
      },
    } as unknown as FlowCore;

    handler = new PointerMoveSelectionEventHandler(mockFlowCore);

    lastInputPointOverThreshold = { x: 100 + MOVE_THRESHOLD + 5, y: 100 + MOVE_THRESHOLD + 5 };
    lastInputPointBelowThreshold = { x: 100 + 1, y: 100 + 1 };
  });

  describe('start phase', () => {
    it('should initialize move state and dragging action state with movementStarted=false', () => {
      const event = getSamplePointerMoveSelectionEvent({
        phase: 'start',
        modifiers: {
          primary: false,
          secondary: false,
          shift: true,
          meta: false,
        },
      });

      handler.handle(event);

      expect(mockActionStateManager.dragging).toMatchObject({
        movementStarted: false,
        modifiers: {
          primary: false,
          secondary: false,
          shift: true,
          meta: false,
        },
      });
      expect(mockActionStateManager.dragging?.accumulatedDeltas).toBeInstanceOf(Map);
    });

    it('should not pan during start phase even with screen edge', () => {
      const event = getSamplePointerMoveSelectionEvent({
        phase: 'start',
        panningForce: { x: 10, y: 5 },
      });

      handler.handle(event);

      expect(mockEmit).not.toHaveBeenCalledWith('moveViewportBy', expect.any(Object));
    });
  });

  describe('continue phase', () => {
    beforeEach(() => {
      // Start the movement
      handler.handle(getSamplePointerMoveSelectionEvent({ phase: 'start' }));
    });

    describe('movement threshold', () => {
      it('should not move nodes until threshold is exceeded', () => {
        // Move just below threshold
        const event = getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: lastInputPointBelowThreshold,
        });

        handler.handle(event);

        expect(mockEmit).not.toHaveBeenCalledWith('moveNodesBy', expect.any(Object));
      });

      it('should start moving nodes once threshold is exceeded', () => {
        // Move beyond threshold
        const event = getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: lastInputPointOverThreshold,
        });

        handler.handle(event);

        expect(mockEmit).toHaveBeenCalledWith('moveNodesBy', {
          delta: { x: MOVE_THRESHOLD + 5, y: MOVE_THRESHOLD + 5 },
          nodes: [mockNode],
        });
      });

      it('should set movementStarted=true once threshold is exceeded', () => {
        // Move beyond threshold
        const event = getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: lastInputPointOverThreshold,
        });

        handler.handle(event);

        expect(mockActionStateManager.dragging).toMatchObject({
          movementStarted: true,
          modifiers: {
            primary: false,
            secondary: false,
            shift: false,
            meta: false,
          },
        });
      });

      it('should keep movementStarted=false when below threshold', () => {
        const event = getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: lastInputPointBelowThreshold,
        });

        handler.handle(event);

        expect(mockActionStateManager.dragging?.movementStarted).toBe(false);
      });

      it('should continue moving after threshold is exceeded with incremental delta', () => {
        // First move beyond threshold
        handler.handle(
          getSamplePointerMoveSelectionEvent({
            phase: 'continue',
            lastInputPoint: lastInputPointOverThreshold,
          })
        );

        mockEmit.mockClear();

        // Subsequent move to the same position - delta should be 0 (incremental)
        handler.handle(
          getSamplePointerMoveSelectionEvent({
            phase: 'continue',
            lastInputPoint: lastInputPointOverThreshold,
          })
        );

        // Since position didn't change, incremental delta is 0
        expect(mockEmit).toHaveBeenCalledWith('moveNodesBy', {
          delta: { x: 0, y: 0 },
          nodes: [mockNode],
        });
      });

      it('should send incremental deltas on subsequent moves', () => {
        // First move beyond threshold
        handler.handle(
          getSamplePointerMoveSelectionEvent({
            phase: 'continue',
            lastInputPoint: lastInputPointOverThreshold,
          })
        );

        mockEmit.mockClear();

        // Move by additional 5px from current position
        const nextPosition = {
          x: lastInputPointOverThreshold.x + 5,
          y: lastInputPointOverThreshold.y + 5,
        };
        handler.handle(
          getSamplePointerMoveSelectionEvent({
            phase: 'continue',
            lastInputPoint: nextPosition,
          })
        );

        // Incremental delta should be just 5, not cumulative from start
        expect(mockEmit).toHaveBeenCalledWith('moveNodesBy', {
          delta: { x: 5, y: 5 },
          nodes: [mockNode],
        });
      });
    });

    describe('modifier updates', () => {
      it('should update dragging modifiers during continue phase', () => {
        const event = getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: lastInputPointOverThreshold,
          modifiers: {
            primary: true,
            secondary: false,
            shift: true,
            meta: true,
          },
        });

        handler.handle(event);
        expect(mockActionStateManager.dragging).not.toBeUndefined();
        expect(mockActionStateManager.dragging!.modifiers).toEqual({
          primary: true,
          secondary: false,
          shift: true,
          meta: true,
        });
      });
    });

    describe('draggable filtering', () => {
      it('should not move node with draggable set to false', async () => {
        const nonDraggableNode = { ...mockNode, draggable: false };
        mockModelLookup.getSelectedNodesWithChildren.mockReturnValue([nonDraggableNode]);

        const event = getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: lastInputPointOverThreshold,
        });

        await handler.handle(event);

        expect(mockEmit).not.toHaveBeenCalledWith('moveNodesBy', expect.any(Object));
      });

      it('should move node without draggable property (defaults to true)', async () => {
        // mockNode has no draggable property set
        const event = getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: lastInputPointOverThreshold,
        });

        await handler.handle(event);

        expect(mockEmit).toHaveBeenCalledWith('moveNodesBy', {
          delta: { x: MOVE_THRESHOLD + 5, y: MOVE_THRESHOLD + 5 },
          nodes: [mockNode],
        });
      });

      it('should only move draggable nodes in mixed selection', async () => {
        const draggableNode = { ...mockNode, id: 'draggable', draggable: true };
        const nonDraggableNode = { ...mockNode, id: 'nonDraggable', draggable: false };
        mockModelLookup.getSelectedNodesWithChildren.mockReturnValue([draggableNode, nonDraggableNode]);

        const event = getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: lastInputPointOverThreshold,
        });

        await handler.handle(event);

        expect(mockEmit).toHaveBeenCalledWith('moveNodesBy', {
          delta: { x: MOVE_THRESHOLD + 5, y: MOVE_THRESHOLD + 5 },
          nodes: [draggableNode],
        });
      });

      it('should filter out non-draggable child in a group', async () => {
        const parentNode = { ...mockNode, id: 'parent', draggable: true };
        const draggableChild = { ...mockNode, id: 'child1', groupId: 'parent', draggable: true };
        const nonDraggableChild = { ...mockNode, id: 'child2', groupId: 'parent', draggable: false };
        mockModelLookup.getSelectedNodesWithChildren.mockReturnValue([parentNode, draggableChild, nonDraggableChild]);

        const event = getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: lastInputPointOverThreshold,
        });

        await handler.handle(event);

        expect(mockEmit).toHaveBeenCalledWith('moveNodesBy', {
          delta: { x: MOVE_THRESHOLD + 5, y: MOVE_THRESHOLD + 5 },
          nodes: [parentNode, draggableChild],
        });
      });
    });

    describe('separate node lists', () => {
      it('should use selectedNodesWithChildren for moving and selectedNodes for highlighting', async () => {
        const childNode = { ...mockNode, id: 'child', groupId: 'parent' };
        const parentNode = { ...mockNode, id: 'parent' };
        const targetGroup = { ...mockGroupNode, id: 'targetGroup', isGroup: true, selected: false };

        mockModelLookup.getSelectedNodesWithChildren.mockReturnValue([parentNode, childNode]);
        mockModelLookup.getSelectedNodes.mockReturnValue([parentNode]);
        mockGetNodesInRange.mockReturnValue([targetGroup]);

        const event = getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: lastInputPointOverThreshold,
        });

        await handler.handle(event);

        // Should move both parent and child
        expect(mockEmit).toHaveBeenCalledWith('moveNodesBy', {
          delta: { x: 10, y: 10 },
          nodes: [parentNode, childNode],
        });

        // Should only highlight based on selected nodes
        expect(mockEmit).toHaveBeenCalledWith('highlightGroup', {
          groupId: 'targetGroup',
          nodes: [parentNode],
        });
      });
    });

    describe('group highlighting during drag', () => {
      beforeEach(() => {
        // Ensure we're past the movement threshold
        handler.handle(
          getSamplePointerMoveSelectionEvent({
            phase: 'continue',
            lastInputPoint: lastInputPointOverThreshold,
          })
        );
        mockEmit.mockClear();
      });

      it('should clear highlight when moving from child group to parent group', async () => {
        const parentGroup = { ...mockGroupNode, id: 'parentGroup', isGroup: true, selected: false };
        const nodeInParentGroup = { ...mockNode, groupId: 'parentGroup' };

        mockGetNodesInRange.mockReturnValue([parentGroup]);
        mockModelLookup.getSelectedNodesWithChildren.mockReturnValue([nodeInParentGroup]);
        mockModelLookup.getSelectedNodes.mockReturnValue([nodeInParentGroup]);
        mockActionStateManager.highlightGroup = { highlightedGroupId: 'childGroup' };

        const event = getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: lastInputPointOverThreshold,
        });

        await handler.handle(event);

        expect(mockEmit).toHaveBeenCalledWith('highlightGroupClear');
      });

      it('should use sortNodesByZIndex to find top group', async () => {
        const group1 = { ...mockGroupNode, id: 'group1', isGroup: true, selected: false, computedZIndex: 1 };
        const group2 = { ...mockGroupNode, id: 'group2', isGroup: true, selected: false, computedZIndex: 2 };

        mockGetNodesInRange.mockReturnValue([group1, group2]);
        mockGetState.mockReturnValue({ nodes: [group1, group2], edges: [] });

        const selectedNode = { ...mockNode, groupId: 'differentGroup' };
        mockModelLookup.getSelectedNodesWithChildren.mockReturnValue([selectedNode]);
        mockModelLookup.getSelectedNodes.mockReturnValue([selectedNode]);

        const event = getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: lastInputPointOverThreshold,
        });

        await handler.handle(event);

        expect(sortNodesByZIndex).toHaveBeenCalledWith([group1, group2], [group1, group2]);
      });

      it('should not emit redundant highlight commands', async () => {
        const targetGroup = { ...mockGroupNode, id: 'targetGroup', isGroup: true, selected: false };
        const selectedNode = { ...mockNode, groupId: 'differentGroup' };

        mockGetNodesInRange.mockReturnValue([targetGroup]);
        mockModelLookup.getSelectedNodesWithChildren.mockReturnValue([selectedNode]);
        mockModelLookup.getSelectedNodes.mockReturnValue([selectedNode]);
        mockActionStateManager.highlightGroup = { highlightedGroupId: 'targetGroup' };

        const event = getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: lastInputPointOverThreshold,
        });

        await handler.handle(event);

        // Should not emit highlightGroup again since it's already highlighted
        expect(mockEmit).not.toHaveBeenCalledWith('highlightGroup', expect.any(Object));
      });
    });

    describe('screen edge panning', () => {
      beforeEach(() => {
        // Ensure we're past the movement threshold
        handler.handle(
          getSamplePointerMoveSelectionEvent({
            phase: 'continue',
            lastInputPoint: lastInputPointOverThreshold,
          })
        );
        mockEmit.mockClear();
      });

      it('should only pan after movement threshold is exceeded', () => {
        // Reset handler
        handler = new PointerMoveSelectionEventHandler(mockFlowCore);
        handler.handle(getSamplePointerMoveSelectionEvent({ phase: 'start' }));

        // Move below threshold with edge
        const event = getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: lastInputPointBelowThreshold,
          panningForce: { x: 8, y: 0 },
        });

        handler.handle(event);

        expect(mockEmit).not.toHaveBeenCalledWith('moveViewportBy', expect.any(Object));
      });

      it('should pan once movement threshold is exceeded', () => {
        const event = getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: lastInputPointOverThreshold,
          panningForce: { x: 12, y: 3 },
        });

        handler.handle(event);

        expect(mockEmit).toHaveBeenCalledWith('moveViewportBy', { x: 12, y: 3 });
      });
    });
  });

  describe('end phase', () => {
    beforeEach(() => {
      // Start the movement
      handler.handle(getSamplePointerMoveSelectionEvent({ phase: 'start' }));
      // Move beyond threshold
      handler.handle(
        getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: lastInputPointOverThreshold,
        })
      );
      mockEmit.mockClear();
    });

    describe('group changes on drop', () => {
      it('should only handle drop if movement exceeded threshold', async () => {
        // Reset handler
        handler = new PointerMoveSelectionEventHandler(mockFlowCore);
        handler.handle(getSamplePointerMoveSelectionEvent({ phase: 'start' }));

        // Move below threshold
        handler.handle(
          getSamplePointerMoveSelectionEvent({
            phase: 'continue',
            lastInputPoint: lastInputPointBelowThreshold,
          })
        );
        mockEmit.mockClear();

        mockGetNodesInRange.mockReturnValue([mockGroupNode]);

        const event = getSamplePointerMoveSelectionEvent({
          phase: 'end',
          lastInputPoint: lastInputPointBelowThreshold,
        });

        await handler.handle(event);

        // Should not add to group since movement didn't exceed threshold
        expect(mockEmit).not.toHaveBeenCalledWith('addToGroup', expect.any(Object));
      });

      it('should add nodes to group when dropping on a valid group', async () => {
        mockGetNodesInRange.mockReturnValue([mockGroupNode]);

        const event = getSamplePointerMoveSelectionEvent({
          phase: 'end',
          lastInputPoint: lastInputPointOverThreshold,
        });

        await handler.handle(event);

        expect(mockEmit).toHaveBeenCalledWith('addToGroup', {
          groupId: 'group1',
          nodeIds: [mockNode.id],
        });
      });

      it('should remove nodes from groups when dropping on empty canvas', async () => {
        const nodeWithGroup = { ...mockNode, id: 'node1', groupId: 'existingGroup' };
        const nodeWithoutGroup = { ...mockNode, id: 'node2', groupId: undefined };

        mockModelLookup.getSelectedNodes.mockReturnValue([nodeWithGroup, nodeWithoutGroup]);
        mockGetNodesInRange.mockReturnValue([]);

        const event = getSamplePointerMoveSelectionEvent({
          phase: 'end',
          lastInputPoint: lastInputPointOverThreshold,
        });

        await handler.handle(event);

        // Should only remove the node that has a group
        expect(mockEmit).toHaveBeenCalledWith('removeFromGroup', {
          groupId: 'existingGroup',
          nodeIds: ['node1'],
        });
        expect(mockEmit).toHaveBeenCalledTimes(1);
      });

      it('should handle nodes with null groupId correctly', async () => {
        const nodeWithNullGroup = { ...mockNode, id: 'node1', groupId: undefined };

        mockModelLookup.getSelectedNodes.mockReturnValue([nodeWithNullGroup]);
        mockGetNodesInRange.mockReturnValue([]);

        const event = getSamplePointerMoveSelectionEvent({
          phase: 'end',
          lastInputPoint: lastInputPointOverThreshold,
        });

        await handler.handle(event);

        // Should not try to remove from group since groupId is null
        expect(mockEmit).not.toHaveBeenCalledWith('removeFromGroup', expect.any(Object));
      });

      it('should handle multiple selected nodes when removing from groups', async () => {
        const node1 = { ...mockNode, id: 'node1', groupId: 'group1' };
        const node2 = { ...mockNode, id: 'node2', groupId: 'group2' };
        const node3 = { ...mockNode, id: 'node3', groupId: 'group1' };

        mockModelLookup.getSelectedNodes.mockReturnValue([node1, node2, node3]);
        mockGetNodesInRange.mockReturnValue([]);

        const event = getSamplePointerMoveSelectionEvent({
          phase: 'end',
          lastInputPoint: lastInputPointOverThreshold,
        });

        await handler.handle(event);

        // Should remove each node from its own group
        expect(mockEmit).toHaveBeenCalledWith('removeFromGroup', {
          groupId: 'group1',
          nodeIds: ['node1'],
        });
        expect(mockEmit).toHaveBeenCalledWith('removeFromGroup', {
          groupId: 'group2',
          nodeIds: ['node2'],
        });
        expect(mockEmit).toHaveBeenCalledWith('removeFromGroup', {
          groupId: 'group1',
          nodeIds: ['node3'],
        });
      });
    });

    describe('state cleanup', () => {
      it('should clear dragging state on end', async () => {
        const event = getSamplePointerMoveSelectionEvent({
          phase: 'end',
          lastInputPoint: lastInputPointOverThreshold,
        });

        await handler.handle(event);

        expect(mockActionStateManager.clearDragging).toHaveBeenCalled();
      });

      it('should reset all internal state after end', async () => {
        const event = getSamplePointerMoveSelectionEvent({
          phase: 'end',
          lastInputPoint: lastInputPointOverThreshold,
        });

        await handler.handle(event);

        // Verify state is reset by trying to continue movement
        const continueEvent = getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: lastInputPointOverThreshold,
        });
        await handler.handle(continueEvent);

        // Should not emit moveNodesBy since movement state was reset
        expect(mockEmit).not.toHaveBeenCalledWith('moveNodesBy', expect.any(Object));
      });
    });

    it('should not pan during end phase even with screen edge', async () => {
      const event = getSamplePointerMoveSelectionEvent({
        phase: 'end',
        panningForce: { x: 7, y: 9 },
      });

      await handler.handle(event);

      expect(mockEmit).not.toHaveBeenCalledWith('moveViewportBy', expect.any(Object));
    });
  });
});
