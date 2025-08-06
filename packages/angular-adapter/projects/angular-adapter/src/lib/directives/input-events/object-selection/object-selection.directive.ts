import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';
import { BasePointerInputEvent, Edge, Node } from '@angularflow/core';
import { BrowserInputsHelpers } from '../../../services/input-events/browser-inputs-helpers';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { PointerInputEvent } from '../../../types';

@Directive()
abstract class ObjectSelectionDirective {
  private readonly inputEventsRouter = inject(InputEventsRouterService);

  targetData = input.required<Node | Edge | undefined>();
  abstract targetType: BasePointerInputEvent['targetType'];

  protected abstract shouldHandle(event: PointerInputEvent): boolean;

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerInputEvent) {
    if (!BrowserInputsHelpers.withPrimaryButton(event) || !this.shouldHandle(event)) {
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
  override readonly targetData = input.required<Node | Edge | undefined>();
  override shouldHandle(): boolean {
    return true;
  }
}

@Directive()
export class EdgeSelectionDirective extends ObjectSelectionDirective {
  targetType: BasePointerInputEvent['targetType'] = 'edge';
  override readonly targetData = input.required<Node | Edge | undefined>();
  override shouldHandle(): boolean {
    return true;
  }
}

@Directive()
export class NodeSelectionDirective extends ObjectSelectionDirective {
  targetType: BasePointerInputEvent['targetType'] = 'node';
  override readonly targetData = input.required<Node | Edge | undefined>();

  private el = inject(ElementRef<HTMLElement>);

  protected override shouldHandle(event: PointerInputEvent): boolean {
    return (event.target as HTMLElement).localName !== this.el.nativeElement.localName;
  }
}
