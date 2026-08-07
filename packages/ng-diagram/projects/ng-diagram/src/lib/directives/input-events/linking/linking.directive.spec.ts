import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCoreProviderService } from '../../../services';
import { LinkingEventService } from '../../../services/input-events/linking-event.service';
import { TouchEventsStateService } from '../../../services/touch-events-state-service/touch-events-state-service.service';
import { DiagramEventName, type PointerInputEvent } from '../../../types';
import { LinkingInputDirective } from './linking.directive';

@Component({
  template: `<div ngDiagramLinkingInput portId="p1"></div>`,
  standalone: true,
  imports: [LinkingInputDirective],
})
class HostComponent {}

function makePointerEvent(overrides: Partial<PointerInputEvent> = {}): PointerInputEvent {
  return {
    clientX: 10,
    clientY: 10,
    boxSelectionHandled: false,
    ...overrides,
  } as unknown as PointerInputEvent;
}

describe('LinkingInputDirective (shared touch marker ownership)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let directive: LinkingInputDirective;
  let touchState: TouchEventsStateService;
  let clearLinking: ReturnType<typeof vi.fn>;
  let registerInteractionCleanup: ReturnType<typeof vi.fn>;
  let unregister: ReturnType<typeof vi.fn>;
  let linkingEventService: {
    emitStart: ReturnType<typeof vi.fn>;
    emitContinue: ReturnType<typeof vi.fn>;
    emitEnd: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    clearLinking = vi.fn();
    unregister = vi.fn();
    registerInteractionCleanup = vi.fn().mockReturnValue(unregister);

    linkingEventService = {
      emitStart: vi.fn(),
      emitContinue: vi.fn(),
      emitEnd: vi.fn(),
    };
    const mockLinkingEventService = linkingEventService;
    const mockFlowCoreProvider = {
      isInitialized: () => true,
      provide: () => ({
        actionStateManager: { clearLinking, isLinking: () => false },
        registerInteractionCleanup,
      }),
    };

    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: FlowCoreProviderService, useValue: mockFlowCoreProvider }, TouchEventsStateService],
    });
    // LinkingEventService is a directive-level provider — override it there
    TestBed.overrideProvider(LinkingEventService, { useValue: mockLinkingEventService });

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    directive = fixture.debugElement.query(By.directive(LinkingInputDirective)).injector.get(LinkingInputDirective);
    touchState = TestBed.inject(TouchEventsStateService);
  });

  it('leaves a marker owned by another gesture alone when destroyed as a bystander', () => {
    // Simulates virtualization destroying this port's component during a touch pan
    touchState.currentEvent.set(DiagramEventName.Panning);

    fixture.destroy();

    expect(touchState.currentEvent()).toBe(DiagramEventName.Panning);
    expect(clearLinking).not.toHaveBeenCalled();
  });

  it('clears the shared touch marker on normal pointerup', () => {
    directive.onPointerDown(makePointerEvent());
    expect(touchState.currentEvent()).toBe(DiagramEventName.Linking);

    directive.onPointerUp(makePointerEvent());

    expect(touchState.currentEvent()).toBeNull();
    expect(unregister).toHaveBeenCalledTimes(1);
  });

  it('clears its own marker and the linking state when destroyed mid-gesture', () => {
    directive.onPointerDown(makePointerEvent());

    fixture.destroy();

    expect(touchState.currentEvent()).toBeNull();
    expect(clearLinking).toHaveBeenCalled();
  });

  it('does not re-register the cleanup on a second pointerdown mid-gesture', () => {
    directive.onPointerDown(makePointerEvent());
    directive.onPointerDown(makePointerEvent());

    expect(registerInteractionCleanup).toHaveBeenCalledTimes(1);
  });

  it('cancels the linking on a takeover instead of finishing at the foreign point', () => {
    directive.onPointerDown(makePointerEvent({ clientX: 10, clientY: 10 }));

    // A two-finger pan takes over mid-linking; the second finger's move must
    // end the gesture as taken over, not as a finish at its coordinates
    touchState.currentEvent.set(DiagramEventName.Panning);
    directive.onPointerMove(makePointerEvent({ clientX: 300, clientY: 400 }));

    expect(linkingEventService.emitEnd).toHaveBeenCalledWith(expect.anything(), undefined, 'p1', true);
  });
});
