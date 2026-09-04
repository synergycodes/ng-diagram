import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CursorPositionTrackerService } from '../../../services/cursor-position-tracker/cursor-position-tracker.service';
import { FlowCoreProviderService } from '../../../services/flow-core-provider/flow-core-provider.service';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { KeyboardInputsDirective } from './keyboard-inputs.directive';

@Component({
  template: `<div ngDiagramKeyboardInputs><button>inside</button></div>`,
  imports: [KeyboardInputsDirective],
})
class HostComponent {}

@Component({
  // NgDiagramComponent drives this attribute from its `tabbable` input; a static template
  // attribute reproduces it here, because template attributes beat a directive host attribute
  template: `<div ngDiagramKeyboardInputs tabindex="-1"><button>inside</button></div>`,
  imports: [KeyboardInputsDirective],
})
class UntabbableHostComponent {}

describe('KeyboardInputsDirective', () => {
  let emit: ReturnType<typeof vi.fn>;
  let match: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    emit = vi.fn();
    match = vi.fn().mockReturnValue([{ actionName: 'deleteSelection' }]);

    const mockRouter = {
      getBaseEvent: () => ({
        id: 'id',
        timestamp: 0,
        modifiers: { primary: false, secondary: false, shift: false, meta: false },
      }),
      emit,
      hasHandler: vi.fn().mockReturnValue(true),
    };

    const mockFlowCoreProvider = {
      provide: () => ({
        shortcutManager: { match },
        hasActiveInteraction: vi.fn().mockReturnValue(false),
        // Disabled so PanningAction/MovingAction short-circuit without model access
        config: { viewportPanningEnabled: false, nodeDraggingEnabled: false },
        modelLookup: { getSelectedNodes: vi.fn().mockReturnValue([]) },
      }),
    };

    TestBed.configureTestingModule({
      imports: [HostComponent, UntabbableHostComponent],
      providers: [
        { provide: InputEventsRouterService, useValue: mockRouter },
        { provide: FlowCoreProviderService, useValue: mockFlowCoreProvider },
        CursorPositionTrackerService,
      ],
    });
  });

  function createHost(): {
    fixture: ComponentFixture<HostComponent>;
    hostElement: HTMLElement;
    innerButton: HTMLButtonElement;
  } {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const hostElement = fixture.nativeElement.querySelector('div') as HTMLElement;
    const innerButton = hostElement.querySelector('button') as HTMLButtonElement;
    return { fixture, hostElement, innerButton };
  }

  it('makes the host focusable so shortcuts have somewhere to land', () => {
    const { hostElement } = createHost();

    expect(hostElement.getAttribute('tabindex')).toBe('0');
  });

  describe('focus handling', () => {
    it('grabs focus on pointerdown (click-to-focus)', () => {
      const { hostElement } = createHost();

      // jsdom has no PointerEvent; the capture-phase listener only needs the event type
      hostElement.dispatchEvent(new Event('pointerdown', { bubbles: true }));

      expect(document.activeElement).toBe(hostElement);
    });

    it('grabs focus even when an inner handler stops pointerdown propagation', () => {
      const { hostElement, innerButton } = createHost();
      // Mirrors the resize handle: a bubble-phase grab would never see this event
      innerButton.addEventListener('pointerdown', (event) => event.stopPropagation());

      innerButton.dispatchEvent(new Event('pointerdown', { bubbles: true }));

      expect(document.activeElement).toBe(hostElement);
    });
  });

  describe('shortcut routing', () => {
    it('routes a matched shortcut when focus is inside the host', () => {
      const { innerButton } = createHost();

      innerButton.focus();
      innerButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));

      expect(match).toHaveBeenCalledWith({ key: 'Delete', modifiers: expect.anything() });
      expect(emit).toHaveBeenCalledOnce();
      expect(emit.mock.calls[0][0].name).toBe('deleteSelection');
    });

    it('ignores shortcuts when focus is outside the host', () => {
      createHost();

      const outsideButton = document.createElement('button');
      document.body.appendChild(outsideButton);
      try {
        outsideButton.focus();
        outsideButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));

        expect(emit).not.toHaveBeenCalled();
      } finally {
        outsideButton.remove();
      }
    });
  });

  describe('when the host is not tabbable', () => {
    function createUntabbableHost(): HTMLElement {
      const fixture = TestBed.createComponent(UntabbableHostComponent);
      fixture.detectChanges();
      return fixture.nativeElement.querySelector('div') as HTMLElement;
    }

    it('is skipped by Tab', () => {
      expect(createUntabbableHost().getAttribute('tabindex')).toBe('-1');
    });

    it('still grabs focus on pointerdown, the only way in once Tab is gone', () => {
      const hostElement = createUntabbableHost();

      hostElement.dispatchEvent(new Event('pointerdown', { bubbles: true }));

      expect(document.activeElement).toBe(hostElement);
    });

    it('still routes shortcuts once it holds focus', () => {
      const hostElement = createUntabbableHost();
      hostElement.dispatchEvent(new Event('pointerdown', { bubbles: true }));

      hostElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));

      expect(emit).toHaveBeenCalledOnce();
      expect(emit.mock.calls[0][0].name).toBe('deleteSelection');
    });
  });
});
