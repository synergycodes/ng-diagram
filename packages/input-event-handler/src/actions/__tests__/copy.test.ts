import { EnvironmentInfo, InputEventHandler, KeyboardEvent } from '@angularflow/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { copyAction } from '../copy';

describe('Copy Action', () => {
  const mockCommandHandler = { emit: vi.fn() };
  const mockActionHandler = { commandHandler: mockCommandHandler } as unknown as InputEventHandler;
  const mockEnvironment: EnvironmentInfo = { os: 'MacOS', browser: 'Chrome' };
  let mockEvent: KeyboardEvent;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEvent = {
      type: 'keydown',
      key: 'c',
      code: 'KeyC',
      timestamp: Date.now(),
      target: null,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
    };
  });

  describe('action', () => {
    it('should emit copy command', () => {
      copyAction.action(mockEvent, mockActionHandler, mockEnvironment);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('copy');
    });
  });

  describe('predicate', () => {
    it('should return false if event is not a keyboard down event', () => {
      mockEvent.type = 'keyup';

      expect(copyAction.predicate(mockEvent, mockActionHandler, mockEnvironment)).toBe(false);
    });

    it('should return false when key is different from c', () => {
      mockEvent.key = 'a';

      expect(copyAction.predicate(mockEvent, mockActionHandler, mockEnvironment)).toBe(false);
    });

    it('should return false when meta key is not pressed on MacOS', () => {
      mockEvent.metaKey = false;

      expect(copyAction.predicate(mockEvent, mockActionHandler, mockEnvironment)).toBe(false);
    });

    it('should return false when ctrl key is not pressed on Windows', () => {
      mockEvent.ctrlKey = false;

      expect(copyAction.predicate(mockEvent, mockActionHandler, mockEnvironment)).toBe(false);
    });

    it('should return true when meta + c is pressed on MacOS', () => {
      mockEvent.metaKey = true;

      expect(copyAction.predicate(mockEvent, mockActionHandler, mockEnvironment)).toBe(true);
    });

    it('should return true when ctrl + c is pressed on Windows', () => {
      mockEnvironment.os = 'Windows';
      mockEvent.ctrlKey = true;

      expect(copyAction.predicate(mockEvent, mockActionHandler, mockEnvironment)).toBe(true);
    });
  });
});
