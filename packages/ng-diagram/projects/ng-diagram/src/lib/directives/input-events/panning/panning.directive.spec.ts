import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NgDiagramService } from '../../../public-services/ng-diagram.service';
import { FlowCoreProviderService } from '../../../services/flow-core-provider/flow-core-provider.service';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { WheelInputEvent } from '../../../types';
import { PanningDirective } from './panning.directive';

function makeWheelEvent(overrides: Partial<WheelInputEvent> = {}): WheelInputEvent {
  return {
    deltaX: 0,
    deltaY: 0,
    deltaZ: 0,
    clientX: 0,
    clientY: 0,
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
}

describe('PanningDirective (wheel)', () => {
  let directive: PanningDirective;
  let emit: ReturnType<typeof vi.fn>;
  let withPrimaryModifier: ReturnType<typeof vi.fn>;
  let isPanning: ReturnType<typeof vi.fn>;
  let viewportPanningEnabled = true;

  beforeEach(() => {
    emit = vi.fn();
    withPrimaryModifier = vi.fn().mockReturnValue(false);
    isPanning = vi.fn().mockReturnValue(false);
    viewportPanningEnabled = true;

    const mockRouter = {
      getBaseEvent: () => ({
        id: 'id',
        timestamp: 0,
        modifiers: { primary: false, secondary: false, shift: false, meta: false },
      }),
      emit,
      eventGuards: {
        withPrimaryModifier,
        withPrimaryButton: vi.fn().mockReturnValue(true),
      },
    };

    const mockDiagramService = {
      config: () => ({ viewportPanningEnabled }),
    };

    const mockFlowCoreProvider = {
      provide: () => ({ actionStateManager: { isPanning } }),
    };

    TestBed.configureTestingModule({
      providers: [
        PanningDirective,
        { provide: InputEventsRouterService, useValue: mockRouter },
        { provide: NgDiagramService, useValue: mockDiagramService },
        { provide: FlowCoreProviderService, useValue: mockFlowCoreProvider },
        { provide: ElementRef, useValue: new ElementRef(document.createElement('div')) },
      ],
    });

    directive = TestBed.inject(PanningDirective);
  });

  describe('shouldHandleWheel gating', () => {
    it('skips events when viewport panning is disabled', () => {
      viewportPanningEnabled = false;
      directive.onWheel(makeWheelEvent({ deltaY: 10 }));
      expect(emit).not.toHaveBeenCalled();
    });

    it('skips events already marked zoomingHandled', () => {
      directive.onWheel(makeWheelEvent({ deltaY: 10, zoomingHandled: true }));
      expect(emit).not.toHaveBeenCalled();
    });

    it('skips events with the primary modifier (would be a zoom shortcut)', () => {
      withPrimaryModifier.mockReturnValue(true);
      directive.onWheel(makeWheelEvent({ deltaY: 10 }));
      expect(emit).not.toHaveBeenCalled();
    });

    it('skips ctrlKey events (those are pinch-zooms)', () => {
      directive.onWheel(makeWheelEvent({ deltaY: 10, ctrlKey: true }));
      expect(emit).not.toHaveBeenCalled();
    });

    it('emits wheelPanning when all gates pass', () => {
      directive.onWheel(makeWheelEvent({ deltaY: 10 }));
      expect(emit).toHaveBeenCalledOnce();
      expect(emit.mock.calls[0][0].name).toBe('wheelPanning');
    });

    it('keeps panning during the inertia tail even when modifiers are now pressed', () => {
      // Mac trackpad flick: pan gesture already in flight, then user presses
      // Cmd/Ctrl mid-inertia. Without the override these events would either
      // get dropped (modifier present) or misrouted as zoom.
      isPanning.mockReturnValue(true);

      directive.onWheel(makeWheelEvent({ deltaY: 10, metaKey: true }));
      directive.onWheel(makeWheelEvent({ deltaY: 5, ctrlKey: true }));

      expect(emit).toHaveBeenCalledTimes(2);
      expect(emit.mock.calls[0][0].name).toBe('wheelPanning');
      expect(emit.mock.calls[1][0].name).toBe('wheelPanning');
    });

    it('still respects viewportPanningEnabled and zoomingHandled during inertia', () => {
      isPanning.mockReturnValue(true);
      viewportPanningEnabled = false;

      directive.onWheel(makeWheelEvent({ deltaY: 10 }));
      expect(emit).not.toHaveBeenCalled();

      viewportPanningEnabled = true;
      directive.onWheel(makeWheelEvent({ deltaY: 10, zoomingHandled: true }));
      expect(emit).not.toHaveBeenCalled();
    });
  });

  describe('shift+wheel horizontal-pan swap', () => {
    it('passes deltas through when shift is not held', () => {
      directive.onWheel(makeWheelEvent({ deltaX: 0, deltaY: 50 }));
      expect(emit.mock.calls[0][0]).toMatchObject({ deltaX: 0, deltaY: 50 });
    });

    it('swaps deltaY → deltaX when shift is held and the browser did not swap (Safari case)', () => {
      directive.onWheel(makeWheelEvent({ deltaX: 0, deltaY: 50, shiftKey: true }));
      expect(emit.mock.calls[0][0]).toMatchObject({ deltaX: 50, deltaY: 0 });
    });

    it('does not double-swap when the browser already swapped (Chrome/Firefox on Mac)', () => {
      directive.onWheel(makeWheelEvent({ deltaX: 50, deltaY: 0, shiftKey: true }));
      expect(emit.mock.calls[0][0]).toMatchObject({ deltaX: 50, deltaY: 0 });
    });

    it('preserves hardware deltaX when shift is held with a diagonal/trackpad input', () => {
      directive.onWheel(makeWheelEvent({ deltaX: 3, deltaY: 7, shiftKey: true }));
      expect(emit.mock.calls[0][0]).toMatchObject({ deltaX: 3, deltaY: 7 });
    });
  });
});
