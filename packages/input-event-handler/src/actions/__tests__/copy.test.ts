import { EnvironmentInfo, InputEventHandler, KeyboardEventType } from '@angularflow/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { copyAction } from '../copy';

describe('Copy Action', () => {
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

  it('should emit copy command on Mac when meta + c is pressed', () => {
    const event = {
      type: 'keydown' as KeyboardEventType,
      key: 'c',
      code: 'KeyC',
      timestamp: Date.now(),
      target: null,
    };

    mockActionHandler.context.metaKey = true;
    mockActionHandler.context.ctrlKey = false;

    copyAction.predicate(event, mockActionHandler, mockEnvironment);
    copyAction.action(event, mockActionHandler, mockEnvironment);

    expect(mockCommandHandler.emit).toHaveBeenCalledWith('copy');
  });

  it('should emit copy command on Windows when ctrl + c is pressed', () => {
    const event = {
      type: 'keydown' as KeyboardEventType,
      key: 'c',
      code: 'KeyC',
      timestamp: Date.now(),
      target: null,
    };

    mockActionHandler.context.metaKey = false;
    mockActionHandler.context.ctrlKey = true;
    mockEnvironment.os = 'windows';

    copyAction.predicate(event, mockActionHandler, mockEnvironment);
    copyAction.action(event, mockActionHandler, mockEnvironment);

    expect(mockCommandHandler.emit).toHaveBeenCalledWith('copy');
  });

  it('should not emit copy command when wrong key is pressed', () => {
    const event = {
      type: 'keydown' as KeyboardEventType,
      key: 'v',
      code: 'KeyV',
      timestamp: Date.now(),
      target: null,
    };

    mockActionHandler.context.metaKey = true;
    mockActionHandler.context.ctrlKey = false;

    const result = copyAction.predicate(event, mockActionHandler, mockEnvironment);
    expect(result).toBe(false);
    expect(mockCommandHandler.emit).not.toHaveBeenCalled();
  });
});
