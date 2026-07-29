import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FlowCore } from '../../../flow-core';
import { macrotask, mockEnvironment, mockGroupNode, mockNode } from '../../../test-utils';
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
      it('should not move nodes until threshold is exceeded', async () => {
        // Move just below threshold
        const event = getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: lastInputPointBelowThreshold,
        });

        await handler.handle(event);

        expect(mockEmit).not.toHaveBeenCalledWith('moveNodesBy', expect.any(Object));
      });

      it('should start moving nodes once threshold is exceeded', async () => {
        // Move beyond threshold
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

      it('should set movementStarted=true once threshold is exceeded', async () => {
        // Move beyond threshold
        const event = getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: lastInputPointOverThreshold,
        });

        await handler.handle(event);

        expect(mockActionStateManager.dragging).toMatchObject({
          nodeIds: [mockNode.id],
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

      it('should continue moving after threshold is exceeded with incremental delta', async () => {
        // First move beyond threshold
        await handler.handle(
          getSamplePointerMoveSelectionEvent({
            phase: 'continue',
            lastInputPoint: lastInputPointOverThreshold,
          })
        );

        mockEmit.mockClear();

        // Subsequent move to the same position - delta should be 0 (incremental)
        await handler.handle(
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

      it('should send incremental deltas on subsequent moves', async () => {
        // First move beyond threshold
        await handler.handle(
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
        await handler.handle(
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
      it('should update dragging modifiers during continue phase', async () => {
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

        await handler.handle(event);
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
      beforeEach(async () => {
        // Ensure we're past the movement threshold
        await handler.handle(
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
      beforeEach(async () => {
        // Ensure we're past the movement threshold
        await handler.handle(
          getSamplePointerMoveSelectionEvent({
            phase: 'continue',
            lastInputPoint: lastInputPointOverThreshold,
          })
        );
        mockEmit.mockClear();
      });

      it('should only pan after movement threshold is exceeded', async () => {
        // Reset handler
        handler = new PointerMoveSelectionEventHandler(mockFlowCore);
        handler.handle(getSamplePointerMoveSelectionEvent({ phase: 'start' }));

        // Move below threshold with edge
        const event = getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: lastInputPointBelowThreshold,
          panningForce: { x: 8, y: 0 },
        });

        await handler.handle(event);

        expect(mockEmit).not.toHaveBeenCalledWith('moveViewportBy', expect.any(Object));
      });

      it('should pan once movement threshold is exceeded', async () => {
        const event = getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: lastInputPointOverThreshold,
          panningForce: { x: 12, y: 3 },
        });

        await handler.handle(event);

        expect(mockEmit).toHaveBeenCalledWith('moveViewportBy', { x: 12, y: 3 });
      });
    });
  });

  describe('end phase', () => {
    beforeEach(async () => {
      // Start the movement
      handler.handle(getSamplePointerMoveSelectionEvent({ phase: 'start' }));
      // Move beyond threshold
      await handler.handle(
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
        await handler.handle(
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
        expect(mockEmit).not.toHaveBeenCalledWith('removeFromGroup', expect.objectContaining({ nodeIds: ['node2'] }));
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

  describe('re-entrancy under async command emits', () => {
    it('should apply exactly the sum of pointer deltas when moveNodesStart suspends on a macrotask', async () => {
      const applied = { x: 0, y: 0 };
      mockEmit.mockImplementation(async (name: string, payload?: { delta: { x: number; y: number } }) => {
        if (name === 'moveNodesStart') {
          await macrotask();
        }
        if (name === 'moveNodesBy' && payload) {
          applied.x += payload.delta.x;
          applied.y += payload.delta.y;
        }
      });

      handler.handle(getSamplePointerMoveSelectionEvent({ phase: 'start' }));

      // Two continue events fired without awaiting the first — mirrors how the router
      // dispatches pointermove events (handle() is invoked un-awaited).
      const first = handler.handle(
        getSamplePointerMoveSelectionEvent({ phase: 'continue', lastInputPoint: { x: 110, y: 110 } })
      );
      const second = handler.handle(
        getSamplePointerMoveSelectionEvent({ phase: 'continue', lastInputPoint: { x: 120, y: 115 } })
      );
      await Promise.all([first, second]);
      // Drain the fire-and-forget moveNodes transactions
      await macrotask();

      expect(applied).toEqual({ x: 20, y: 15 });
    });

    it('should not apply a move whose moveNodesStart was suspended past the end of the gesture', async () => {
      mockEmit.mockImplementation(async (name: string) => {
        if (name === 'moveNodesStart') {
          await macrotask();
        }
      });

      handler.handle(getSamplePointerMoveSelectionEvent({ phase: 'start' }));

      // Flick: the threshold-crossing continue suspends on moveNodesStart while
      // pointerup's end phase completes the whole gesture.
      const continuePromise = handler.handle(
        getSamplePointerMoveSelectionEvent({ phase: 'continue', lastInputPoint: lastInputPointOverThreshold })
      );
      await handler.handle(
        getSamplePointerMoveSelectionEvent({ phase: 'end', lastInputPoint: lastInputPointOverThreshold })
      );
      await continuePromise;
      await macrotask();

      expect(mockEmit).not.toHaveBeenCalledWith('moveNodesBy', expect.any(Object));
    });

    it('should emit moveNodesStop and clear a stranded highlight when the drop rejects', async () => {
      mockEmit.mockImplementation(async (name: string) => {
        if (name === 'addToGroup') {
          throw new Error('canGroup failed');
        }
      });
      mockGetNodesInRange.mockReturnValue([mockGroupNode]);

      handler.handle(getSamplePointerMoveSelectionEvent({ phase: 'start' }));
      await handler.handle(
        getSamplePointerMoveSelectionEvent({ phase: 'continue', lastInputPoint: lastInputPointOverThreshold })
      );
      mockActionStateManager.highlightGroup = { highlightedGroupId: 'group1' };

      await expect(
        handler.handle(
          getSamplePointerMoveSelectionEvent({ phase: 'end', lastInputPoint: lastInputPointOverThreshold })
        )
      ).rejects.toThrow('canGroup failed');

      // The drag lifecycle must complete and no highlight may survive the gesture
      expect(mockEmit).toHaveBeenCalledWith('moveNodesStop', { nodeIds: expect.any(Array) });
      expect(mockEmit).toHaveBeenCalledWith('highlightGroupClear');
      expect(mockActionStateManager.clearDragging).toHaveBeenCalled();
    });

    it('should clean up gesture state even when the end-phase emits reject', async () => {
      mockEmit.mockImplementation(async (name: string) => {
        if (name === 'moveNodesStop') {
          throw new Error('middleware failed');
        }
      });

      handler.handle(getSamplePointerMoveSelectionEvent({ phase: 'start' }));
      await handler.handle(
        getSamplePointerMoveSelectionEvent({ phase: 'continue', lastInputPoint: lastInputPointOverThreshold })
      );

      await expect(
        handler.handle(
          getSamplePointerMoveSelectionEvent({ phase: 'end', lastInputPoint: lastInputPointOverThreshold })
        )
      ).rejects.toThrow('middleware failed');

      expect(mockActionStateManager.clearDragging).toHaveBeenCalled();
    });

    it('should not clobber a new drag that starts while the previous end phase is suspended', async () => {
      mockEmit.mockImplementation(async (name: string) => {
        if (name === 'moveNodesStop') {
          await macrotask();
        }
      });

      // First drag: start, cross threshold, then release — end suspends on moveNodesStop
      handler.handle(getSamplePointerMoveSelectionEvent({ phase: 'start' }));
      await handler.handle(
        getSamplePointerMoveSelectionEvent({ phase: 'continue', lastInputPoint: lastInputPointOverThreshold })
      );
      const endPromise = handler.handle(
        getSamplePointerMoveSelectionEvent({ phase: 'end', lastInputPoint: lastInputPointOverThreshold })
      );

      // Second drag starts while the previous end is still suspended
      handler.handle(getSamplePointerMoveSelectionEvent({ phase: 'start', lastInputPoint: { x: 200, y: 200 } }));
      await endPromise;

      mockEmit.mockClear();

      // The second gesture must still be alive: crossing the threshold moves nodes
      await handler.handle(
        getSamplePointerMoveSelectionEvent({ phase: 'continue', lastInputPoint: { x: 220, y: 220 } })
      );

      expect(mockEmit).toHaveBeenCalledWith('moveNodesStart', { nodeIds: expect.any(Array) });
      expect(mockEmit).toHaveBeenCalledWith('moveNodesBy', {
        delta: { x: 20, y: 20 },
        nodes: [mockNode],
      });
    });

    it('should not apply a move that resumed while the gesture end was still in flight', async () => {
      let releaseStart: () => void = () => undefined;
      let releaseStop: () => void = () => undefined;
      mockEmit.mockImplementation(async (name: string) => {
        if (name === 'moveNodesStart') {
          await new Promise<void>((resolve) => {
            releaseStart = resolve;
          });
        }
        if (name === 'moveNodesStop') {
          await new Promise<void>((resolve) => {
            releaseStop = resolve;
          });
        }
      });

      handler.handle(getSamplePointerMoveSelectionEvent({ phase: 'start' }));
      const continuePromise = handler.handle(
        getSamplePointerMoveSelectionEvent({ phase: 'continue', lastInputPoint: lastInputPointOverThreshold })
      );
      // pointerup while moveNodesStart is still in flight — end suspends on its
      // own moveNodesStop, so this.gesture is NOT yet nulled.
      const endPromise = handler.handle(
        getSamplePointerMoveSelectionEvent({ phase: 'end', lastInputPoint: lastInputPointOverThreshold })
      );
      await macrotask();

      releaseStart();
      await continuePromise;
      await macrotask();

      // The resumed continue must see the gesture as ended even though the end
      // phase has not finished cleaning up yet.
      expect(mockEmit.mock.calls.some((call) => call[0] === 'moveNodesBy')).toBe(false);

      releaseStop();
      await endPromise;
    });

    it('should not apply a stale move when a new gesture replaced the suspended one without an end', async () => {
      let releaseStart: () => void = () => undefined;
      let firstStart = true;
      mockEmit.mockImplementation(async (name: string) => {
        if (name === 'moveNodesStart' && firstStart) {
          firstStart = false;
          await new Promise<void>((resolve) => {
            releaseStart = resolve;
          });
        }
      });

      handler.handle(getSamplePointerMoveSelectionEvent({ phase: 'start' }));
      const continuePromise = handler.handle(
        getSamplePointerMoveSelectionEvent({ phase: 'continue', lastInputPoint: lastInputPointOverThreshold })
      );
      // A new gesture begins with no end in between (missed pointerup) — only
      // object identity can tell the resumed continue its gesture is stale.
      handler.handle(getSamplePointerMoveSelectionEvent({ phase: 'start', lastInputPoint: { x: 200, y: 200 } }));

      releaseStart();
      await continuePromise;
      await macrotask();

      expect(mockEmit.mock.calls.some((call) => call[0] === 'moveNodesBy')).toBe(false);
    });

    it('should skip the whole cleanup when a new drag replaced the gesture during a suspended end', async () => {
      mockEmit.mockImplementation(async (name: string) => {
        if (name === 'moveNodesStop') {
          await macrotask();
        }
      });

      handler.handle(getSamplePointerMoveSelectionEvent({ phase: 'start' }));
      await handler.handle(
        getSamplePointerMoveSelectionEvent({ phase: 'continue', lastInputPoint: lastInputPointOverThreshold })
      );
      mockActionStateManager.highlightGroup = { highlightedGroupId: 'group1' };
      const endPromise = handler.handle(
        getSamplePointerMoveSelectionEvent({ phase: 'end', lastInputPoint: lastInputPointOverThreshold })
      );

      // Re-drag while the previous end is suspended — its cleanup must not touch
      // the new gesture's state: no clearDragging, no highlight clear.
      handler.handle(getSamplePointerMoveSelectionEvent({ phase: 'start', lastInputPoint: { x: 200, y: 200 } }));
      await endPromise;

      expect(mockActionStateManager.clearDragging).not.toHaveBeenCalled();
      expect(mockEmit.mock.calls.some((call) => call[0] === 'highlightGroupClear')).toBe(false);
    });
  });

  describe('nodeDragStarted and nodeDragEnded events', () => {
    it('should emit moveNodesStart command when threshold is crossed', async () => {
      handler.handle(getSamplePointerMoveSelectionEvent({ phase: 'start' }));

      await handler.handle(
        getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: lastInputPointOverThreshold,
        })
      );

      expect(mockEmit).toHaveBeenCalledWith('moveNodesStart', { nodeIds: expect.any(Array) });
    });

    it('should not emit moveNodesStart command when threshold is not crossed', async () => {
      handler.handle(getSamplePointerMoveSelectionEvent({ phase: 'start' }));

      await handler.handle(
        getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: lastInputPointBelowThreshold,
        })
      );

      expect(mockEmit.mock.calls.some((call) => call[0] === 'moveNodesStart')).toBe(false);
    });

    it('should emit moveNodesStart command only once across multiple continue events', async () => {
      handler.handle(getSamplePointerMoveSelectionEvent({ phase: 'start' }));

      await handler.handle(
        getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: lastInputPointOverThreshold,
        })
      );

      const moveNodesStartCount = mockEmit.mock.calls.filter((call: unknown[]) => call[0] === 'moveNodesStart').length;
      expect(moveNodesStartCount).toBe(1);

      await handler.handle(
        getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: { x: lastInputPointOverThreshold.x + 10, y: lastInputPointOverThreshold.y + 10 },
        })
      );

      const moveNodesStartCountAfter = mockEmit.mock.calls.filter(
        (call: unknown[]) => call[0] === 'moveNodesStart'
      ).length;

      expect(moveNodesStartCountAfter).toBe(1);
    });

    it('should emit moveNodesStop command on end phase after drag', async () => {
      handler.handle(getSamplePointerMoveSelectionEvent({ phase: 'start' }));

      await handler.handle(
        getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: lastInputPointOverThreshold,
        })
      );

      await handler.handle(
        getSamplePointerMoveSelectionEvent({
          phase: 'end',
          lastInputPoint: lastInputPointOverThreshold,
        })
      );

      expect(mockEmit).toHaveBeenCalledWith('moveNodesStop', { nodeIds: expect.any(Array) });
    });

    it('should not emit moveNodesStop command when threshold was not crossed', async () => {
      handler.handle(getSamplePointerMoveSelectionEvent({ phase: 'start' }));

      await handler.handle(
        getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: lastInputPointBelowThreshold,
        })
      );

      await handler.handle(
        getSamplePointerMoveSelectionEvent({
          phase: 'end',
          lastInputPoint: lastInputPointBelowThreshold,
        })
      );

      expect(mockEmit.mock.calls.some((call) => call[0] === 'moveNodesStop')).toBe(false);
    });
  });
});
