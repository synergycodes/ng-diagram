import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockEnvironment, mockNode, mockPointerEvent } from '../../../test-utils';
import { selectAction } from '../select';

describe('selectAction', () => {
  const mockCommandHandler = { emit: vi.fn() };
  let mockFlowCore: FlowCore;

  beforeEach(() => {
    vi.clearAllMocks();

    mockFlowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
      commandHandler: mockCommandHandler,
      environment: mockEnvironment,
    } as unknown as FlowCore;
  });

  describe('predicate', () => {
    it('should return true for pointerdown events', () => {
      expect(selectAction.predicate({ ...mockPointerEvent, type: 'pointerdown', button: 0 }, mockFlowCore)).toBe(true);
    });

    it('should return false for other events', () => {
      expect(selectAction.predicate({ ...mockPointerEvent, type: 'pointerenter' }, mockFlowCore)).toBe(false);
      expect(selectAction.predicate({ ...mockPointerEvent, type: 'pointerup', button: 0 }, mockFlowCore)).toBe(false);
    });
  });

  describe('action', () => {
    it('should emit deselectAll command when no target is provided', () => {
      selectAction.action(
        { ...mockPointerEvent, target: { type: 'diagram' }, type: 'pointerdown', button: 0 },
        mockFlowCore
      );
      expect(mockCommandHandler.emit).toHaveBeenCalledWith('deselectAll');
    });

    it('should emit select command when target is provided', () => {
      selectAction.action(
        { ...mockPointerEvent, type: 'pointerdown', target: { type: 'node', element: mockNode }, button: 0 },
        mockFlowCore
      );
      expect(mockCommandHandler.emit).toHaveBeenCalledWith('select', { ids: [mockNode.id] });
    });
  });
});
