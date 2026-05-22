import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCoreProviderService } from '../../../services/flow-core-provider/flow-core-provider.service';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { WheelInputEvent } from '../../../types';
import { ZoomingWheelDirective } from './zooming-wheel.directive';

interface MockEmit {
  emit: ReturnType<typeof vi.fn>;
}

function makeWheelEvent(overrides: Partial<WheelInputEvent> = {}): WheelInputEvent {
  const event = {
    deltaX: 0,
    deltaY: 0,
    deltaZ: 0,
    clientX: 50,
    clientY: 60,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    button: 0,
    zoomingHandled: false,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...overrides,
  } as unknown as WheelInputEvent;
  return event;
}

describe('ZoomingWheelDirective', () => {
  let directive: ZoomingWheelDirective;
  let emittedEvents: MockEmit;
  let matchesAction: ReturnType<typeof vi.fn>;
  let isPanning: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    emittedEvents = { emit: vi.fn() };
    matchesAction = vi.fn().mockReturnValue(false);
    isPanning = vi.fn().mockReturnValue(false);

    const mockFlowCore = {
      config: { zoom: { step: 0.1 } },
      shortcutManager: { matchesAction },
      actionStateManager: { isPanning },
    };

    const mockFlowCoreProvider = {
      provide: () => mockFlowCore,
    };

    const mockRouter = {
      getBaseEvent: vi.fn(() => ({
        id: 'id',
        timestamp: 0,
        modifiers: { primary: false, secondary: false, shift: false, meta: false },
      })),
      emit: emittedEvents.emit,
    };

    TestBed.configureTestingModule({
      providers: [
        ZoomingWheelDirective,
        { provide: FlowCoreProviderService, useValue: mockFlowCoreProvider },
        { provide: InputEventsRouterService, useValue: mockRouter },
      ],
    });

    directive = TestBed.inject(ZoomingWheelDirective);
  });

  describe('shouldHandle / onWheel routing', () => {
    it('skips events already marked as zoomingHandled', () => {
      directive.onWheel(makeWheelEvent({ zoomingHandled: true, ctrlKey: true, deltaY: 5 }));
      expect(emittedEvents.emit).not.toHaveBeenCalled();
    });

    it('handles any ctrlKey wheel event (including large-delta pinches on Mac)', () => {
      directive.onWheel(makeWheelEvent({ ctrlKey: true, deltaY: 80 }));
      expect(emittedEvents.emit).toHaveBeenCalledOnce();
      expect(matchesAction).not.toHaveBeenCalled();
    });

    it('defers to the zoom shortcut when ctrlKey is not set', () => {
      matchesAction.mockReturnValue(true);
      directive.onWheel(makeWheelEvent({ ctrlKey: false, deltaY: 100 }));
      expect(emittedEvents.emit).toHaveBeenCalledOnce();
      expect(matchesAction).toHaveBeenCalled();
    });

    it('drops the event when neither ctrlKey nor the zoom shortcut applies', () => {
      matchesAction.mockReturnValue(false);
      directive.onWheel(makeWheelEvent({ ctrlKey: false, deltaY: 100 }));
      expect(emittedEvents.emit).not.toHaveBeenCalled();
    });

    it('marks the event as zoomingHandled when it handles it', () => {
      const event = makeWheelEvent({ ctrlKey: true, deltaY: 5 });
      directive.onWheel(event);
      expect(event.zoomingHandled).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('suppresses zoom while a wheel-pan gesture is in flight (Mac flick inertia)', () => {
      isPanning.mockReturnValue(true);
      // Modifier pressed mid-flick — would normally trigger zoom, but the
      // ongoing pan gesture should absorb the inertia events.
      directive.onWheel(makeWheelEvent({ ctrlKey: true, deltaY: 5 }));
      directive.onWheel(makeWheelEvent({ deltaY: 100, metaKey: true }));
      expect(emittedEvents.emit).not.toHaveBeenCalled();
    });
  });

  describe('zoom factor selection', () => {
    it('uses an exponential factor for gentle pinches (ctrlKey + |deltaY| < 50)', () => {
      directive.onWheel(makeWheelEvent({ ctrlKey: true, deltaY: 10 }));

      const call = emittedEvents.emit.mock.calls[0][0];
      expect(call.name).toBe('zoom');
      // exp(-10 * 0.01) = exp(-0.1)
      expect(call.zoomFactor).toBeCloseTo(Math.exp(-0.1), 10);
    });

    it('uses the step-based factor for aggressive pinches (ctrlKey + |deltaY| >= 50)', () => {
      directive.onWheel(makeWheelEvent({ ctrlKey: true, deltaY: 80 }));

      const call = emittedEvents.emit.mock.calls[0][0];
      expect(call.zoomFactor).toBe(1 - 0.1); // deltaY > 0 → zoom out by step
    });

    it('uses the step-based factor for non-pinch zoom shortcut events', () => {
      matchesAction.mockReturnValue(true);
      directive.onWheel(makeWheelEvent({ ctrlKey: false, deltaY: 100 }));

      const call = emittedEvents.emit.mock.calls[0][0];
      expect(call.zoomFactor).toBe(1 - 0.1);
    });

    it('zooms in (>1) on negative deltaY when using the step-based factor', () => {
      matchesAction.mockReturnValue(true);
      directive.onWheel(makeWheelEvent({ ctrlKey: false, deltaY: -100 }));

      const call = emittedEvents.emit.mock.calls[0][0];
      expect(call.zoomFactor).toBe(1 + 0.1);
    });

    it('zooms in (>1) on negative deltaY with the exponential factor', () => {
      directive.onWheel(makeWheelEvent({ ctrlKey: true, deltaY: -10 }));

      const call = emittedEvents.emit.mock.calls[0][0];
      expect(call.zoomFactor).toBeCloseTo(Math.exp(0.1), 10);
    });
  });

  it('passes the cursor position as the zoom center', () => {
    directive.onWheel(makeWheelEvent({ ctrlKey: true, deltaY: 5, clientX: 123, clientY: 456 }));

    const call = emittedEvents.emit.mock.calls[0][0];
    expect(call.centerPoint).toEqual({ x: 123, y: 456 });
  });
});
