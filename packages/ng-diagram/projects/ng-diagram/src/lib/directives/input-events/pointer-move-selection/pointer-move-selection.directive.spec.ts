import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Node } from '../../../../core/src';
import { NgDiagramComponent } from '../../../components/diagram/ng-diagram.component';
import { FlowCoreProviderService } from '../../../services';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { TouchEventsStateService } from '../../../services/touch-events-state-service/touch-events-state-service.service';
import { DiagramEventName, type PointerInputEvent } from '../../../types/pointer-event';
import { PointerMoveSelectionDirective } from './pointer-move-selection.directive';

@Component({
  template: `<div ngDiagramPointerMoveSelection [targetData]="node"></div>`,
  standalone: true,
  imports: [PointerMoveSelectionDirective],
})
class HostComponent {
  node = { id: 'n1', type: 'node', position: { x: 0, y: 0 }, data: {} } as Node;
}

function makePointerEvent(overrides: Partial<PointerInputEvent> = {}): PointerInputEvent {
  return {
    clientX: 10,
    clientY: 10,
    zoomingHandled: false,
    linkingHandled: false,
    rotateHandled: false,
    boxSelectionHandled: false,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...overrides,
  } as unknown as PointerInputEvent;
}

describe('PointerMoveSelectionDirective (shared touch marker ownership)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let directive: PointerMoveSelectionDirective;
  let touchState: TouchEventsStateService;

  beforeEach(() => {
    const mockRouter = {
      getBaseEvent: () => ({
        id: 'id',
        timestamp: 0,
        modifiers: { primary: false, secondary: false, shift: false, meta: false },
      }),
      emit: vi.fn(),
      eventGuards: {
        withPrimaryButton: vi.fn().mockReturnValue(true),
      },
    };
    const mockFlowCoreProvider = {
      isInitialized: () => true,
      provide: () => ({
        config: { nodeDraggingEnabled: true },
        registerInteractionCleanup: vi.fn().mockReturnValue(vi.fn()),
      }),
    };
    const mockDiagramComponent = {
      getBoundingClientRect: () => ({ left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100 }),
    };

    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        { provide: InputEventsRouterService, useValue: mockRouter },
        { provide: FlowCoreProviderService, useValue: mockFlowCoreProvider },
        { provide: NgDiagramComponent, useValue: mockDiagramComponent },
        TouchEventsStateService,
      ],
    });

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    directive = fixture.debugElement
      .query(By.directive(PointerMoveSelectionDirective))
      .injector.get(PointerMoveSelectionDirective);
    touchState = TestBed.inject(TouchEventsStateService);
  });

  it('clears the shared touch marker on normal pointerup', () => {
    directive.onPointerDown(makePointerEvent());
    expect(touchState.currentEvent()).toBe(DiagramEventName.Move);

    directive.onPointerUp(makePointerEvent() as unknown as PointerEvent);

    expect(touchState.currentEvent()).toBeNull();
  });

  it('leaves a marker owned by another gesture alone when destroyed as a bystander', () => {
    // Simulates virtualization destroying this node's component during a touch pan
    touchState.currentEvent.set(DiagramEventName.Panning);

    fixture.destroy();

    expect(touchState.currentEvent()).toBe(DiagramEventName.Panning);
  });

  it('clears its own marker when destroyed mid-gesture', () => {
    directive.onPointerDown(makePointerEvent());

    fixture.destroy();

    expect(touchState.currentEvent()).toBeNull();
  });
});
