import { ChangeDetectionStrategy, Component, computed } from '@angular/core';

import { NodeContextGuardBase } from '../../../utils/node-context-guard.base';
import { NgDiagramResizeHandleComponent } from './handle/ng-diagram-resize-handle.component';
import { NgDiagramResizeLineComponent } from './line/ng-diagram-resize-line.component';
import { HandlePosition, LinePosition } from './ng-diagram-node-resize-adornment.types';

@Component({
  selector: 'ng-diagram-node-resize-adornment',
  templateUrl: './ng-diagram-node-resize-adornment.component.html',
  styleUrl: './ng-diagram-node-resize-adornment.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDiagramResizeLineComponent, NgDiagramResizeHandleComponent],
})
export class NgDiagramNodeResizeAdornmentComponent extends NodeContextGuardBase {
  nodeData = computed(() => this.nodeComponent?.node());
  showAdornment = computed(
    () => !!this.nodeData()?.resizable && this.nodeData()?.selected && this.isRenderedOnCanvas()
  );

  linePositions: LinePosition[] = ['top', 'right', 'bottom', 'left'];
  handlePositions: HandlePosition[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
}
