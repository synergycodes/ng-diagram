import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockEnvironment, mockNode } from '../../../test-utils';
import { KeyboardMoveSelectionEvent } from './keyboard-move-selection.event';
import { KeyboardMoveSelectionEventHandler, UNKNOWN_DIRECTION_ERROR } from './keyboard-move-selection.handler';

function getSampleKeyboardMoveEvent(overrides: Partial<KeyboardMoveSelectionEvent> = {}): KeyboardMoveSelectionEvent {
  return {
    name: 'keyboardMoveSelection',
    id: 'test-id',
    timestamp: Date.now(),
    modifiers: {
      primary: false,
      secondary: false,
      shift: false,
      meta: false,
    },
    direction: 'right',
    ...overrides,
  };
}

describe('KeyboardMoveSelectionEventHandler', () => {
  const mockCommandHandler = { emit: vi.fn() };
  let mockFlowCore: FlowCore;
  let instance: KeyboardMoveSelectionEventHandler;

  beforeEach(() => {
    vi.clearAllMocks();

    mockFlowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
      commandHandler: mockCommandHandler,
      environment: mockEnvironment,
      modelLookup: {
        getSelectedNodesWithChildren: vi.fn().mockReturnValue([mockNode]),
      },
      model: {
        getMetadata: vi.fn().mockReturnValue({
          viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600 },
        }),
      },
      config: {
        snapping: {
          computeSnapForNodeDrag: vi.fn(),
          defaultDragSnap: { width: 10, height: 10 },
        },
        selectionMoving: {
          edgePanningThreshold: 10,
          edgePanningForce: 15,
        },
      },
    } as unknown as FlowCore;

    instance = new KeyboardMoveSelectionEventHandler(mockFlowCore);
  });

  describe('handle', () => {
    it('should emit moveNodesBy command with correct delta for right direction', () => {
      const event = getSampleKeyboardMoveEvent({ direction: 'right' });

      instance.handle(event);

      expect(mockFlowCore.modelLookup.getSelectedNodesWithChildren).toHaveBeenCalledWith({ directOnly: false });
      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodesBy', {
        nodes: [mockNode],
        delta: { x: 10, y: 0 },
      });
    });

    it('should emit moveNodesBy command with correct delta for left direction', () => {
      const event = getSampleKeyboardMoveEvent({ direction: 'left' });

      instance.handle(event);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodesBy', {
        nodes: [mockNode],
        delta: { x: -10, y: 0 },
      });
    });

    it('should emit moveNodesBy command with correct delta for top direction', () => {
      const event = getSampleKeyboardMoveEvent({ direction: 'top' });

      instance.handle(event);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodesBy', {
        nodes: [mockNode],
        delta: { x: 0, y: -10 },
      });
    });

    it('should emit moveNodesBy command with correct delta for bottom direction', () => {
      const event = getSampleKeyboardMoveEvent({ direction: 'bottom' });

      instance.handle(event);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodesBy', {
        nodes: [mockNode],
        delta: { x: 0, y: 10 },
      });
    });

    it('should not trigger edge panning when viewport size is not available', () => {
      const mockGetMetadata = vi.fn().mockReturnValue({
        viewport: { x: 0, y: 0, scale: 1 }, // no width/height
      });
      mockFlowCore.model.getMetadata = mockGetMetadata;

      const event = getSampleKeyboardMoveEvent({ direction: 'right' });

      instance.handle(event);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodesBy', {
        nodes: [mockNode],
        delta: { x: 10, y: 0 },
      });
      expect(mockCommandHandler.emit).not.toHaveBeenCalledWith('moveViewportBy', expect.any(Object));
    });

    describe('edge panning', () => {
      it('should trigger panning to the left when node is near right edge', () => {
        const nodeNearRightEdge = {
          ...mockNode,
          position: { x: 780, y: 100 }, // 780 + 100 (node width) = 880, which is > 800 - 10 = 790
        };

        mockFlowCore.modelLookup.getSelectedNodesWithChildren = vi.fn().mockReturnValue([nodeNearRightEdge]);

        const event = getSampleKeyboardMoveEvent({ direction: 'right' });
        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodesBy', {
          nodes: [nodeNearRightEdge],
          delta: { x: 10, y: 0 },
        });
        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveViewportBy', { x: -10, y: 0 });
      });

      it('should trigger panning to the right when node is near left edge', () => {
        const nodeNearLeftEdge = {
          ...mockNode,
          position: { x: 5, y: 100 }, // 5 <= 0 + 10 = true
        };

        mockFlowCore.modelLookup.getSelectedNodesWithChildren = vi.fn().mockReturnValue([nodeNearLeftEdge]);

        const event = getSampleKeyboardMoveEvent({ direction: 'left' });
        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodesBy', {
          nodes: [nodeNearLeftEdge],
          delta: { x: -10, y: 0 },
        });
        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveViewportBy', { x: 10, y: 0 });
      });

      it('should trigger panning upward when node is near bottom edge', () => {
        const nodeNearBottomEdge = {
          ...mockNode,
          position: { x: 100, y: 580 }, // 580 + 50 (node height) = 630, which is > 600 - 10 = 590
        };

        mockFlowCore.modelLookup.getSelectedNodesWithChildren = vi.fn().mockReturnValue([nodeNearBottomEdge]);

        const event = getSampleKeyboardMoveEvent({ direction: 'bottom' });
        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodesBy', {
          nodes: [nodeNearBottomEdge],
          delta: { x: 0, y: 10 },
        });
        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveViewportBy', { x: 0, y: -10 });
      });

      it('should trigger panning downward when node is near top edge', () => {
        const nodeNearTopEdge = {
          ...mockNode,
          position: { x: 100, y: 5 }, // 5 <= 0 + 10 = true
        };

        mockFlowCore.modelLookup.getSelectedNodesWithChildren = vi.fn().mockReturnValue([nodeNearTopEdge]);

        const event = getSampleKeyboardMoveEvent({ direction: 'top' });
        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodesBy', {
          nodes: [nodeNearTopEdge],
          delta: { x: 0, y: -10 },
        });
        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveViewportBy', { x: 0, y: 10 });
      });

      it('should trigger panning with greater value from edgePanningThreshold or snapping values', () => {
        mockFlowCore.config.snapping.computeSnapForNodeDrag = vi.fn().mockReturnValue({ width: 50, height: 50 });
        mockFlowCore.config.snapping.defaultDragSnap = { width: 30, height: 30 };
        mockFlowCore.config.selectionMoving.edgePanningThreshold = 40;

        const nodeNearRightEdge = {
          ...mockNode,
          position: { x: 760, y: 100 }, // 760 + 100 (node width) = 860, which is > 800 - 40 = 760
        };

        mockFlowCore.modelLookup.getSelectedNodesWithChildren = vi.fn().mockReturnValue([nodeNearRightEdge]);

        const event = getSampleKeyboardMoveEvent({ direction: 'right' });
        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodesBy', {
          nodes: [nodeNearRightEdge],
          delta: { x: 50, y: 0 },
        });
        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveViewportBy', { x: -50, y: 0 });
      });

      it('should trigger panning with edgePanningThreshold value from config being greater than snapping values', () => {
        mockFlowCore.config.snapping.computeSnapForNodeDrag = vi.fn().mockReturnValue({ width: 50, height: 50 });
        mockFlowCore.config.snapping.defaultDragSnap = { width: 30, height: 30 };
        mockFlowCore.config.selectionMoving.edgePanningThreshold = 60;

        const nodeNearRightEdge = {
          ...mockNode,
          position: { x: 760, y: 100 }, // 760 + 100 (node width) = 860, which is > 800 - 60 = 740
        };

        mockFlowCore.modelLookup.getSelectedNodesWithChildren = vi.fn().mockReturnValue([nodeNearRightEdge]);

        const event = getSampleKeyboardMoveEvent({ direction: 'right' });
        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodesBy', {
          nodes: [nodeNearRightEdge],
          delta: { x: 50, y: 0 },
        });
        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveViewportBy', { x: -60, y: 0 });
      });

      it('should not trigger edge panning if node is not near any edge', () => {
        const nodeFarFromEdge = {
          ...mockNode,
          position: { x: 400, y: 300 },
        };

        mockFlowCore.modelLookup.getSelectedNodesWithChildren = vi.fn().mockReturnValue([nodeFarFromEdge]);

        const event = getSampleKeyboardMoveEvent({ direction: 'right' });
        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodesBy', {
          nodes: [nodeFarFromEdge],
          delta: { x: 10, y: 0 },
        });
        expect(mockCommandHandler.emit).not.toHaveBeenCalledWith('moveViewportBy', expect.any(Object));
      });
    });

    it('should not emit command if no nodes are selected', () => {
      (mockFlowCore.modelLookup.getSelectedNodesWithChildren as ReturnType<typeof vi.fn>).mockReturnValue([]);

      const event = getSampleKeyboardMoveEvent({ direction: 'right' });

      instance.handle(event);

      expect(mockCommandHandler.emit).not.toHaveBeenCalled();
    });

    it('should move all nodes in a 3-level nested group', () => {
      const grandparent = {
        id: 'grandparent',
        position: { x: 0, y: 0 },
        selected: true,
        size: { width: 100, height: 50 },
      };

      const parent = {
        id: 'parent',
        position: { x: 10, y: 10 },
        selected: false,
        groupId: 'grandparent',
        size: { width: 80, height: 40 },
      };

      const child = {
        id: 'child',
        position: { x: 20, y: 20 },
        selected: false,
        groupId: 'parent',
        size: { width: 60, height: 30 },
      };

      (mockFlowCore.modelLookup.getSelectedNodesWithChildren as ReturnType<typeof vi.fn>).mockReturnValue([
        grandparent,
        parent,
        child,
      ]);

      const event = getSampleKeyboardMoveEvent({ direction: 'right' });
      instance.handle(event);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodesBy', {
        nodes: [grandparent, parent, child],
        delta: { x: 10, y: 0 },
      });
    });

    // Additional tests

    it('should use computeSnapForNodeDrag if available', () => {
      mockFlowCore.config.snapping.computeSnapForNodeDrag = vi.fn().mockReturnValue({ width: 20, height: 30 });

      const event = getSampleKeyboardMoveEvent({ direction: 'bottom' });
      instance.handle(event);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodesBy', {
        nodes: [mockNode],
        delta: { x: 0, y: 30 },
      });
    });

    it('should use computeSnapForNodeDrag and take precedence over defaultDragSnap.', () => {
      mockFlowCore.config.snapping.computeSnapForNodeDrag = vi.fn().mockReturnValue({ width: 50, height: 50 });
      mockFlowCore.config.snapping.defaultDragSnap = { width: 30, height: 30 };

      const event = getSampleKeyboardMoveEvent({ direction: 'right' });
      instance.handle(event);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodesBy', {
        nodes: [mockNode],
        delta: { x: 50, y: 0 },
      });
    });

    it('should throw error for unknown direction', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const event = getSampleKeyboardMoveEvent({ direction: 'unknown' as any });

      expect(() => instance.handle(event)).toThrowError(UNKNOWN_DIRECTION_ERROR('unknown'));
    });
  });
});
