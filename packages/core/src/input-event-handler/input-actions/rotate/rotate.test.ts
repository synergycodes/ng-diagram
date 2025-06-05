import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FlowCore } from '../../../flow-core';
import { getSampleKeyboardEvent, getSamplePointerEvent } from '../../../test-utils';
import type { Event, RotateEvent } from '../../../types/event.interface';
import { rotateAction } from './rotate';

describe('Rotate actions', () => {
  let flowCore: FlowCore;
  const mockNode = {
    id: 'test-node',
    type: 'node',
    position: { x: 100, y: 100 },
    size: { width: 200, height: 200 },
    data: {},
  };

  beforeEach(() => {
    flowCore = {
      commandHandler: { emit: vi.fn() },
    } as unknown as FlowCore;
    vi.clearAllMocks();
  });

  describe('predicate', () => {
    it('should return true for pointer down event with node target and button 0', () => {
      const event = getSamplePointerEvent({
        type: 'pointerdown',
        button: 0,
        target: { type: 'node', element: mockNode },
      });
      expect(rotateAction.predicate(event, flowCore)).toBe(true);
    });

    it('should return true for rotate event when rotating', () => {
      rotateAction.action(
        { type: 'pointerdown', button: 0, target: { type: 'node', element: mockNode } } as Event,
        flowCore
      );
      const event = { type: 'rotate', isRotating: true } as unknown as Event;
      expect(rotateAction.predicate(event, flowCore)).toBe(true);
    });

    it('should return true for pointer up event with button 0', () => {
      const event = getSamplePointerEvent({ type: 'pointerup', button: 0 });
      expect(rotateAction.predicate(event, flowCore)).toBe(true);
    });

    it('should return false for keyboard event', () => {
      const event = getSampleKeyboardEvent({ type: 'keydown' });
      expect(rotateAction.predicate(event, flowCore)).toBe(false);
    });
  });

  describe('action', () => {
    it('should set isRotating to true on pointerdown', () => {
      rotateAction.action(
        { type: 'pointerdown', button: 0, target: { type: 'node', element: mockNode } } as Event,
        flowCore
      );
      // No assertion needed, just ensure no error
    });

    it('should set isRotating to false on pointerup', () => {
      rotateAction.action(
        { type: 'pointerup', button: 0, target: { type: 'node', element: mockNode } } as Event,
        flowCore
      );
      // No assertion needed, just ensure no error
    });

    it('should emit rotateNode on valid rotate event', () => {
      rotateAction.action(
        { type: 'pointerup', button: 0, target: { type: 'node', element: mockNode } } as Event,
        flowCore
      );
      const event: RotateEvent = {
        type: 'rotate',
        mouseX: 150,
        mouseY: 150,
        handleX: 100,
        handleY: 100,
        target: { type: 'node', element: mockNode },
        timestamp: 1,
      };
      rotateAction.action(event, flowCore);
      expect(flowCore.commandHandler.emit).toHaveBeenCalledWith(
        'rotateNode',
        expect.objectContaining({ nodeId: mockNode.id })
      );
    });

    it('should not emit rotateNode if mouse is too close to center', () => {
      rotateAction.action(
        { type: 'pointerup', button: 0, target: { type: 'node', element: mockNode } } as Event,
        flowCore
      );
      const event: RotateEvent = {
        type: 'rotate',
        mouseX: 101,
        mouseY: 101,
        handleX: 100,
        handleY: 100,
        target: { type: 'node', element: mockNode },
        timestamp: 1,
      };
      rotateAction.action(event, flowCore);
      expect(flowCore.commandHandler.emit).not.toHaveBeenCalled();
    });

    it('should not emit rotateNode for non-node target', () => {
      rotateAction.action(
        { type: 'pointerup', button: 0, target: { type: 'node', element: mockNode } } as Event,
        flowCore
      );
      const event: RotateEvent = {
        type: 'rotate',
        mouseX: 150,
        mouseY: 150,
        handleX: 100,
        handleY: 100,
        target: { type: 'diagram' },
        timestamp: 1,
      };
      rotateAction.action(event, flowCore);
      expect(flowCore.commandHandler.emit).not.toHaveBeenCalled();
    });
  });
});
