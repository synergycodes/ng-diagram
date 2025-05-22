import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Node, ResizeHandlePosition } from '@angularflow/core';

import { EventMapperService } from '../../../services';
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
  private readonly eventMapper = inject(EventMapperService);

  data = input.required<Node>();
  showAdornment = computed(() => !!this.data().resizable && this.data().selected);
  size = computed(() => this.data().resizeAdornment?.handleSize ?? 6);
  strokeWidth = computed(() => this.data().resizeAdornment?.strokeWidth ?? 1);
  color = computed(() => this.data().resizeAdornment?.color ?? '#1e90ff');
  backgroundColor = computed(() => this.data().resizeAdornment?.backgroundColor ?? '#ffffff');
  linePositions: LinePosition[] = ['top', 'right', 'bottom', 'left'];
  handlePositions: HandlePosition[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

  onPointerEvent({ event, position }: { event: PointerEvent; position: ResizeHandlePosition }) {
    this.eventMapper.emit({
      type: event.type as 'pointerdown' | 'pointerup',
      pointerId: event.pointerId,
      timestamp: Date.now(),
      target: { type: 'resize-handle', position, element: this.data() },
      x: event.clientX,
      y: event.clientY,
      pressure: event.pressure,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      button: event.button,
    });
  }
}
