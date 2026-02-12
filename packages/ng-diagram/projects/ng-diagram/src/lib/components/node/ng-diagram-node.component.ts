import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Node } from '../../../core/src';

import { NodePositionDirective, NodeSizeDirective, ZIndexDirective } from '../../directives';
import { NodeSelectionDirective } from '../../directives/input-events/object-selection/object-selection.directive';
import { PointerMoveSelectionDirective } from '../../directives/input-events/pointer-move-selection/pointer-move-selection.directive';
import { FlowCoreProviderService, UpdatePortsService } from '../../services';

@Component({
  selector: 'ng-diagram-node',
  standalone: true,
  templateUrl: './ng-diagram-node.component.html',
  styleUrl: './ng-diagram-node.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    { directive: NodeSizeDirective, inputs: ['node'] },
    { directive: NodePositionDirective, inputs: ['node'] },
    { directive: NodeSelectionDirective, inputs: ['targetData: node'] },
    { directive: PointerMoveSelectionDirective, inputs: ['targetData: node'] },
    { directive: ZIndexDirective, inputs: ['data: node'] },
  ],
})
export class NgDiagramNodeComponent {
  private readonly portsService = inject(UpdatePortsService);
  private readonly flowCore = inject(FlowCoreProviderService);

  node = input.required<Node>();

  readonly rotate = computed(() => (this.node().angle ? `rotate(${this.node().angle}deg)` : ''));

  readonly id = computed(() => this.node().id);
  readonly size = computed(() => this.node().size);

  constructor() {
    this.setupPortSyncEffect();
  }

  private syncPorts(): void {
    const id = this.id();
    const flowCore = this.flowCore.provide();
    const isResizing = flowCore.actionStateManager.isResizing();

    if (isResizing) {
      // For resizing we don't have to wait for transforms to compute and removing the "wait"
      // helps to minimize visual lag between new port positions and edge routing applied afterwards the ports are measured
      const portsData = this.portsService.getNodePortsData(id);
      flowCore.updater.applyPortsSizesAndPositions(id, portsData);
    } else {
      // Async for rotation and other cases - wait for browser to apply transforms
      queueMicrotask(() => {
        const portsData = this.portsService.getNodePortsData(id);
        flowCore.updater.applyPortsSizesAndPositions(id, portsData);
      });
    }
  }

  private setupPortSyncEffect(): void {
    let isFirstRun = true;
    let prevSize: { width?: number; height?: number } | undefined;
    let prevRotate: string | undefined;

    effect(() => {
      const size = this.size();
      const rotate = this.rotate();

      // Skip initial run - ports aren't measured yet, ResizeObserver will handle initial sync
      if (isFirstRun) {
        isFirstRun = false;
        prevSize = size;
        prevRotate = rotate;
        return;
      }

      // Skip if size and rotate haven't actually changed (just object reference change)
      const sizeChanged = size?.width !== prevSize?.width || size?.height !== prevSize?.height;
      const rotateChanged = rotate !== prevRotate;

      if (!sizeChanged && !rotateChanged) {
        return;
      }

      prevSize = size;
      prevRotate = rotate;
      this.syncPorts();
    });
  }
}
