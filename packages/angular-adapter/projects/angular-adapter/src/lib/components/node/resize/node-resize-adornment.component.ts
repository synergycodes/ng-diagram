import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Node, NodeResizeAdornmentConfig, ResizeHandlePosition } from '@angularflow/core';

import { EventMapperService, FlowCoreProviderService } from '../../../services';
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
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  data = input.required<Node>();
  nodeResizeAdornmentConfig = signal<Required<NodeResizeAdornmentConfig>>({
    handleSize: 6,
    strokeWidth: 1,
    color: '#1e90ff',
    handleBackgroundColor: '#ffffff',
    ...this.flowCoreProvider.provide().model.getMetadata().nodeResizeAdornmentConfig,
  });
  showAdornment = computed(() => !!this.data().resizable && this.data().selected);
  size = computed(() => this.nodeResizeAdornmentConfig().handleSize);
  strokeWidth = computed(() => this.nodeResizeAdornmentConfig().strokeWidth);
  color = computed(() => this.nodeResizeAdornmentConfig().color);
  backgroundColor = computed(() => this.nodeResizeAdornmentConfig().handleBackgroundColor);
  linePositions: LinePosition[] = ['top', 'right', 'bottom', 'left'];
  handlePositions: HandlePosition[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

  onPointerEvent({ event, position }: { event: PointerEvent; position: ResizeHandlePosition }) {
    event.stopPropagation();
    this.eventMapper.emit(event, {
      name: 'resize',
      target: { type: 'resize-handle', element: this.data(), position },
      data: {
        handlePosition: position,
      },
    });
  }
}
