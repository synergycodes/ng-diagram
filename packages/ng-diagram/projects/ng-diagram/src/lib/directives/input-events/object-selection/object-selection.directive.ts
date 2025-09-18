import { Directive, HostListener, inject, input } from '@angular/core';
import { BasePointerInputEvent, Edge, Node } from '../../../../core/src';
import { BrowserInputsHelpers } from '../../../services/input-events/browser-inputs-helpers';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { PointerInputEvent } from '../../../types';

@Directive()
abstract class ObjectSelectionDirective {
  private readonly inputEventsRouter = inject(InputEventsRouterService);

  targetData = input.required<Node | Edge | undefined>();
  abstract targetType: BasePointerInputEvent['targetType'];

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerInputEvent) {
    if (!BrowserInputsHelpers.withPrimaryButton(event)) {
      return;
    }

    // Prevent duplicate select events — without this, selection can toggle unintentionally.
    if (event.selectHandled) {
      return;
    }

    event.selectHandled = true;

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'select',
      target: this.targetData(),
      targetType: this.targetType,
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
    });
  }
}

@Directive()
export class DiagramSelectionDirective extends ObjectSelectionDirective {
  targetType: BasePointerInputEvent['targetType'] = 'diagram';
  override readonly targetData = input<Node | Edge | undefined>();
}

@Directive()
export class EdgeSelectionDirective extends ObjectSelectionDirective {
  targetType: BasePointerInputEvent['targetType'] = 'edge';
  override readonly targetData = input.required<Node | Edge | undefined>();
}

@Directive()
export class NodeSelectionDirective extends ObjectSelectionDirective {
  targetType: BasePointerInputEvent['targetType'] = 'node';
  override readonly targetData = input.required<Node | Edge | undefined>();
}
