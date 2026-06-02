import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockEnvironment } from '../../../test-utils';
import { WheelPanningEventHandler } from './wheel-panning.handler';
import { WheelPanningEvent } from './wheel-panning.event';

function getSampleWheelPanningEvent(overrides: Partial<WheelPanningEvent> = {}): WheelPanningEvent {
  return {
    name: 'wheelPanning',
    id: 'test-id',
    timestamp: Date.now(),
    modifiers: {
      primary: false,
      secondary: false,
      shift: false,
      meta: false,
    },
    deltaX: 0,
    deltaY: 0,
    ...overrides,
  };
}

describe('WheelPanningEventHandler', () => {
  const mockCommandHandler = { emit: vi.fn() };
  let mockActionStateManager: {
    panning: { active: boolean } | undefined;
    clearPanning: ReturnType<typeof vi.fn>;
    isPanning: ReturnType<typeof vi.fn>;
  };
  let mockFlowCore: FlowCore;
  let instance: WheelPanningEventHandler;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    mockActionStateManager = {
      panning: undefined,
      clearPanning: vi.fn(() => {
        mockActionStateManager.panning = undefined;
      }),
      isPanning: vi.fn(() => !!mockActionStateManager.panning?.active),
    };

    mockFlowCore = {
      commandHandler: mockCommandHandler,
      actionStateManager: mockActionStateManager,
      environment: mockEnvironment,
    } as unknown as FlowCore;

    instance = new WheelPanningEventHandler(mockFlowCore);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('emits moveViewportBy with negated deltas', () => {
    instance.handle(getSampleWheelPanningEvent({ deltaX: 10, deltaY: 20 }));

    expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveViewportBy', { x: -10, y: -20 });
  });

  it('handles single-axis deltas', () => {
    instance.handle(getSampleWheelPanningEvent({ deltaX: 5, deltaY: 0 }));
    instance.handle(getSampleWheelPanningEvent({ deltaX: 0, deltaY: 7 }));

    expect(mockCommandHandler.emit).toHaveBeenNthCalledWith(1, 'moveViewportBy', { x: -5, y: 0 });
    expect(mockCommandHandler.emit).toHaveBeenNthCalledWith(2, 'moveViewportBy', { x: 0, y: -7 });
  });

  it('no-ops on zero deltas', () => {
    instance.handle(getSampleWheelPanningEvent({ deltaX: 0, deltaY: 0 }));

    expect(mockCommandHandler.emit).not.toHaveBeenCalled();
    expect(mockActionStateManager.panning).toBeUndefined();
  });

  describe('panning state lifecycle', () => {
    it('activates panning state on the first event', () => {
      expect(mockActionStateManager.panning).toBeUndefined();

      instance.handle(getSampleWheelPanningEvent({ deltaY: 5 }));

      expect(mockActionStateManager.panning).toEqual({ active: true });
    });

    it('keeps panning state active across repeated events within the idle window', () => {
      instance.handle(getSampleWheelPanningEvent({ deltaY: 5 }));
      vi.advanceTimersByTime(50);
      instance.handle(getSampleWheelPanningEvent({ deltaY: 5 }));
      vi.advanceTimersByTime(50);
      instance.handle(getSampleWheelPanningEvent({ deltaY: 5 }));

      expect(mockActionStateManager.panning).toEqual({ active: true });
      expect(mockActionStateManager.clearPanning).not.toHaveBeenCalled();
    });

    it('clears panning state after the idle timeout elapses', () => {
      instance.handle(getSampleWheelPanningEvent({ deltaY: 5 }));

      vi.advanceTimersByTime(99);
      expect(mockActionStateManager.clearPanning).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(mockActionStateManager.clearPanning).toHaveBeenCalledTimes(1);
      expect(mockActionStateManager.panning).toBeUndefined();
    });

    it('re-arms the idle timer on each event', () => {
      instance.handle(getSampleWheelPanningEvent({ deltaY: 5 }));
      vi.advanceTimersByTime(90);
      instance.handle(getSampleWheelPanningEvent({ deltaY: 5 }));
      vi.advanceTimersByTime(90);

      // Without re-arming, the first 90ms + 90ms would have fired by now.
      expect(mockActionStateManager.clearPanning).not.toHaveBeenCalled();

      vi.advanceTimersByTime(10);
      expect(mockActionStateManager.clearPanning).toHaveBeenCalledTimes(1);
    });

    it('does not activate panning state for zero-delta events', () => {
      instance.handle(getSampleWheelPanningEvent({ deltaX: 0, deltaY: 0 }));

      expect(mockActionStateManager.panning).toBeUndefined();
      expect(mockActionStateManager.clearPanning).not.toHaveBeenCalled();
    });
  });
});
