import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Node } from '@angularflow/core';

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
  data = input.required<Node>();
  showAdornment = computed(() => !!this.data().resizable && this.data().selected);
  linePositions: LinePosition[] = ['top', 'right', 'bottom', 'left'];
  handlePositions: HandlePosition[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
}
