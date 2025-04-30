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
import { panningAction } from '../panning';

describe('panningAction', () => {
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
      targetType: 'background',
    } as PointerEvent;

    mockInputEventHandler = {
      commandHandler: mockCommandHandler,
    } as unknown as InputEventHandler;
  });

  describe('predicate', () => {
    it('should return true for pointerdown events', () => {
      expect(panningAction.predicate(mockEvent, mockInputEventHandler)).toBe(true);
    });

    it('should return true for pointermove events', () => {
      expect(
        panningAction.predicate({ ...mockEvent, type: 'pointermove' as PointerEventType }, mockInputEventHandler)
      ).toBe(true);
    });

    it('should return true for pointerup events', () => {
      expect(
        panningAction.predicate({ ...mockEvent, type: 'pointerup' as PointerEventType }, mockInputEventHandler)
      ).toBe(true);
    });

    it('should return false for other events', () => {
      expect(
        panningAction.predicate({ ...mockEvent, type: 'pointerenter' as PointerEventType }, mockInputEventHandler)
      ).toBe(false);
      expect(
        panningAction.predicate({ ...mockEvent, type: 'pointerleave' as PointerEventType }, mockInputEventHandler)
      ).toBe(false);
    });

    it('should return false for pointerdown events with a non-background target', () => {
      expect(
        panningAction.predicate(
          { ...mockEvent, type: 'pointerdown' as PointerEventType, targetType: 'node' },
          mockInputEventHandler
        )
      ).toBe(false);
    });
  });

  describe('action', () => {
    it('should initialize state on pointerdown', () => {
      panningAction.action(mockEvent, mockInputEventHandler, environment);

      const moveEvent = { ...mockEvent, type: 'pointermove' as PointerEventType, x: 110, y: 110 };
      panningAction.action(moveEvent, mockInputEventHandler, environment);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveViewportBy', {
        x: 10,
        y: 10,
      });
    });

    it('should calculate movement relative to last position after first move', () => {
      panningAction.action(mockEvent, mockInputEventHandler, environment);

      const firstMoveEvent = { ...mockEvent, type: 'pointermove' as PointerEventType, x: 110, y: 110 };
      panningAction.action(firstMoveEvent, mockInputEventHandler, environment);

      const secondMoveEvent = { ...mockEvent, type: 'pointermove' as PointerEventType, x: 120, y: 120 };
      panningAction.action(secondMoveEvent, mockInputEventHandler, environment);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveViewportBy', {
        x: 10,
        y: 10,
      });
    });

    it('should stop movement on pointerup', () => {
      panningAction.action(mockEvent, mockInputEventHandler, environment);

      const firstMoveEvent = { ...mockEvent, type: 'pointermove' as PointerEventType, x: 110, y: 110 };
      panningAction.action(firstMoveEvent, mockInputEventHandler, environment);

      panningAction.action({ ...mockEvent, type: 'pointerup' as PointerEventType }, mockInputEventHandler, environment);

      const moveAfterUpEvent = { ...mockEvent, type: 'pointermove' as PointerEventType, x: 120, y: 120 };
      panningAction.action(moveAfterUpEvent, mockInputEventHandler, environment);

      expect(mockCommandHandler.emit).toHaveBeenCalledTimes(1);
    });

    it('should not emit movement if not in moving state', () => {
      const moveEvent = { ...mockEvent, type: 'pointermove' as PointerEventType, x: 110, y: 110 };
      panningAction.action(moveEvent, mockInputEventHandler, environment);

      expect(mockCommandHandler.emit).not.toHaveBeenCalled();
    });
  });
});
