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
          shouldSnapDragForNode: vi.fn().mockReturnValue(false),
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
      it('should trigger panning when node will exit viewport on the right after move', () => {
        const nodeNearRightEdge = {
          ...mockNode,
          position: { x: 690, y: 100 },
          size: { width: 100, height: 50 },
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

      it('should trigger panning when node is moved and panning is not disabled by config', () => {
        const nodeNearRightEdge = {
          ...mockNode,
          position: { x: 690, y: 100 },
          size: { width: 100, height: 50 },
        };

        mockFlowCore.config.viewportPanningEnabled = true;

        mockFlowCore.modelLookup.getSelectedNodesWithChildren = vi.fn().mockReturnValue([nodeNearRightEdge]);

        const event = getSampleKeyboardMoveEvent({ direction: 'right' });
        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodesBy', {
          nodes: [nodeNearRightEdge],
          delta: { x: 10, y: 0 },
        });
        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveViewportBy', expect.any(Object));
      });

      it('should not trigger panning when node is moved but panning is disabled by config', () => {
        const nodeNearRightEdge = {
          ...mockNode,
          position: { x: 690, y: 100 },
          size: { width: 100, height: 50 },
        };

        mockFlowCore.config.viewportPanningEnabled = false;

        mockFlowCore.modelLookup.getSelectedNodesWithChildren = vi.fn().mockReturnValue([nodeNearRightEdge]);

        const event = getSampleKeyboardMoveEvent({ direction: 'right' });
        instance.handle(event);

        expect(mockCommandHandler.emit).not.toHaveBeenCalledWith('moveViewportBy', expect.any(Object));
      });

      it('should trigger panning when node will exit viewport on the left after move', () => {
        const nodeNearLeftEdge = {
          ...mockNode,
          position: { x: 5, y: 100 },
          size: { width: 100, height: 50 },
        };

        mockFlowCore.modelLookup.getSelectedNodesWithChildren = vi.fn().mockReturnValue([nodeNearLeftEdge]);

        const event = getSampleKeyboardMoveEvent({ direction: 'left' });
        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodesBy', {
          nodes: [nodeNearLeftEdge],
          delta: { x: -10, y: 0 },
        });
        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveViewportBy', { x: 15, y: 0 });
      });

      it('should trigger panning when node will exit viewport on the bottom after move', () => {
        const nodeNearBottomEdge = {
          ...mockNode,
          position: { x: 100, y: 540 },
          size: { width: 100, height: 50 },
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

      it('should trigger panning when node will exit viewport on the top after move', () => {
        const nodeNearTopEdge = {
          ...mockNode,
          position: { x: 100, y: 5 },
          size: { width: 100, height: 50 },
        };

        mockFlowCore.modelLookup.getSelectedNodesWithChildren = vi.fn().mockReturnValue([nodeNearTopEdge]);

        const event = getSampleKeyboardMoveEvent({ direction: 'top' });
        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodesBy', {
          nodes: [nodeNearTopEdge],
          delta: { x: 0, y: -10 },
        });
        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveViewportBy', { x: 0, y: 15 });
      });

      it('should calculate pan amount based on actual overflow', () => {
        mockFlowCore.config.snapping.computeSnapForNodeDrag = vi.fn().mockReturnValue({ width: 50, height: 50 });
        mockFlowCore.config.selectionMoving.edgePanningThreshold = 20;

        const nodeNearRightEdge = {
          ...mockNode,
          position: { x: 660, y: 100 },
          size: { width: 100, height: 50 },
        };

        mockFlowCore.modelLookup.getSelectedNodesWithChildren = vi.fn().mockReturnValue([nodeNearRightEdge]);

        const event = getSampleKeyboardMoveEvent({ direction: 'right' });
        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodesBy', {
          nodes: [nodeNearRightEdge],
          delta: { x: 50, y: 0 },
        });
        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveViewportBy', { x: -30, y: 0 });
      });

      it('should not trigger edge panning if node will stay within viewport after move', () => {
        const nodeFarFromEdge = {
          ...mockNode,
          position: { x: 400, y: 300 },
          size: { width: 100, height: 50 },
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

      it('should handle zoom level correctly when calculating overflow', () => {
        const mockGetMetadata = vi.fn().mockReturnValue({
          viewport: { x: 0, y: 0, scale: 0.5, width: 800, height: 600 },
        });
        mockFlowCore.model.getMetadata = mockGetMetadata;

        const nodeNearRightEdge = {
          ...mockNode,
          position: { x: 1490, y: 300 },
          size: { width: 100, height: 50 },
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

      it('should pan by maximum overflow when multiple nodes have different overflows', () => {
        const node1 = {
          ...mockNode,
          id: 'node1',
          position: { x: 680, y: 100 },
          size: { width: 100, height: 50 },
        };
        const node2 = {
          ...mockNode,
          id: 'node2',
          position: { x: 700, y: 200 },
          size: { width: 100, height: 50 },
        };

        mockFlowCore.modelLookup.getSelectedNodesWithChildren = vi.fn().mockReturnValue([node1, node2]);

        const event = getSampleKeyboardMoveEvent({ direction: 'right' });
        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveViewportBy', { x: -20, y: 0 });
      });
    });

    describe('rotated nodes', () => {
      it('should account for rotation when calculating node bounds for panning', () => {
        const rotatedNode = {
          ...mockNode,
          position: { x: 740, y: 100 },
          size: { width: 100, height: 50 },
          angle: 90,
        };

        mockFlowCore.modelLookup.getSelectedNodesWithChildren = vi.fn().mockReturnValue([rotatedNode]);

        const event = getSampleKeyboardMoveEvent({ direction: 'right' });
        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodesBy', {
          nodes: [rotatedNode],
          delta: { x: 10, y: 0 },
        });

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveViewportBy', expect.any(Object));
      });

      it('should not trigger panning for rotated node that stays within bounds', () => {
        const rotatedNode = {
          ...mockNode,
          position: { x: 400, y: 300 },
          size: { width: 100, height: 50 },
          angle: 45,
        };

        mockFlowCore.modelLookup.getSelectedNodesWithChildren = vi.fn().mockReturnValue([rotatedNode]);

        const event = getSampleKeyboardMoveEvent({ direction: 'right' });
        instance.handle(event);

        expect(mockCommandHandler.emit).not.toHaveBeenCalledWith('moveViewportBy', expect.any(Object));
      });
    });

    describe('root nodes and groups', () => {
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
          data: {},
        };

        const parent = {
          id: 'parent',
          position: { x: 10, y: 10 },
          selected: false,
          groupId: 'grandparent',
          size: { width: 80, height: 40 },
          data: {},
        };

        const child = {
          id: 'child',
          position: { x: 20, y: 20 },
          selected: false,
          groupId: 'parent',
          size: { width: 60, height: 30 },
          data: {},
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

      it('should use max snap from root nodes only when calculating delta', () => {
        mockFlowCore.config.snapping.computeSnapForNodeDrag = vi.fn().mockImplementation((node) => {
          if (node.id === 'root') return { width: 20, height: 20 };
          if (node.id === 'child') return { width: 50, height: 50 };
          return null;
        });

        const rootNode = {
          id: 'root',
          position: { x: 0, y: 0 },
          selected: true,
          size: { width: 100, height: 50 },
          data: {},
        };

        const childNode = {
          id: 'child',
          position: { x: 10, y: 10 },
          selected: false,
          groupId: 'root',
          size: { width: 80, height: 40 },
          data: {},
        };

        (mockFlowCore.modelLookup.getSelectedNodesWithChildren as ReturnType<typeof vi.fn>).mockReturnValue([
          rootNode,
          childNode,
        ]);

        const event = getSampleKeyboardMoveEvent({ direction: 'right' });
        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodesBy', {
          nodes: [rootNode, childNode],
          delta: { x: 20, y: 0 },
        });
      });

      it('should use max snap across multiple root nodes', () => {
        mockFlowCore.config.snapping.computeSnapForNodeDrag = vi.fn().mockImplementation((node) => {
          if (node.id === 'root1') return { width: 20, height: 20 };
          if (node.id === 'root2') return { width: 50, height: 50 };
          return null;
        });

        const root1 = {
          id: 'root1',
          position: { x: 0, y: 0 },
          selected: true,
          size: { width: 100, height: 50 },
          data: {},
        };

        const root2 = {
          id: 'root2',
          position: { x: 200, y: 0 },
          selected: true,
          size: { width: 100, height: 50 },
          data: {},
        };

        (mockFlowCore.modelLookup.getSelectedNodesWithChildren as ReturnType<typeof vi.fn>).mockReturnValue([
          root1,
          root2,
        ]);

        const event = getSampleKeyboardMoveEvent({ direction: 'right' });
        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodesBy', {
          nodes: [root1, root2],
          delta: { x: 50, y: 0 },
        });
      });
    });

    describe('snapping', () => {
      it('should use computeSnapForNodeDrag if available', () => {
        mockFlowCore.config.snapping.computeSnapForNodeDrag = vi.fn().mockReturnValue({ width: 20, height: 30 });

        const event = getSampleKeyboardMoveEvent({ direction: 'bottom' });
        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodesBy', {
          nodes: [mockNode],
          delta: { x: 0, y: 30 },
        });
      });

      it('should use computeSnapForNodeDrag and take precedence over defaultDragSnap', () => {
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
});
