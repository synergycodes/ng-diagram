import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgDiagramBaseEdgeComponent } from '../../edge/base-edge/base-edge.component';

/**
 * The `NgDiagramDefaultEdgeLabelComponent` wraps any projected content in the default
 * edge label chip — theme-aware background, rounded border and a highlighted border
 * while the edge is selected. Use it inside a {@link NgDiagramBaseEdgeLabelComponent}
 * to give a custom edge template the same label look as the default edge without
 * copying its styles.
 *
 * The selected state is read from the surrounding edge component, so the component
 * must be used inside an edge template — instantiating it elsewhere fails with a
 * dependency injection error.
 *
 * ## Example usage
 * ```html
 * <ng-diagram-base-edge [edge]="edge()">
 *   <ng-diagram-base-edge-label [id]="'edge-label'" [positionOnEdge]="0.5">
 *     <ng-diagram-default-edge-label>{{ label() }}</ng-diagram-default-edge-label>
 *   </ng-diagram-base-edge-label>
 * </ng-diagram-base-edge>
 * ```
 *
 * @public
 * @since 1.3.0
 * @category Components
 */
@Component({
  selector: 'ng-diagram-default-edge-label',
  standalone: true,
  templateUrl: './default-edge-label.component.html',
  styleUrl: './default-edge-label.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgDiagramDefaultEdgeLabelComponent {
  private readonly edgeComponent = inject(NgDiagramBaseEdgeComponent);
  readonly selected = computed(() => this.edgeComponent.selected());
}
