import { Directive, ElementRef, inject } from '@angular/core';

import { InputEventName } from '../../../../core/src';
import { FlowCoreProviderService } from '../../../services/flow-core-provider/flow-core-provider.service';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { KeyboardAction } from './keyboard-actions/keyboard-action.interface';
import { MovingAction } from './keyboard-actions/moving.action';
import { PanningAction } from './keyboard-actions/panning.action';
import { PasteAction } from './keyboard-actions/paste.action';

@Directive({
  selector: '[ngDiagramKeyboardInputs]',
  standalone: true,
  providers: [PanningAction, MovingAction, PasteAction],
  host: {
    '(document:keydown)': 'onKeyDown($event)',
    '(pointerdown)': 'onPointerDown()',
    tabindex: '0',
  },
})
export class KeyboardInputsDirective {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly inputEventsRouter = inject(InputEventsRouterService);
  private readonly keyboardActions: KeyboardAction[] = [
    inject(PanningAction),
    inject(MovingAction),
    inject(PasteAction),
  ];
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  onPointerDown(): void {
    if (!this.elementRef.nativeElement.contains(document.activeElement)) {
      this.elementRef.nativeElement.focus();
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (!this.elementRef.nativeElement.contains(document.activeElement)) {
      return;
    }

    const flowCore = this.flowCoreProvider.provide();
    const baseEvent = this.inputEventsRouter.getBaseEvent(event);

    const shortcuts = flowCore.shortcutManager.match({
      key: event.key,
      modifiers: baseEvent.modifiers,
    });

    if (shortcuts.length === 0 || this.isInputFieldFocused(event)) {
      return;
    }

    event.preventDefault();

    for (const shortcut of shortcuts) {
      const matchingAction = this.keyboardActions.find((action) => action.canHandle(shortcut, flowCore));
      const event = matchingAction && matchingAction.createEvent(shortcut, baseEvent);

      if (event) {
        this.inputEventsRouter.emit(event);
      } else {
        if (this.inputEventsRouter.hasHandler(shortcut.actionName as InputEventName)) {
          this.inputEventsRouter.emit({
            ...baseEvent,
            name: shortcut.actionName as InputEventName,
          });
        }
      }
    }
  }

  private isInputFieldFocused(event: Event): boolean {
    const element = (event.composedPath()[0] || event.target) as Element;
    return element.hasAttribute('contenteditable') || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName);
  }
}
