import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Node } from '@angularflow/core';

import { NodePositionDirective, NodeSizeDirective, ZIndexDirective } from '../../directives';
import { ObjectSelectDirective } from '../../directives/input-events/object-select/object-select.directive';
import { PointerMoveSelectionDirective } from '../../directives/input-events/pointer-move-selection/pointer-move-selection.directive';
import { FlowCoreProviderService, UpdatePortsService } from '../../services';

@Component({
  selector: 'angular-adapter-node',
  templateUrl: './angular-adapter-node.component.html',
  styleUrl: './angular-adapter-node.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    { directive: NodeSizeDirective, inputs: ['data'] },
    { directive: NodePositionDirective, inputs: ['data'] },
    { directive: ObjectSelectDirective, inputs: ['targetData: data', 'targetType'] },
    { directive: PointerMoveSelectionDirective, inputs: ['targetData: data'] },
    { directive: ZIndexDirective, inputs: ['data'] },
  ],
})
export class AngularAdapterNodeComponent {
  private readonly portsService = inject(UpdatePortsService);
  private readonly flowCore = inject(FlowCoreProviderService);

  data = input.required<Node>();
  targetType = 'node';

  readonly rotate = computed(() => (this.data().angle ? `rotate(${this.data().angle}deg)` : ''));

  readonly id = computed(() => this.data().id);
  readonly size = computed(() => this.data().size);

  constructor() {
    this.setupPortSyncEffect();
  }

  private syncPorts(): void {
    queueMicrotask(() => {
      const id = this.id();
      const portsData = this.portsService.getNodePortsData(id);

      this.flowCore.provide().internalUpdater.applyPortsSizesAndPositions(id, portsData);
    });
  }

  private setupPortSyncEffect(): void {
    effect(() => {
      this.size();
      this.rotate();
      this.syncPorts();
    });
  }
}
