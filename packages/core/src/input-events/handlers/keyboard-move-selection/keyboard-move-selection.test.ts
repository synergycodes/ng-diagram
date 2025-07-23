import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockEnvironment, mockNode } from '../../../test-utils';
import { KeyboardMoveSelectionEvent } from './keyboard-move-selection.event';
import { KeyboardMoveSelectionEventHandler } from './keyboard-move-selection.handler';

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
    } as unknown as FlowCore;

    instance = new KeyboardMoveSelectionEventHandler(mockFlowCore);
  });

  describe('handle', () => {
    it('should emit moveNodesBy command with correct delta for right direction', () => {
      const event = getSampleKeyboardMoveEvent({ direction: 'right' });

      instance.handle(event);

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

    it('should not emit command if no nodes are selected', () => {
      // Reset the mock to return empty array
      (mockFlowCore.modelLookup.getSelectedNodesWithChildren as ReturnType<typeof vi.fn>).mockReturnValue([]);

      const event = getSampleKeyboardMoveEvent({ direction: 'right' });

      instance.handle(event);

      expect(mockCommandHandler.emit).not.toHaveBeenCalled();
    });
  });
});
