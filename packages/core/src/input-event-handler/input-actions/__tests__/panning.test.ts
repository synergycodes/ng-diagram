import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { getSamplePointerEvent, mockEnvironment, mockNode } from '../../../test-utils';
import type { EventTarget, PointerEvent } from '../../../types';
import { panningAction } from '../panning';

describe('panningAction', () => {
  const mockCommandHandler = { emit: vi.fn() };
  let mockEvent: PointerEvent;
  let mockTarget: EventTarget;
  let mockFlowCore: FlowCore;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTarget = { type: 'diagram' };
    mockEvent = getSamplePointerEvent({
      type: 'pointerdown',
      pointerId: 1,
      x: 100,
      y: 100,
      button: 0,
      target: mockTarget,
    });
    mockFlowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
      commandHandler: mockCommandHandler,
      environment: mockEnvironment,
    } as unknown as FlowCore;

    panningAction.action(getSamplePointerEvent({ type: 'pointerup', button: 0 }), mockFlowCore);
  });

  describe('predicate', () => {
    it('should return true for pointerdown events', () => {
      expect(panningAction.predicate(mockEvent, mockFlowCore)).toBe(true);
    });

    it('should return true for pointermove events', () => {
      expect(panningAction.predicate(getSamplePointerEvent({ type: 'pointermove' }), mockFlowCore)).toBe(true);
    });

    it('should return true for pointerup events', () => {
      expect(panningAction.predicate(getSamplePointerEvent({ type: 'pointerup', button: 0 }), mockFlowCore)).toBe(true);
    });

    it('should return false for other events', () => {
      expect(panningAction.predicate(getSamplePointerEvent({ type: 'pointerenter' }), mockFlowCore)).toBe(false);
      expect(panningAction.predicate(getSamplePointerEvent({ type: 'pointerleave' }), mockFlowCore)).toBe(false);
    });

    it('should return false for pointerdown events with a non-background target', () => {
      expect(
        panningAction.predicate(
          getSamplePointerEvent({ type: 'pointerdown', target: { type: 'node', element: mockNode }, button: 0 }),
          mockFlowCore
        )
      ).toBe(false);
    });
  });

  describe('action', () => {
    it('should initialize state on pointerdown', () => {
      panningAction.action(mockEvent, mockFlowCore);

      const moveEvent = getSamplePointerEvent({ type: 'pointermove', x: 110, y: 110 });
      panningAction.action(moveEvent, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveViewportBy', { x: 10, y: 10 });
    });

    it('should calculate movement relative to last position after first move', () => {
      panningAction.action(mockEvent, mockFlowCore);

      const firstMoveEvent = getSamplePointerEvent({ type: 'pointermove', x: 110, y: 110 });
      panningAction.action(firstMoveEvent, mockFlowCore);

      const secondMoveEvent = getSamplePointerEvent({ type: 'pointermove', x: 120, y: 120 });
      panningAction.action(secondMoveEvent, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveViewportBy', { x: 10, y: 10 });
    });

    it('should stop movement on pointerup', () => {
      panningAction.action(mockEvent, mockFlowCore);

      const firstMoveEvent = getSamplePointerEvent({ type: 'pointermove', x: 110, y: 110 });
      panningAction.action(firstMoveEvent, mockFlowCore);

      panningAction.action(getSamplePointerEvent({ type: 'pointerup', button: 0 }), mockFlowCore);

      const moveAfterUpEvent = getSamplePointerEvent({ type: 'pointermove', x: 120, y: 120 });
      panningAction.action(moveAfterUpEvent, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenCalledTimes(1);
    });

    it('should not emit movement if not in moving state', () => {
      const moveEvent = getSamplePointerEvent({ type: 'pointermove', x: 110, y: 110 });
      panningAction.action(moveEvent, mockFlowCore);

      expect(mockCommandHandler.emit).not.toHaveBeenCalled();
    });

    it('should not emit movement if multiple pointers are down', () => {
      const anotherPointerDownEvent = getSamplePointerEvent({
        type: 'pointerdown',
        pointerId: 2,
        x: 200,
        y: 200,
        button: 0,
        target: mockTarget,
      });
      panningAction.action(mockEvent, mockFlowCore);
      panningAction.action(anotherPointerDownEvent, mockFlowCore);

      const moveEvent = getSamplePointerEvent({ type: 'pointermove', x: 110, y: 110 });
      panningAction.action(moveEvent, mockFlowCore);

      expect(mockCommandHandler.emit).not.toHaveBeenCalled();
    });
  });
});
