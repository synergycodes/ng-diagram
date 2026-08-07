import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Node } from '../../../../core/src';
import { FlowCoreProviderService } from '../../../services';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { TouchEventsStateService } from '../../../services/touch-events-state-service/touch-events-state-service.service';
import { DiagramEventName, type PointerInputEvent } from '../../../types';
import { RotateHandleDirective } from './rotate.directive';

@Component({
  template: `<div ngDiagramRotateHandle [targetData]="node"></div>`,
  standalone: true,
  imports: [RotateHandleDirective],
})
class HostComponent {
  node = { id: 'n1', type: 'node', position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, data: {} } as Node;
}

function makePointerEvent(overrides: Partial<PointerInputEvent> = {}): PointerInputEvent {
  return {
    clientX: 10,
    clientY: 10,
    boxSelectionHandled: false,
    ...overrides,
  } as unknown as PointerInputEvent;
}

describe('RotateHandleDirective (shared touch marker ownership)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let directive: RotateHandleDirective;
  let touchState: TouchEventsStateService;
  let clearRotation: ReturnType<typeof vi.fn>;
  let registerInteractionCleanup: ReturnType<typeof vi.fn>;
  let unregister: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clearRotation = vi.fn();
    unregister = vi.fn();
    registerInteractionCleanup = vi.fn().mockReturnValue(unregister);

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
        registerInteractionCleanup,
      }),
    };

    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        { provide: InputEventsRouterService, useValue: mockRouter },
        { provide: FlowCoreProviderService, useValue: mockFlowCoreProvider },
        TouchEventsStateService,
      ],
    });

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    directive = fixture.debugElement.query(By.directive(RotateHandleDirective)).injector.get(RotateHandleDirective);
    touchState = TestBed.inject(TouchEventsStateService);
  });

  it('leaves a marker owned by another gesture alone when destroyed as a bystander', () => {
    // Simulates virtualization destroying this handle's component during a touch pan
    touchState.currentEvent.set(DiagramEventName.Panning);

    fixture.destroy();

    expect(touchState.currentEvent()).toBe(DiagramEventName.Panning);
    expect(clearRotation).not.toHaveBeenCalled();
  });

  it('clears the shared touch marker on normal pointerup', () => {
    directive.onPointerDown(makePointerEvent());
    expect(touchState.currentEvent()).toBe(DiagramEventName.Rotate);

    directive.onPointerUp(makePointerEvent());

    expect(touchState.currentEvent()).toBeNull();
    expect(unregister).toHaveBeenCalledTimes(1);
  });

  it('clears its own marker and the rotation state when destroyed mid-gesture', () => {
    directive.onPointerDown(makePointerEvent());
    expect(touchState.currentEvent()).toBe(DiagramEventName.Rotate);

    fixture.destroy();

    expect(touchState.currentEvent()).toBeNull();
    expect(clearRotation).toHaveBeenCalled();
  });

  it('does not re-register the cleanup on a second pointerdown mid-gesture', () => {
    directive.onPointerDown(makePointerEvent());
    directive.onPointerDown(makePointerEvent());

    expect(registerInteractionCleanup).toHaveBeenCalledTimes(1);
  });

  it('ends a takeover with the gesture own last point, not the foreign move coordinates', () => {
    const router = TestBed.inject(InputEventsRouterService) as unknown as { emit: ReturnType<typeof vi.fn> };
    directive.onPointerDown(makePointerEvent({ clientX: 10, clientY: 10 }));
    directive.onPointerMove(makePointerEvent({ clientX: 20, clientY: 25 }));

    // A two-finger pan takes over mid-rotation; the second finger's move must not
    // become the final rotation point (it would be applied as an angle by the handler)
    touchState.currentEvent.set(DiagramEventName.Panning);
    directive.onPointerMove(makePointerEvent({ clientX: 300, clientY: 400 }));

    const end = router.emit.mock.calls.map((call) => call[0]).find((event) => event.phase === 'end');
    expect(end?.lastInputPoint).toEqual({ x: 20, y: 25 });
  });

  it('ends a pointercancel with the gesture own last point', () => {
    const router = TestBed.inject(InputEventsRouterService) as unknown as { emit: ReturnType<typeof vi.fn> };
    directive.onPointerDown(makePointerEvent({ clientX: 10, clientY: 10 }));
    directive.onPointerMove(makePointerEvent({ clientX: 40, clientY: 45 }));

    // pointercancel may carry stale/zero coordinates — they must not become the final angle
    directive.onPointerCancel(makePointerEvent({ clientX: 0, clientY: 0 }));

    const end = router.emit.mock.calls.map((call) => call[0]).find((event) => event.phase === 'end');
    expect(end?.lastInputPoint).toEqual({ x: 40, y: 45 });
  });
});
