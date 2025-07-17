import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockEnvironment } from '../../../test-utils';
import type { KeyboardEvent } from '../../../types';
import { pasteAction } from '../__migrated__paste';

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
    } as unknown as FlowCore;
  });

  describe('action', () => {
    it('should emit pase command', () => {
      pasteAction.action(mockEvent, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('paste');
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
