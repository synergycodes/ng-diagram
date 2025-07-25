import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FlowCore } from '../../../flow-core';
import { mockEnvironment, mockGroupNode, mockNode } from '../../../test-utils';
import { PointerMoveSelectionEvent } from './pointer-move-selection.event';
import { PointerMoveSelectionEventHandler } from './pointer-move-selection.handler';

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

  beforeEach(() => {
    vi.clearAllMocks();
    mockEmit = vi.fn();

    mockModelLookup = {
      getSelectedNodes: vi.fn().mockReturnValue([mockNode]),
      getSelectedNodesWithChildren: vi.fn().mockReturnValue([mockNode]),
      wouldCreateCircularDependency: vi.fn().mockReturnValue(false),
    };

    mockGetNodesInRange = vi.fn().mockReturnValue([]);

    mockFlowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
      commandHandler: { emit: mockEmit },
      environment: mockEnvironment,
      clientToFlowPosition: vi.fn(({ x, y }) => ({ x, y })),
      modelLookup: mockModelLookup,
      getNodesInRange: mockGetNodesInRange,
      transaction: vi.fn().mockImplementation(async (_name, callback) => {
        const txContext = { emit: mockEmit };
        return await callback(txContext);
      }),
    } as unknown as FlowCore;

    handler = new PointerMoveSelectionEventHandler(mockFlowCore);
  });

  describe('start phase', () => {
    it('should initialize move state', () => {
      const event = getSamplePointerMoveSelectionEvent({ phase: 'start' });

      handler.handle(event);

      // Verify internal state is set by testing a continue event
      const continueEvent = getSamplePointerMoveSelectionEvent({
        phase: 'continue',
        lastInputPoint: { x: 110, y: 110 },
      });
      handler.handle(continueEvent);

      expect(mockEmit).toHaveBeenCalledWith('moveNodesBy', {
        delta: { x: 10, y: 10 },
        nodes: [mockNode],
      });
    });
  });

  describe('continue phase', () => {
    beforeEach(() => {
      // Start the movement
      handler.handle(getSamplePointerMoveSelectionEvent({ phase: 'start' }));
    });

    it('should emit moveNodesBy command with correct delta', () => {
      const event = getSamplePointerMoveSelectionEvent({
        phase: 'continue',
        lastInputPoint: { x: 110, y: 110 },
      });

      handler.handle(event);

      expect(mockEmit).toHaveBeenCalledWith('moveNodesBy', {
        delta: { x: 10, y: 10 },
        nodes: [mockNode],
      });
    });

    it('should not emit moveNodesBy when no selected nodes', () => {
      mockModelLookup.getSelectedNodesWithChildren.mockReturnValue([]);

      const event = getSamplePointerMoveSelectionEvent({
        phase: 'continue',
        lastInputPoint: { x: 110, y: 110 },
      });

      handler.handle(event);

      expect(mockEmit).not.toHaveBeenCalled();
    });

    describe('group highlighting during drag', () => {
      it('should highlight group when dragging over a group with nodes from different group', async () => {
        const targetGroup = { ...mockGroupNode, id: 'targetGroup', isGroup: true, selected: false };
        const selectedNode = { ...mockNode, groupId: 'differentGroup' };

        mockGetNodesInRange.mockReturnValue([targetGroup]);
        mockModelLookup.getSelectedNodesWithChildren.mockReturnValue([selectedNode]);

        const event = getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: { x: 110, y: 110 },
        });

        await handler.handle(event);

        expect(mockEmit).toHaveBeenCalledWith('moveNodesBy', {
          delta: { x: 10, y: 10 },
          nodes: [selectedNode],
        });
        expect(mockEmit).toHaveBeenCalledWith('highlightGroup', {
          groupId: 'targetGroup',
          nodes: [selectedNode],
        });
      });

      it('should highlight group when dragging over a group with ungrouped nodes', async () => {
        const targetGroup = { ...mockGroupNode, id: 'targetGroup', isGroup: true, selected: false };
        const ungroupedNode = { ...mockNode, groupId: undefined };

        mockGetNodesInRange.mockReturnValue([targetGroup]);
        mockModelLookup.getSelectedNodesWithChildren.mockReturnValue([ungroupedNode]);

        const event = getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: { x: 110, y: 110 },
        });

        await handler.handle(event);

        expect(mockEmit).toHaveBeenCalledWith('moveNodesBy', {
          delta: { x: 10, y: 10 },
          nodes: [ungroupedNode],
        });
        expect(mockEmit).toHaveBeenCalledWith('highlightGroup', {
          groupId: 'targetGroup',
          nodes: [ungroupedNode],
        });
      });

      it('should not highlight group when all selected nodes already belong to that group', async () => {
        const targetGroup = { ...mockGroupNode, id: 'targetGroup', isGroup: true, selected: false };
        const nodeInSameGroup = { ...mockNode, groupId: 'targetGroup' };

        mockGetNodesInRange.mockReturnValue([targetGroup]);
        mockModelLookup.getSelectedNodesWithChildren.mockReturnValue([nodeInSameGroup]);

        const event = getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: { x: 110, y: 110 },
        });

        await handler.handle(event);

        expect(mockEmit).toHaveBeenCalledWith('moveNodesBy', expect.any(Object));
        expect(mockEmit).not.toHaveBeenCalledWith('highlightGroup', expect.any(Object));
        expect(mockEmit).not.toHaveBeenCalledWith('highlightGroupClear');
      });

      it('should clear group highlight when not dragging over any group', async () => {
        mockGetNodesInRange.mockReturnValue([]);

        const event = getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: { x: 110, y: 110 },
        });

        await handler.handle(event);

        expect(mockEmit).toHaveBeenCalledWith('moveNodesBy', expect.any(Object));
        expect(mockEmit).toHaveBeenCalledWith('highlightGroupClear');
      });

      it('should select top-most group when multiple groups are at the same position', async () => {
        const bottomGroup = { ...mockGroupNode, id: 'bottomGroup', isGroup: true, selected: false, zOrder: 1 };
        const topGroup = { ...mockGroupNode, id: 'topGroup', isGroup: true, selected: false, zOrder: 10 };
        const selectedNode = { ...mockNode, groupId: 'differentGroup' };

        mockGetNodesInRange.mockReturnValue([bottomGroup, topGroup]);
        mockModelLookup.getSelectedNodesWithChildren.mockReturnValue([selectedNode]);

        const event = getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: { x: 110, y: 110 },
        });

        await handler.handle(event);

        expect(mockEmit).toHaveBeenCalledWith('moveNodesBy', {
          delta: { x: 10, y: 10 },
          nodes: [selectedNode],
        });
        expect(mockEmit).toHaveBeenCalledWith('highlightGroup', {
          groupId: 'topGroup',
          nodes: [selectedNode],
        });
      });

      it('should ignore selected groups when finding target group', async () => {
        const selectedGroup = { ...mockGroupNode, id: 'selectedGroup', isGroup: true, selected: true };
        const targetGroup = { ...mockGroupNode, id: 'targetGroup', isGroup: true, selected: false };
        const selectedNode = { ...mockNode, groupId: 'differentGroup' };

        mockGetNodesInRange.mockReturnValue([selectedGroup, targetGroup]);
        mockModelLookup.getSelectedNodesWithChildren.mockReturnValue([selectedNode]);

        const event = getSamplePointerMoveSelectionEvent({
          phase: 'continue',
          lastInputPoint: { x: 110, y: 110 },
        });

        await handler.handle(event);

        expect(mockEmit).toHaveBeenCalledWith('moveNodesBy', {
          delta: { x: 10, y: 10 },
          nodes: [selectedNode],
        });
        expect(mockEmit).toHaveBeenCalledWith('highlightGroup', {
          groupId: 'targetGroup',
          nodes: [selectedNode],
        });
      });
    });
  });

  describe('end phase', () => {
    beforeEach(() => {
      // Start the movement
      handler.handle(getSamplePointerMoveSelectionEvent({ phase: 'start' }));
    });

    it('should group nodes when dropping on a valid group', () => {
      mockGetNodesInRange.mockReturnValue([mockGroupNode]);

      const event = getSamplePointerMoveSelectionEvent({
        phase: 'end',
        lastInputPoint: { x: 110, y: 110 },
      });

      handler.handle(event);

      expect(mockEmit).toHaveBeenCalledWith('addToGroup', {
        groupId: 'group1',
        nodeIds: [mockNode.id],
      });
    });

    it('should not group nodes when dropping outside of groups', () => {
      const nodeWithGroup = { ...mockNode, groupId: 'existingGroup' };
      mockModelLookup.getSelectedNodes.mockReturnValue([nodeWithGroup]);
      mockGetNodesInRange.mockReturnValue([]);

      const event = getSamplePointerMoveSelectionEvent({
        phase: 'end',
        lastInputPoint: { x: 110, y: 110 },
      });

      handler.handle(event);

      expect(mockEmit).not.toHaveBeenCalledWith('addToGroup', expect.any(Object));
    });

    it('should reset move state after end', async () => {
      const event = getSamplePointerMoveSelectionEvent({
        phase: 'end',
        lastInputPoint: { x: 110, y: 110 },
      });

      await handler.handle(event);

      // Verify state is reset by trying to continue movement
      const continueEvent = getSamplePointerMoveSelectionEvent({
        phase: 'continue',
        lastInputPoint: { x: 120, y: 120 },
      });
      await handler.handle(continueEvent);

      // Should not emit moveNodesBy since movement state was reset
      expect(mockEmit).not.toHaveBeenCalledWith('moveNodesBy', {
        delta: { x: 20, y: 20 },
        nodes: [mockNode],
      });
    });
  });
});
