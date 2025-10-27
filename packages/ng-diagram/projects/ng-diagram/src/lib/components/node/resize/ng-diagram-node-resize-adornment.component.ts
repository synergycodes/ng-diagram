import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Node } from '../../../../core/src';
import { NgDiagramService } from '../../../public-services/ng-diagram.service';
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
  standalone: true,
  templateUrl: './ng-diagram-node-resize-adornment.component.html',
  styleUrl: './ng-diagram-node-resize-adornment.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDiagramResizeLineComponent, NgDiagramResizeHandleComponent],
})
export class NgDiagramNodeResizeAdornmentComponent extends NodeContextGuardBase {
  private readonly diagramService = inject(NgDiagramService);
  /**
   * Whether the node is resizable.
   * Takes precedence over {@link Node.resizable}.
   *
   * @default undefined
   */
  defaultResizable = input<boolean | undefined>(undefined);
  readonly nodeData = computed(() => this.nodeComponent?.node());
  readonly dataResizable = computed(() => this.nodeData()?.resizable);
  readonly isResizable = computed(
    () => this.dataResizable() ?? this.defaultResizable() ?? this.diagramService.config().resize?.defaultResizable
  );
  readonly showAdornment = computed(
    () => !!this.isResizable() && this.nodeData()?.selected && this.isRenderedOnCanvas() && !this.nodeData()?.angle
  );
  readonly linePositions: LinePosition[] = ['top', 'right', 'bottom', 'left'];
  readonly handlePositions: HandlePosition[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
}
