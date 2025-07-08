import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Node } from '@angularflow/core';

import {
  NodePositionDirective,
  NodeSelectedDirective,
  NodeSizeDirective,
  PointerDownEventListenerDirective,
  PointerEnterEventListenerDirective,
  PointerLeaveEventListenerDirective,
  PointerUpEventListenerDirective,
  ZIndexDirective,
} from '../../directives';
import { FlowCoreProviderService, UpdatePortsService } from '../../services';
import { NodeResizeAdornmentComponent } from './resize/node-resize-adornment.component';
import { NodeRotateAdornmentComponent } from './rotate/node-rotate-adornment.component';

@Component({
  selector: 'angular-adapter-node',
  templateUrl: './angular-adapter-node.component.html',
  styleUrl: './angular-adapter-node.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    { directive: NodeSizeDirective, inputs: ['data'] },
    { directive: NodePositionDirective, inputs: ['data'] },
    { directive: NodeSelectedDirective, inputs: ['data'] },
    { directive: PointerDownEventListenerDirective, inputs: ['eventTarget'] },
    { directive: PointerEnterEventListenerDirective, inputs: ['eventTarget'] },
    { directive: PointerLeaveEventListenerDirective, inputs: ['eventTarget'] },
    { directive: PointerUpEventListenerDirective, inputs: ['eventTarget'] },
    { directive: ZIndexDirective, inputs: ['data'] },
  ],
  imports: [NodeResizeAdornmentComponent, NodeRotateAdornmentComponent],
})
export class AngularAdapterNodeComponent {
  private readonly portsService = inject(UpdatePortsService);
  private readonly flowCore = inject(FlowCoreProviderService);

  data = input.required<Node>();

  rotateHandleOffset = input<{
    top?: number | string;
    left?: number | string;
    right?: number | string;
    bottom?: number | string;
  }>();

  readonly rotate = computed(() => (this.data().angle ? `rotate(${this.data().angle}deg)` : ''));
  readonly id = computed(() => this.data().id);

  constructor() {
    effect(() => {
      this.rotate();
      // TODO: fix problem with DOM position resync after repaint
      setTimeout(() => {
        const portsData = this.portsService.getNodePortsData(this.id());
        this.flowCore.provide().internalUpdater.applyPortsSizesAndPositions(this.id(), portsData);
      }, 0);
    });
  }
}
