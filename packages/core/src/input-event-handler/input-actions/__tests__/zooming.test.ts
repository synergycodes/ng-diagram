import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FlowCore } from '../../../flow-core';
import { mockEnvironment, mockPointerEvent } from '../../../test-utils';
import { type WheelEvent } from '../../../types';
import { zoomingAction } from '../zooming';

describe('zooming action', () => {
  const mockCommandHandler = { emit: vi.fn() };
  let mockEvent: WheelEvent;
  let mockFlowCore: FlowCore;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEvent = {
      type: 'wheel',
      timestamp: Date.now(),
      target: { type: 'diagram' },
      x: 100,
      y: 100,
      deltaX: 0,
      deltaY: 0,
      deltaZ: 0,
    };

    mockFlowCore = {
      getState: vi.fn().mockReturnValue({ metadata: { viewport: { x: 0, y: 0, scale: 1 } } }),
      applyUpdate: vi.fn(),
      commandHandler: mockCommandHandler,
      environment: mockEnvironment,
    } as unknown as FlowCore;
  });

  describe('predicate', () => {
    it('should return true for wheel events', () => {
      expect(zoomingAction.predicate(mockEvent, mockFlowCore)).toBe(true);
    });

    it('should return false for other events', () => {
      expect(zoomingAction.predicate({ ...mockPointerEvent, type: 'pointerdown', button: 0 }, mockFlowCore)).toBe(
        false
      );
    });
  });

  describe('action', () => {
    it('should not zoom when not wheel event', () => {
      zoomingAction.action({ ...mockPointerEvent, type: 'pointermove' }, mockFlowCore);

      expect(mockFlowCore.commandHandler.emit).not.toHaveBeenCalled();
    });

    it('should zoom in when wheel delta is negative', () => {
      mockEvent.deltaY = -10;

      zoomingAction.action(mockEvent, mockFlowCore);

      expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('zoom', {
        x: -4.999999999999997,
        y: -4.999999999999997,
        scale: 1.05,
      });
    });

    it('should zoom out when wheel delta is positive', () => {
      mockEvent.deltaY = 10;

      zoomingAction.action(mockEvent, mockFlowCore);

      expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('zoom', {
        x: 5.000000000000007,
        y: 5.000000000000007,
        scale: 0.95,
      });
    });

    it('should not exceed maximum scale limit', () => {
      mockEvent.deltaY = -10;
      mockFlowCore.getState = vi.fn().mockReturnValue({ metadata: { viewport: { x: 0, y: 0, scale: 10 } } });

      zoomingAction.action(mockEvent, mockFlowCore);

      expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('zoom', {
        x: 0,
        y: 0,
        scale: 10,
      });
    });

    it('should not go below minimum scale limit', () => {
      mockEvent.deltaY = 10;
      mockFlowCore.getState = vi.fn().mockReturnValue({ metadata: { viewport: { x: 0, y: 0, scale: 0.1 } } });

      zoomingAction.action(mockEvent, mockFlowCore);

      expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('zoom', {
        x: 0,
        y: 0,
        scale: 0.1,
      });
    });
  });
});
