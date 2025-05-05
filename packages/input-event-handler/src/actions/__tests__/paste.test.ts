import { EnvironmentInfo, InputEventHandler, KeyboardEventType } from '@angularflow/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pasteAction } from '../paste';

describe('Paste Action', () => {
  const mockCommandHandler = {
    emit: vi.fn(),
  };

  const mockActionHandler = {
    commandHandler: mockCommandHandler,
    context: {
      metaKey: false,
      ctrlKey: false,
    },
  } as unknown as InputEventHandler;

  const mockEnvironment = {
    os: 'macos',
  } as EnvironmentInfo;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should emit paste command on Mac when meta + v is pressed', () => {
    const event = {
      type: 'keydown' as KeyboardEventType,
      key: 'v',
      code: 'KeyV',
      timestamp: Date.now(),
      target: null,
    };

    mockActionHandler.context.metaKey = true;
    mockActionHandler.context.ctrlKey = false;

    pasteAction.predicate(event, mockActionHandler, mockEnvironment);
    pasteAction.action(event, mockActionHandler, mockEnvironment);

    expect(mockCommandHandler.emit).toHaveBeenCalledWith('paste');
  });

  it('should emit paste command on Windows when ctrl + v is pressed', () => {
    const event = {
      type: 'keydown' as KeyboardEventType,
      key: 'v',
      code: 'KeyV',
      timestamp: Date.now(),
      target: null,
    };

    mockActionHandler.context.metaKey = false;
    mockActionHandler.context.ctrlKey = true;
    mockEnvironment.os = 'windows';

    pasteAction.predicate(event, mockActionHandler, mockEnvironment);
    pasteAction.action(event, mockActionHandler, mockEnvironment);

    expect(mockCommandHandler.emit).toHaveBeenCalledWith('paste');
  });

  it('should not emit paste command when wrong key is pressed', () => {
    const event = {
      type: 'keydown' as KeyboardEventType,
      key: 'c',
      code: 'KeyC',
      timestamp: Date.now(),
      target: null,
    };

    mockActionHandler.context.metaKey = true;
    mockActionHandler.context.ctrlKey = false;

    const result = pasteAction.predicate(event, mockActionHandler, mockEnvironment);
    expect(result).toBe(false);
    expect(mockCommandHandler.emit).not.toHaveBeenCalled();
  });
});
