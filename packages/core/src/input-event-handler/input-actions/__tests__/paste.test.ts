import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockEnvironment } from '../../../test-utils';
import type { KeyboardEvent } from '../../../types';
import { pasteAction } from '../paste';

describe('Paste Action', () => {
  const mockCommandHandler = { emit: vi.fn() };
  let mockEvent: KeyboardEvent;
  let mockFlowCore: FlowCore;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEvent = {
      type: 'keydown',
      key: 'v',
      code: 'KeyV',
      timestamp: Date.now(),
      target: { type: 'diagram' },
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
    };

    mockFlowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
      commandHandler: mockCommandHandler,
      environment: mockEnvironment,
      clientToFlowPosition: vi.fn().mockReturnValue({ x: 100, y: 200 }),
    } as unknown as FlowCore;
  });

  describe('action', () => {
    it('should emit paste command without position when no cursor position', () => {
      pasteAction.action(mockEvent, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('paste', {});
    });

    it('should emit paste command with position when cursor position is available', () => {
      const eventWithCursor = {
        ...mockEvent,
        cursorPosition: { x: 150, y: 250 },
      };

      pasteAction.action(eventWithCursor, mockFlowCore);

      expect(mockFlowCore.clientToFlowPosition).toHaveBeenCalledWith({ x: 150, y: 250 });
      expect(mockCommandHandler.emit).toHaveBeenCalledWith('paste', { position: { x: 100, y: 200 } });
    });
  });

  describe('predicate', () => {
    it('should return false if event is not a keyboard down event', () => {
      mockEvent.type = 'keyup';

      expect(pasteAction.predicate(mockEvent, mockFlowCore)).toBe(false);
    });

    it('should return false when key is different from v', () => {
      mockEvent.key = 'a';

      expect(pasteAction.predicate(mockEvent, mockFlowCore)).toBe(false);
    });

    it('should return false when meta key is not pressed on MacOS', () => {
      mockEvent.metaKey = false;

      expect(pasteAction.predicate(mockEvent, mockFlowCore)).toBe(false);
    });

    it('should return false when ctrl key is not pressed on Windows', () => {
      mockEvent.ctrlKey = false;

      expect(pasteAction.predicate(mockEvent, mockFlowCore)).toBe(false);
    });

    it('should return true when meta + v is pressed on MacOS', () => {
      mockEvent.metaKey = true;

      expect(pasteAction.predicate(mockEvent, mockFlowCore)).toBe(true);
    });

    it('should return true when ctrl + v is pressed on Windows', () => {
      mockEnvironment.os = 'Windows';
      mockEvent.ctrlKey = true;

      expect(pasteAction.predicate(mockEvent, mockFlowCore)).toBe(true);
    });
  });
});
