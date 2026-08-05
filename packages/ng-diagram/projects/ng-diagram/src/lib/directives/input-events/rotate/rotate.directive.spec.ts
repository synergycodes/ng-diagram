import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCoreProviderService } from '../../../services';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { TouchEventsStateService } from '../../../services/touch-events-state-service/touch-events-state-service.service';
import { DiagramEventName, type PointerInputEvent } from '../../../types';
import { RotateHandleDirective } from './rotate.directive';

function makePointerEvent(overrides: Partial<PointerInputEvent> = {}): PointerInputEvent {
  return {
    clientX: 10,
    clientY: 10,
    boxSelectionHandled: false,
    ...overrides,
  } as unknown as PointerInputEvent;
}

describe('RotateHandleDirective (shared touch marker ownership)', () => {
  let directive: RotateHandleDirective;
  let touchState: TouchEventsStateService;
  let clearRotation: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clearRotation = vi.fn();

    const mockRouter = {
      getBaseEvent: () => ({
        id: 'id',
        timestamp: 0,
        modifiers: { primary: false, secondary: false, shift: false, meta: false },
      }),
      emit: vi.fn(),
    };
    const mockFlowCoreProvider = {
      isInitialized: () => true,
      provide: () => ({
        actionStateManager: { clearRotation },
        registerInteractionCleanup: vi.fn().mockReturnValue(vi.fn()),
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        RotateHandleDirective,
        { provide: InputEventsRouterService, useValue: mockRouter },
        { provide: FlowCoreProviderService, useValue: mockFlowCoreProvider },
        TouchEventsStateService,
      ],
    });

    directive = TestBed.inject(RotateHandleDirective);
    touchState = TestBed.inject(TouchEventsStateService);
  });

  it('leaves a marker owned by another gesture alone when destroyed as a bystander', () => {
    // Simulates virtualization destroying this handle's component during a touch pan
    touchState.currentEvent.set(DiagramEventName.Panning);

    directive.ngOnDestroy();

    expect(touchState.currentEvent()).toBe(DiagramEventName.Panning);
    expect(clearRotation).not.toHaveBeenCalled();
  });

  it('clears its own marker and the rotation state when destroyed mid-gesture', () => {
    directive.onPointerDown(makePointerEvent());
    expect(touchState.currentEvent()).toBe(DiagramEventName.Rotate);

    directive.ngOnDestroy();

    expect(touchState.currentEvent()).toBeNull();
    expect(clearRotation).toHaveBeenCalled();
  });
});
