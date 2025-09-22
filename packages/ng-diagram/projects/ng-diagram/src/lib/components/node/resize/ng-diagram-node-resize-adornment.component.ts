import { ChangeDetectionStrategy, Component, computed } from '@angular/core';

import { NodeContextGuardBase } from '../../../utils/node-context-guard.base';
import { NgDiagramResizeHandleComponent } from './handle/ng-diagram-resize-handle.component';
import { NgDiagramResizeLineComponent } from './line/ng-diagram-resize-line.component';
import { HandlePosition, LinePosition } from './ng-diagram-node-resize-adornment.types';

/**
 * The `NgDiagramNodeResizeAdornmentComponent` displays resize handles and lines around a selected, resizable node.
 *
 * ## Example usage
 * ```html
 * <ng-diagram-node-resize-adornment>
 *   <!-- Node content here -->
 * </ng-diagram-node-resize-adornment>
 * ```
 *
 * @category Components
 */
@Component({
  selector: 'ng-diagram-node-resize-adornment',
  templateUrl: './ng-diagram-node-resize-adornment.component.html',
  styleUrl: './ng-diagram-node-resize-adornment.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDiagramResizeLineComponent, NgDiagramResizeHandleComponent],
})
export class NgDiagramNodeResizeAdornmentComponent extends NodeContextGuardBase {
  readonly nodeData = computed(() => this.nodeComponent?.node());
  readonly showAdornment = computed(
    () => !!this.nodeData()?.resizable && this.nodeData()?.selected && this.isRenderedOnCanvas()
  );
  readonly linePositions: LinePosition[] = ['top', 'right', 'bottom', 'left'];
  readonly handlePositions: HandlePosition[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
}
