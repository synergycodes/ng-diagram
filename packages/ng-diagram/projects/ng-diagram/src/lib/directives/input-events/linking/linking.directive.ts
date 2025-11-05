import { Directive, inject, input, OnDestroy, signal } from '@angular/core';
import { FPS_60, NgDiagramMath, Node, Point } from '../../../../core/src';
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
  private edgePanningInterval: number | null = null;

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
    const { edgePanningThreshold, edgePanningEnabled, edgePanningForce } =
      this.flowCoreProviderService.provide().config.linking;
    const flowCore = this.flowCoreProviderService.provide();

    let panningForce: Point | null = null;
    if (edgePanningEnabled) {
      const { width, height } = flowCore.getViewport();
      const { x, y } = flowCore.getFlowOffset();
      const boundingRect = { x, y, width: width ?? 0, height: height ?? 0 };
      panningForce = NgDiagramMath.calculateEdgePanningForce(
        boundingRect,
        { x: $event.clientX, y: $event.clientY },
        edgePanningThreshold,
        edgePanningForce
      );
      if (panningForce) {
        this.startEdgePanning($event, panningForce);
      } else {
        this.stopEdgePanning();
      }
    }

    this.linkingEventService.emitContinue($event, this.target(), this.portId(), panningForce);
  };

  onPointerUp = ($event: PointerInputEvent) => {
    this.linkingEventService.emitEnd($event, this.target(), this.portId());
    this.cleanup();
  };

  private cleanup() {
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
    this.stopEdgePanning();
  }

  private startEdgePanning($event: PointerInputEvent, panningForce: Point | null): void {
    this.stopEdgePanning();

    this.edgePanningInterval = window.setInterval(() => {
      this.linkingEventService.emitContinue($event, this.target(), this.portId(), panningForce);
    }, FPS_60);
  }

  private stopEdgePanning(): void {
    if (this.edgePanningInterval != null) {
      window.clearInterval(this.edgePanningInterval);
      this.edgePanningInterval = null;
    }
  }
}
