import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Edge } from '../../../core/src';
import { PointerInputEvent } from '../../types';
import { FlowCoreProviderService } from '../flow-core-provider/flow-core-provider.service';
import { TouchEventsStateService } from '../touch-events-state-service/touch-events-state-service.service';
import { RelinkingEventService } from './relinking-event.service';
import { RelinkingGestureService } from './relinking-gesture.service';

describe('RelinkingGestureService', () => {
  let service: RelinkingGestureService;
  let emitStart: ReturnType<typeof vi.fn>;
  let emitContinue: ReturnType<typeof vi.fn>;
  let emitEnd: ReturnType<typeof vi.fn>;
  let cancelActiveInteraction: ReturnType<typeof vi.fn>;
  let registerInteractionCleanup: ReturnType<typeof vi.fn>;
  let isLinking: ReturnType<typeof vi.fn>;
  let isCancellingInteraction: ReturnType<typeof vi.fn>;
  let panningHandled: ReturnType<typeof vi.fn>;
  let zoomingHandled: ReturnType<typeof vi.fn>;
  let edgeRelinkingConfig: { enabled: boolean };

  const edge: Edge = { id: 'edge-1', source: 'node-a', target: 'node-b', data: {} };

  const pointerDownEvent = (overrides: Partial<PointerInputEvent> = {}): PointerInputEvent =>
    ({ pointerId: 1, clientX: 0, clientY: 0, button: 0, ...overrides }) as PointerInputEvent;

  /** Dispatches a document-level pointer event (jsdom-safe plain Event with pointer fields). */
  const dispatch = (
    type: 'pointermove' | 'pointerup' | 'pointercancel',
    init: { pointerId?: number; clientX?: number; clientY?: number; button?: number } = {}
  ) => {
    const event = new Event(type);
    Object.assign(event, { pointerId: 1, clientX: 0, clientY: 0, button: 0, ...init });
    document.dispatchEvent(event);
  };

  beforeEach(() => {
    emitStart = vi.fn();
    emitContinue = vi.fn();
    emitEnd = vi.fn();
    cancelActiveInteraction = vi.fn();
    registerInteractionCleanup = vi.fn().mockReturnValue(vi.fn());
    isLinking = vi.fn().mockReturnValue(false);
    isCancellingInteraction = vi.fn().mockReturnValue(false);
    panningHandled = vi.fn().mockReturnValue(false);
    zoomingHandled = vi.fn().mockReturnValue(false);
    edgeRelinkingConfig = { enabled: true };

    const mockFlowCore = {
      actionStateManager: { isLinking },
      isCancellingInteraction,
      registerInteractionCleanup,
      cancelActiveInteraction,
      get config() {
        return {
          edgeRelinking: edgeRelinkingConfig,
          linking: { edgePanningEnabled: false, edgePanningThreshold: 0, edgePanningForce: 0 },
        };
      },
    };

    TestBed.configureTestingModule({
      providers: [
        RelinkingGestureService,
        { provide: RelinkingEventService, useValue: { emitStart, emitContinue, emitEnd } },
        {
          provide: FlowCoreProviderService,
          useValue: { isInitialized: () => true, provide: () => mockFlowCore },
        },
        {
          provide: TouchEventsStateService,
          useValue: {
            panningHandled,
            zoomingHandled,
            currentEvent: { set: vi.fn() },
            clearCurrentEvent: vi.fn(),
          },
        },
      ],
    });

    service = TestBed.inject(RelinkingGestureService);
  });

  afterEach(() => {
    // Make sure no document listeners leak between tests.
    service.ngOnDestroy();
  });

  describe('beginRelink refusals', () => {
    it('should return false when edge relinking is disabled', () => {
      edgeRelinkingConfig.enabled = false;

      expect(service.beginRelink(pointerDownEvent(), edge, 'target')).toBe(false);

      dispatch('pointermove', { clientX: 100 });
      expect(emitStart).not.toHaveBeenCalled();
    });

    it('should return false when a gesture is already active', () => {
      expect(service.beginRelink(pointerDownEvent(), edge, 'target')).toBe(true);
      expect(service.beginRelink(pointerDownEvent({ pointerId: 2 }), edge, 'target')).toBe(false);
    });

    it('should return false when a linking gesture is already in progress', () => {
      isLinking.mockReturnValue(true);

      expect(service.beginRelink(pointerDownEvent(), edge, 'target')).toBe(false);
    });

    it('should return false when the pointerdown was claimed by box selection', () => {
      expect(service.beginRelink(pointerDownEvent({ boxSelectionHandled: true }), edge, 'target')).toBe(false);
    });

    it('should return false while an interaction cancel is rolling back', () => {
      isCancellingInteraction.mockReturnValue(true);

      expect(service.beginRelink(pointerDownEvent(), edge, 'target')).toBe(false);
    });
  });

  describe('movement threshold', () => {
    it('should emit nothing on pointerdown alone', () => {
      service.beginRelink(pointerDownEvent(), edge, 'target');

      expect(emitStart).not.toHaveBeenCalled();
      expect(emitContinue).not.toHaveBeenCalled();
      expect(service.active()).toBe(false);
    });

    it('should emit nothing and remove listeners on a pointerup within the threshold', () => {
      service.beginRelink(pointerDownEvent(), edge, 'target');

      dispatch('pointermove', { clientX: 2 });
      dispatch('pointerup');

      // A plain click on an endpoint handle is not a relink.
      expect(emitStart).not.toHaveBeenCalled();
      expect(emitContinue).not.toHaveBeenCalled();
      expect(emitEnd).not.toHaveBeenCalled();

      // Listeners are gone — later pointer traffic emits nothing.
      dispatch('pointermove', { clientX: 100 });
      expect(emitStart).not.toHaveBeenCalled();

      // The gesture slot is released — a new relink can be claimed.
      expect(service.beginRelink(pointerDownEvent(), edge, 'target')).toBe(true);
    });

    it('should emit start once, then continue, after the pointer travels beyond the threshold', () => {
      service.beginRelink(pointerDownEvent(), edge, 'target');

      dispatch('pointermove', { clientX: 10 });

      expect(emitStart).toHaveBeenCalledTimes(1);
      expect(emitStart).toHaveBeenCalledWith(expect.anything(), edge, 'target');
      expect(emitContinue).toHaveBeenCalledTimes(1);

      dispatch('pointermove', { clientX: 20 });

      expect(emitStart).toHaveBeenCalledTimes(1);
      expect(emitContinue).toHaveBeenCalledTimes(2);
    });
  });

  describe('pointerup filtering', () => {
    beforeEach(() => {
      service.beginRelink(pointerDownEvent(), edge, 'target');
      dispatch('pointermove', { clientX: 10 });
    });

    it('should ignore a pointerup from a different pointer', () => {
      dispatch('pointerup', { pointerId: 2 });

      expect(emitEnd).not.toHaveBeenCalled();
      expect(service.active()).toBe(true);
    });

    it('should ignore a pointerup of a non-primary button', () => {
      dispatch('pointerup', { button: 2 });

      expect(emitEnd).not.toHaveBeenCalled();
      expect(service.active()).toBe(true);
    });

    it('should finish the relink on the gesture pointer releasing the primary button', () => {
      dispatch('pointerup', { clientX: 10 });

      expect(emitEnd).toHaveBeenCalledTimes(1);
      expect(emitEnd).toHaveBeenCalledWith(expect.anything(), edge, 'target', false);
      expect(service.active()).toBe(false);
    });
  });

  it('should abort with takenOver on pointercancel after the gesture started', () => {
    service.beginRelink(pointerDownEvent(), edge, 'target');
    dispatch('pointermove', { clientX: 10 });

    dispatch('pointercancel');

    expect(emitEnd).toHaveBeenCalledTimes(1);
    expect(emitEnd).toHaveBeenCalledWith(expect.anything(), edge, 'target', true);
    expect(service.active()).toBe(false);
  });

  it('should not emit end on pointercancel before the threshold was crossed', () => {
    service.beginRelink(pointerDownEvent(), edge, 'target');

    dispatch('pointercancel');

    expect(emitEnd).not.toHaveBeenCalled();
  });

  describe('ngOnDestroy', () => {
    it('should remove the document listeners so later pointer traffic emits nothing', () => {
      service.beginRelink(pointerDownEvent(), edge, 'target');
      dispatch('pointermove', { clientX: 10 });
      expect(emitStart).toHaveBeenCalledTimes(1);

      service.ngOnDestroy();

      dispatch('pointermove', { clientX: 30 });
      dispatch('pointerup');
      expect(emitContinue).toHaveBeenCalledTimes(1);
      expect(emitEnd).not.toHaveBeenCalled();
    });

    it('should cancel the active interaction when destroyed mid-gesture', () => {
      service.beginRelink(pointerDownEvent(), edge, 'target');
      dispatch('pointermove', { clientX: 10 });

      service.ngOnDestroy();

      // The pointerup will never be routed — the core linking state must not
      // stay claimed.
      expect(cancelActiveInteraction).toHaveBeenCalledTimes(1);
    });

    it('should not cancel anything when destroyed before the gesture started', () => {
      service.beginRelink(pointerDownEvent(), edge, 'target');

      service.ngOnDestroy();

      expect(cancelActiveInteraction).not.toHaveBeenCalled();
    });
  });

  describe('active signal', () => {
    it('should be true only between crossing the threshold and the pointerup', () => {
      expect(service.active()).toBe(false);

      service.beginRelink(pointerDownEvent(), edge, 'target');
      expect(service.active()).toBe(false);

      dispatch('pointermove', { clientX: 2 });
      expect(service.active()).toBe(false);

      dispatch('pointermove', { clientX: 10 });
      expect(service.active()).toBe(true);

      dispatch('pointerup', { clientX: 10 });
      expect(service.active()).toBe(false);
    });
  });
});
