import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { NgDiagramNodeComponent } from '../ng-diagram-node.component';
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
export class NgDiagramNodeResizeAdornmentComponent {
  private readonly nodeComponent = inject(NgDiagramNodeComponent);

  nodeData = computed(() => this.nodeComponent.data());
  showAdornment = computed(() => !!this.nodeData().resizable && this.nodeData().selected);

  linePositions: LinePosition[] = ['top', 'right', 'bottom', 'left'];
  handlePositions: HandlePosition[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
}
