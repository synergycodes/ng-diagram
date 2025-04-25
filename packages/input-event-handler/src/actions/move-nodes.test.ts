import { CommandHandler, EventTarget, FlowCore, InputEventHandler, KeyboardEvent } from '@angularflow/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { moveNodesAction } from './move-nodes';

describe('moveNodesAction', () => {
  let mockCommandHandler: CommandHandler;
  let mockEvent: KeyboardEvent;
  let mockTarget: EventTarget;
  let mockInputEventHandler: InputEventHandler;
  let mockFlowCore: FlowCore;

  beforeEach(() => {
    mockFlowCore = {} as FlowCore;

    mockCommandHandler = {
      emit: vi.fn(),
      flowCore: mockFlowCore,
    } as unknown as CommandHandler;

    mockTarget = { id: '1' } as EventTarget;

    mockEvent = {
      type: 'keydown',
      timestamp: Date.now(),
      target: mockTarget,
      key: 'ArrowRight',
      code: 'ArrowRight',
    } as KeyboardEvent;

    mockInputEventHandler = {
      commandHandler: mockCommandHandler,
    } as unknown as InputEventHandler;
  });

  it('should emit moveNodes command with correct dx and dy for ArrowRight', () => {
    moveNodesAction.action(mockEvent, mockInputEventHandler);

    expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodes', {
      dx: 10,
      dy: 0,
    });
  });

  it('should emit moveNodes command with correct dx and dy for ArrowLeft', () => {
    mockEvent = {
      ...mockEvent,
      key: 'ArrowLeft',
      code: 'ArrowLeft',
    } as KeyboardEvent;

    moveNodesAction.action(mockEvent, mockInputEventHandler);

    expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodes', {
      dx: -10,
      dy: 0,
    });
  });

  it('should emit moveNodes command with correct dx and dy for ArrowUp', () => {
    mockEvent = {
      ...mockEvent,
      key: 'ArrowUp',
      code: 'ArrowUp',
    } as KeyboardEvent;

    moveNodesAction.action(mockEvent, mockInputEventHandler);

    expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodes', {
      dx: 0,
      dy: -10,
    });
  });

  it('should emit moveNodes command with correct dx and dy for ArrowDown', () => {
    mockEvent = {
      ...mockEvent,
      key: 'ArrowDown',
      code: 'ArrowDown',
    } as KeyboardEvent;

    moveNodesAction.action(mockEvent, mockInputEventHandler);

    expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveNodes', {
      dx: 0,
      dy: 10,
    });
  });

  it('should not emit moveNodes command for non-arrow keys', () => {
    mockEvent = {
      ...mockEvent,
      key: 'A',
      code: 'KeyA',
    } as KeyboardEvent;

    moveNodesAction.action(mockEvent, mockInputEventHandler);

    expect(mockCommandHandler.emit).not.toHaveBeenCalled();
  });

  it('should not emit moveNodes command for non-keydown events', () => {
    mockEvent = {
      ...mockEvent,
      type: 'keyup',
    } as KeyboardEvent;

    moveNodesAction.action(mockEvent, mockInputEventHandler);

    expect(mockCommandHandler.emit).not.toHaveBeenCalled();
  });

  it('should only trigger for keydown events', () => {
    const keyupEvent = {
      ...mockEvent,
      type: 'keyup',
    } as KeyboardEvent;

    expect(moveNodesAction.predicate(mockEvent, mockInputEventHandler)).toBe(true);
    expect(moveNodesAction.predicate(keyupEvent, mockInputEventHandler)).toBe(false);
  });
});
