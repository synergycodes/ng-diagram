import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { NgDiagramService } from '../../../public-services/ng-diagram.service';
import { NodeContextGuardBase } from '../../../utils/node-context-guard.base';
import { NgDiagramResizeHandleComponent } from './handle/ng-diagram-resize-handle.component';
import { NgDiagramResizeLineComponent } from './line/ng-diagram-resize-line.component';
import { ALL_RESIZE_EDGES, HANDLE_EDGES, HandlePosition, ResizeEdge } from './ng-diagram-node-resize-adornment.types';

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
 * @public
 * @since 0.8.0
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
   *
   * @default undefined
   */
  defaultResizable = input<boolean | undefined>(undefined);
  /**
   * Which edges of the node can be grabbed to resize it.
   *
   * All four lines always render, since they double as the node's selection frame, but the ones
   * for edges left out here are inert: they do not start a resize and show no resize cursor.
   * A corner handle renders only when both of its edges are listed, so
   * `['right', 'bottom']` leaves only the bottom-right handle.
   *
   * Pass an empty array to keep the selection frame without allowing any interactive resize.
   *
   * @default ['top', 'right', 'bottom', 'left']
   * @since 1.3.0
   *
   * @example
   * ```html
   * <ng-diagram-node-resize-adornment [resizeEdges]="['right', 'bottom']">
   *   <!-- Node content here -->
   * </ng-diagram-node-resize-adornment>
   * ```
   */
  resizeEdges = input<readonly ResizeEdge[]>(ALL_RESIZE_EDGES);
  readonly nodeData = computed(() => this.nodeComponent?.node());
  readonly dataResizable = computed(() => this.nodeData()?.resizable);
  readonly isResizable = computed(
    () => this.dataResizable() ?? this.defaultResizable() ?? this.diagramService.config().resize?.defaultResizable
  );
  readonly showAdornment = computed(
    () => !!this.isResizable() && this.nodeData()?.selected && this.isRenderedOnCanvas() && !this.nodeData()?.angle
  );
  readonly linePositions: readonly ResizeEdge[] = ALL_RESIZE_EDGES;
  readonly activeEdges = computed(() => new Set<ResizeEdge>(this.resizeEdges()));
  readonly handles = computed<{ position: HandlePosition; active: boolean }[]>(() => {
    const activeEdges = this.activeEdges();
    return HANDLE_EDGES.map(({ position, edges }) => ({
      position,
      active: edges.every((edge) => activeEdges.has(edge)),
    }));
  });
}
