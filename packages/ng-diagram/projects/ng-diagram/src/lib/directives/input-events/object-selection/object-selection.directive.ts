import { Directive, HostListener, inject, input, type OnDestroy } from '@angular/core';
import type { BasePointerInputEvent, Edge, Node } from '../../../../core/src';
import { FlowCoreProviderService } from '../../../services';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import type { PointerInputEvent } from '../../../types';

@Directive()
abstract class ObjectSelectionDirective implements OnDestroy {
  private readonly inputEventsRouter = inject(InputEventsRouterService);
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  targetData = input.required<Node | Edge | undefined>();
  abstract targetType: BasePointerInputEvent['targetType'];

  ngOnDestroy(): void {
    document.removeEventListener('pointerup', this.onPointerUp);
  }

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerInputEvent) {
    if (!this.shouldHandle(event)) {
      return;
    }

    event.selectHandled = true;

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'select',
      phase: 'start',
      target: this.targetData(),
      targetType: this.targetType,
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
    });

    document.addEventListener('pointerup', this.onPointerUp);
  }

  onPointerUp = (event: PointerEvent): void => {
    document.removeEventListener('pointerup', this.onPointerUp);

    const baseEvent = this.inputEventsRouter.getBaseEvent(event as PointerInputEvent);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'select',
      phase: 'end',
      target: this.targetData(),
      targetType: this.targetType,
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
    });
  };

  private shouldHandle(event: PointerInputEvent) {
    if (!this.inputEventsRouter.eventGuards.withPrimaryButton(event)) {
      return false;
    }
    if (event.boxSelectionHandled || event.selectHandled) {
      return false;
    }
    if (event.linkingHandled && !this.flowCoreProvider.provide().config.linking.selectNodeOnPortPress) {
      return false;
    }
    return true;
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
