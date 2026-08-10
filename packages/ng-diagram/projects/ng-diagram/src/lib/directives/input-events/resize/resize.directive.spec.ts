import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Node } from '../../../../core/src';
import { FlowCoreProviderService } from '../../../services';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { TouchEventsStateService } from '../../../services/touch-events-state-service/touch-events-state-service.service';
import { DiagramEventName, type PointerInputEvent } from '../../../types/pointer-event';
import { ResizeDirective } from './resize.directive';

@Component({
  template: `<div ngDiagramResize direction="bottom-right" [targetData]="node"></div>`,
  standalone: true,
  imports: [ResizeDirective],
})
class HostComponent {
  node = { id: 'n1', type: 'node', position: { x: 0, y: 0 }, data: {} } as Node;
}

function makePointerEvent(overrides: Partial<PointerInputEvent> = {}): PointerInputEvent {
  return {
    clientX: 10,
    clientY: 10,
    boxSelectionHandled: false,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...overrides,
  } as unknown as PointerInputEvent;
}

describe('ResizeDirective (shared touch marker ownership)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let directive: ResizeDirective;
  let touchState: TouchEventsStateService;
  let clearResize: ReturnType<typeof vi.fn>;
  let registerInteractionCleanup: ReturnType<typeof vi.fn>;
  let unregister: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clearResize = vi.fn();
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
        actionStateManager: { clearResize },
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
    directive = fixture.debugElement.query(By.directive(ResizeDirective)).injector.get(ResizeDirective);
    touchState = TestBed.inject(TouchEventsStateService);
  });

  it('clears the shared touch marker on normal pointerup', () => {
    directive.onPointerDown(makePointerEvent());
    expect(touchState.currentEvent()).toBe(DiagramEventName.Resize);

    directive.onPointerUp(makePointerEvent() as unknown as PointerEvent);

    expect(touchState.currentEvent()).toBeNull();
  });

  it('leaves a marker owned by another gesture alone when destroyed as a bystander', () => {
    // Simulates virtualization destroying this node's component during a touch pan
    touchState.currentEvent.set(DiagramEventName.Panning);

    fixture.destroy();

    expect(touchState.currentEvent()).toBe(DiagramEventName.Panning);
    expect(clearResize).not.toHaveBeenCalled();
  });

  it('clears its own marker and the resize state when destroyed mid-gesture', () => {
    directive.onPointerDown(makePointerEvent());

    fixture.destroy();

    expect(touchState.currentEvent()).toBeNull();
    expect(clearResize).toHaveBeenCalled();
  });

  it('unregisters its interaction cleanup on normal pointerup', () => {
    directive.onPointerDown(makePointerEvent());
    expect(unregister).not.toHaveBeenCalled();

    directive.onPointerUp(makePointerEvent() as unknown as PointerEvent);

    // A lingering registration would make hasActiveInteraction() true forever
    // and swallow every subsequent Escape press
    expect(unregister).toHaveBeenCalledTimes(1);
  });

  it('does not re-register the cleanup on a second pointerdown mid-gesture', () => {
    directive.onPointerDown(makePointerEvent());
    directive.onPointerDown(makePointerEvent());

    expect(registerInteractionCleanup).toHaveBeenCalledTimes(1);
  });

  it('ends a takeover with the gesture own last point, not the foreign move coordinates', () => {
    const router = TestBed.inject(InputEventsRouterService) as unknown as { emit: ReturnType<typeof vi.fn> };
    directive.onPointerDown(makePointerEvent({ clientX: 10, clientY: 10 }));
    directive.onPointerMove(makePointerEvent({ clientX: 20, clientY: 25 }) as unknown as PointerEvent);

    // A two-finger pan takes over mid-resize; the second finger's move must not
    // become the final resize point (it would be applied as geometry by the handler)
    touchState.currentEvent.set(DiagramEventName.Panning);
    directive.onPointerMove(makePointerEvent({ clientX: 300, clientY: 400 }) as unknown as PointerEvent);

    const end = router.emit.mock.calls.map((call) => call[0]).find((event) => event.phase === 'end');
    expect(end?.lastInputPoint).toEqual({ x: 20, y: 25 });
  });
});
