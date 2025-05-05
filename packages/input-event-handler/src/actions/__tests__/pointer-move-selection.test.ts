import {
  CommandHandler,
  EnvironmentInfo,
  EventTarget,
  FlowCore,
  InputEventHandler,
  PointerEvent,
  PointerEventType,
} from '@angularflow/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockedNode } from '../../test-utils';
import { pointerMoveSelectionAction } from '../pointer-move-selection';

describe('pointerMoveSelectionAction', () => {
  const environment: EnvironmentInfo = {
    os: 'windows',
    deviceType: 'desktop',
    browser: 'chrome',
  };
  let mockCommandHandler: CommandHandler;
  let mockEvent: PointerEvent;
  let mockTarget: EventTarget;
  let mockInputEventHandler: InputEventHandler;
  let mockFlowCore: FlowCore;

  beforeEach(() => {
    mockFlowCore = {} as FlowCore;

    mockCommandHandler = {
      emit: vi.fn(),
      flowCore: mockFlowCore,
    } as unknown as CommandHandler;

    mockTarget = mockedNode;

    mockEvent = {
      type: 'pointerdown' as PointerEventType,
      timestamp: Date.now(),
      target: mockTarget,
      x: 100,
      y: 100,
      pressure: 1,
    } as PointerEvent;

    mockInputEventHandler = {
      commandHandler: mockCommandHandler,
    } as unknown as InputEventHandler;
  });

  describe('predicate', () => {
    it('should return true for pointerdown events', () => {
      expect(pointerMoveSelectionAction.predicate(mockEvent, mockInputEventHandler, environment)).toBe(true);
    });

    it('should return true for pointermove events', () => {
      expect(
        pointerMoveSelectionAction.predicate(
          { ...mockEvent, type: 'pointermove' as PointerEventType },
          mockInputEventHandler,
          environment
        )
      ).toBe(true);
    });

    it('should return true for pointerup events', () => {
      expect(
        pointerMoveSelectionAction.predicate(
          { ...mockEvent, type: 'pointerup' as PointerEventType },
          mockInputEventHandler,
          environment
        )
      ).toBe(true);
    });

    it('should return false for other events', () => {
      expect(
        pointerMoveSelectionAction.predicate(
          { ...mockEvent, type: 'pointerenter' as PointerEventType },
          mockInputEventHandler,
          environment
        )
      ).toBe(false);
      expect(
        pointerMoveSelectionAction.predicate(
          { ...mockEvent, type: 'pointerleave' as PointerEventType },
          mockInputEventHandler,
          environment
        )
      ).toBe(false);
    });
  });

  describe('action', () => {
    it('should initialize state on pointerdown', () => {
      pointerMoveSelectionAction.action(mockEvent, mockInputEventHandler, environment);

      const moveEvent = { ...mockEvent, type: 'pointermove' as PointerEventType, x: 110, y: 110 };
      pointerMoveSelectionAction.action(moveEvent, mockInputEventHandler, environment);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveSelection', {
        dx: 10,
        dy: 10,
      });
    });

    it('should calculate movement relative to last position after first move', () => {
      pointerMoveSelectionAction.action(mockEvent, mockInputEventHandler, environment);

      const firstMoveEvent = { ...mockEvent, type: 'pointermove' as PointerEventType, x: 110, y: 110 };
      pointerMoveSelectionAction.action(firstMoveEvent, mockInputEventHandler, environment);

      const secondMoveEvent = { ...mockEvent, type: 'pointermove' as PointerEventType, x: 120, y: 120 };
      pointerMoveSelectionAction.action(secondMoveEvent, mockInputEventHandler, environment);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveSelection', {
        dx: 10,
        dy: 10,
      });
    });

    it('should stop movement on pointerup', () => {
      pointerMoveSelectionAction.action(mockEvent, mockInputEventHandler, environment);

      const firstMoveEvent = { ...mockEvent, type: 'pointermove' as PointerEventType, x: 110, y: 110 };
      pointerMoveSelectionAction.action(firstMoveEvent, mockInputEventHandler, environment);

      pointerMoveSelectionAction.action(
        { ...mockEvent, type: 'pointerup' as PointerEventType },
        mockInputEventHandler,
        environment
      );

      const moveAfterUpEvent = { ...mockEvent, type: 'pointermove' as PointerEventType, x: 120, y: 120 };
      pointerMoveSelectionAction.action(moveAfterUpEvent, mockInputEventHandler, environment);

      expect(mockCommandHandler.emit).toHaveBeenCalledTimes(1);
    });

    it('should not emit movement if not in moving state', () => {
      const moveEvent = { ...mockEvent, type: 'pointermove' as PointerEventType, x: 110, y: 110 };
      pointerMoveSelectionAction.action(moveEvent, mockInputEventHandler, environment);

      expect(mockCommandHandler.emit).not.toHaveBeenCalled();
    });
  });
});
