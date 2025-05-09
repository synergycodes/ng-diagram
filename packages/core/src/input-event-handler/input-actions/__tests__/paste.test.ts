import { EnvironmentInfo, InputEventHandler, KeyboardEvent } from '@angularflow/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { pasteAction } from '../paste';

describe('Paste Action', () => {
  const mockCommandHandler = { emit: vi.fn() };
  const mockActionHandler = { commandHandler: mockCommandHandler } as unknown as InputEventHandler;
  const mockEnvironment: EnvironmentInfo = { os: 'MacOS', browser: 'Chrome' };
  let mockEvent: KeyboardEvent;

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
  });

  describe('action', () => {
    it('should emit pase command', () => {
      pasteAction.action(mockEvent, mockActionHandler, mockEnvironment);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('paste');
    });
  });

  describe('predicate', () => {
    it('should return false if event is not a keyboard down event', () => {
      mockEvent.type = 'keyup';

      expect(pasteAction.predicate(mockEvent, mockActionHandler, mockEnvironment)).toBe(false);
    });

    it('should return false when key is different from v', () => {
      mockEvent.key = 'a';

      expect(pasteAction.predicate(mockEvent, mockActionHandler, mockEnvironment)).toBe(false);
    });

    it('should return false when meta key is not pressed on MacOS', () => {
      mockEvent.metaKey = false;

      expect(pasteAction.predicate(mockEvent, mockActionHandler, mockEnvironment)).toBe(false);
    });

    it('should return false when ctrl key is not pressed on Windows', () => {
      mockEvent.ctrlKey = false;

      expect(pasteAction.predicate(mockEvent, mockActionHandler, mockEnvironment)).toBe(false);
    });

    it('should return true when meta + v is pressed on MacOS', () => {
      mockEvent.metaKey = true;

      expect(pasteAction.predicate(mockEvent, mockActionHandler, mockEnvironment)).toBe(true);
    });

    it('should return true when ctrl + v is pressed on Windows', () => {
      mockEnvironment.os = 'Windows';
      mockEvent.ctrlKey = true;

      expect(pasteAction.predicate(mockEvent, mockActionHandler, mockEnvironment)).toBe(true);
    });
  });
});
