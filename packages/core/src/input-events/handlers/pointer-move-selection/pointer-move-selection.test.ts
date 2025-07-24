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
        await callback(txContext);
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
  });

  describe('end phase', () => {
    beforeEach(() => {
      // Start the movement
      handler.handle(getSamplePointerMoveSelectionEvent({ phase: 'start' }));
    });

    it('should group nodes when dropping on a valid group', () => {
      mockGetNodesInRange.mockReturnValue([mockGroupNode]);
      mockModelLookup.wouldCreateCircularDependency.mockReturnValue(false);

      const event = getSamplePointerMoveSelectionEvent({
        phase: 'end',
        lastInputPoint: { x: 110, y: 110 },
      });

      handler.handle(event);

      expect(mockEmit).toHaveBeenCalledWith('updateNodes', {
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

      const event = getSamplePointerMoveSelectionEvent({
        phase: 'end',
        lastInputPoint: { x: 110, y: 110 },
      });

      handler.handle(event);

      expect(mockEmit).not.toHaveBeenCalledWith('updateNodes', expect.any(Object));
    });

    it('should ungroup nodes when dropping outside of groups', () => {
      const nodeWithGroup = { ...mockNode, groupId: 'existingGroup' };
      mockModelLookup.getSelectedNodes.mockReturnValue([nodeWithGroup]);
      mockGetNodesInRange.mockReturnValue([]);

      const event = getSamplePointerMoveSelectionEvent({
        phase: 'end',
        lastInputPoint: { x: 110, y: 110 },
      });

      handler.handle(event);

      expect(mockEmit).toHaveBeenCalledWith('updateNodes', {
        nodes: [
          {
            id: nodeWithGroup.id,
            groupId: undefined,
          },
        ],
      });
    });

    it('should clear group highlight after grouping', async () => {
      mockGetNodesInRange.mockReturnValue([mockGroupNode]);
      mockModelLookup.wouldCreateCircularDependency.mockReturnValue(false);

      const event = getSamplePointerMoveSelectionEvent({
        phase: 'end',
        lastInputPoint: { x: 110, y: 110 },
      });

      await handler.handle(event);

      expect(mockEmit).toHaveBeenCalledWith('updateNodes', expect.any(Object));
      expect(mockEmit).toHaveBeenCalledWith('highlightGroupClear');
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
