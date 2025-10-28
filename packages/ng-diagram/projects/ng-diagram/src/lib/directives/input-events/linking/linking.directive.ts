import { Directive, inject, input, OnDestroy, signal } from '@angular/core';
import { Node } from '../../../../core/src';
import { FlowCoreProviderService } from '../../../services';
import { LinkingEventService } from '../../../services/input-events/linking-event.service';
import { PointerInputEvent } from '../../../types';
import { BoxSelectionDirective } from '../box-selection/box-selection.directive';

@Directive({
  selector: '[ngDiagramLinkingInput]',
  standalone: true,
  host: {
    '(pointerdown)': 'onPointerDown($event)',
  },
  providers: [LinkingEventService],
})
export class LinkingInputDirective implements OnDestroy {
  private readonly linkingEventService = inject(LinkingEventService);
  private readonly flowCoreProviderService = inject(FlowCoreProviderService);

  private target = signal<Node | undefined>(undefined);

  portId = input.required<string>();

  ngOnDestroy(): void {
    this.cleanup();
  }

  setTargetNode(node: Node) {
    this.target.set(node);
  }

  onPointerDown($event: PointerInputEvent) {
    if (this.flowCoreProviderService.provide().actionStateManager.isLinking()) {
      this.target.set(undefined);
      return;
    }

    if (BoxSelectionDirective.isBoxSelectionActive || $event.shiftKey) {
      return;
    }

    $event.linkingHandled = true;

    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);

    this.linkingEventService.emitStart($event, this.target(), this.portId());
  }

  onPointerMove = ($event: PointerInputEvent) => {
    this.linkingEventService.emitContinue($event, this.target(), this.portId());
  };

  onPointerUp = ($event: PointerInputEvent) => {
    this.linkingEventService.emitEnd($event, this.target(), this.portId());
    this.cleanup();
  };

  private cleanup() {
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
  }
}
