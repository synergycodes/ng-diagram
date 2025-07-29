import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { AngularAdapterNodeComponent } from '../angular-adapter-node.component';
import { ResizeHandleComponent } from './handle/resize-handle.component';
import { ResizeLineComponent } from './line/resize-line.component';
import { HandlePosition, LinePosition } from './node-resize-adornment.types';

@Component({
  selector: 'angular-adapter-node-resize-adornment',
  templateUrl: './node-resize-adornment.component.html',
  styleUrl: './node-resize-adornment.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ResizeLineComponent, ResizeHandleComponent],
})
export class NodeResizeAdornmentComponent {
  private readonly nodeComponent = inject(AngularAdapterNodeComponent);

  nodeData = computed(() => this.nodeComponent.data());
  showAdornment = computed(() => !!this.nodeData().resizable && this.nodeData().selected);

  linePositions: LinePosition[] = ['top', 'right', 'bottom', 'left'];
  handlePositions: HandlePosition[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
}
