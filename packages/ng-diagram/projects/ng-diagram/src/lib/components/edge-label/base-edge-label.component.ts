import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { EdgeLabel } from '../../../core/src';
import { BatchResizeObserverService, FlowCoreProviderService } from '../../services';
import { NgDiagramBaseEdgeComponent } from '../edge/base-edge/base-edge.component';

/**
 * The `BaseEdgeLabelComponent` is responsible for displaying a label at a specific position along an edge.
 *
 * ## Example usage
 * ```html
 * <ng-diagram-base-edge-label
 *   [id]="labelId"
 *   [positionOnEdge]="0.5"
 * >
 *   <!-- Any label content here (text, icon, button) -->
 * </ng-diagram-base-edge-label>
 * ```
 *
 * @category Components
 */
@Component({
  selector: 'ng-diagram-base-edge-label',
  standalone: true,
  templateUrl: './base-edge-label.component.html',
  styleUrl: './base-edge-label.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.transform]': 'transform',
    '[style.display]': 'isVisible() ? null : "none"',
  },
})
export class BaseEdgeLabelComponent implements OnInit, OnDestroy {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly edgeComponent = inject(NgDiagramBaseEdgeComponent);
  private readonly batchResizeObserver = inject(BatchResizeObserverService);

  /**
   * The unique identifier for the edge label.
   */
  id = input.required<EdgeLabel['id']>();

  /**
   * The relative position of the label along the edge (from 0 to 1).
   */
  positionOnEdge = input.required<EdgeLabel['positionOnEdge']>();

  readonly edgeData = computed(() => this.edgeComponent.edge());
  readonly points = computed(() => this.edgeData()?.points);
  readonly edgeId = computed(() => this.edgeData()?.id);
  readonly position = computed(() => {
    const edgeData = this.edgeData();
    const labelData = edgeData?.measuredLabels?.find((label) => label.id === this.id());
    return labelData?.position || { x: 0, y: 0 };
  });

  // Hide label when it doesn't have a valid position or edge has no points
  // (prevents initial "blinking")
  readonly isVisible = computed(() => {
    const edgeData = this.edgeData();
    if (!edgeData) return false;

    const labelData = edgeData.measuredLabels?.find((label) => label.id === this.id());

    const hasCalculatedPosition = !!(
      labelData?.position &&
      labelData?.position.x != null &&
      labelData?.position.y != null
    );

    const hasValidPoints = !!(edgeData.points && edgeData.points.length >= 2);

    return hasCalculatedPosition && hasValidPoints;
  });

  private lastPositionOnEdge = signal<EdgeLabel['positionOnEdge'] | undefined>(undefined);

  get transform(): string {
    const pos = this.position();
    return `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`;
  }

  constructor() {
    effect(
      () => {
        const newPositionOnEdge = this.positionOnEdge();
        const lastPositionOnEdge = this.lastPositionOnEdge();
        if (newPositionOnEdge !== lastPositionOnEdge) {
          this.lastPositionOnEdge.set(newPositionOnEdge);
          this.flowCoreProvider.provide().commandHandler.emit('updateEdgeLabels', {
            edgeId: this.edgeId(),
            labelUpdates: [{ labelId: this.id(), labelChanges: { positionOnEdge: newPositionOnEdge } }],
          });
        }
      },
      { allowSignalWrites: true }
    );
  }

  /** @internal */
  ngOnInit() {
    this.lastPositionOnEdge.set(this.positionOnEdge());
    this.flowCoreProvider.provide().updater.addEdgeLabel(this.edgeId(), {
      id: this.id(),
      positionOnEdge: this.positionOnEdge(),
    });

    this.batchResizeObserver.observe(this.hostElement.nativeElement, {
      type: 'edge-label',
      edgeId: this.edgeId(),
      labelId: this.id(),
    });
  }

  /** @internal */
  ngOnDestroy(): void {
    this.flowCoreProvider.provide().commandHandler.emit('deleteEdgeLabels', {
      edgeId: this.edgeId(),
      labelIds: [this.id()],
    });
    this.batchResizeObserver.unobserve(this.hostElement.nativeElement);
  }
}
