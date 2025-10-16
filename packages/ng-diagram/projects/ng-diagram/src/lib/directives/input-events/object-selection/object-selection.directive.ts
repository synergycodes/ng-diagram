import { Directive, HostListener, inject, input } from '@angular/core';
import type { BasePointerInputEvent, Edge, Node } from '../../../../core/src';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import type { PointerInputEvent } from '../../../types';

@Directive()
abstract class ObjectSelectionDirective {
  private readonly inputEventsRouter = inject(InputEventsRouterService);

  targetData = input.required<Node | Edge | undefined>();
  abstract targetType: BasePointerInputEvent['targetType'];

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerInputEvent) {
    if (!this.inputEventsRouter.eventGuards.withPrimaryButton(event)) {
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

@Directive({ standalone: true })
export class DiagramSelectionDirective extends ObjectSelectionDirective {
  targetType: BasePointerInputEvent['targetType'] = 'diagram';
  override readonly targetData = input<Node | Edge | undefined>();
}

@Directive({ standalone: true })
export class EdgeSelectionDirective extends ObjectSelectionDirective {
  targetType: BasePointerInputEvent['targetType'] = 'edge';
  override readonly targetData = input.required<Node | Edge | undefined>();
}

@Directive({ standalone: true })
export class NodeSelectionDirective extends ObjectSelectionDirective {
  targetType: BasePointerInputEvent['targetType'] = 'node';
  override readonly targetData = input.required<Node | Edge | undefined>();
}
