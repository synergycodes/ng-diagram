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
import { EdgeLabel, EdgeLabelTarget } from '@angularflow/core';
import { EventMapperService, FlowCoreProviderService } from '../../services';
import { BatchResizeObserverService } from '../../services/flow-resize-observer/batched-resize-observer.service';
import { AngularAdapterEdgeComponent } from '../edge/angular-adapter-edge.component';

@Component({
  selector: 'angular-adapter-edge-label',
  templateUrl: './angular-adapter-edge-label.component.html',
  styleUrl: './angular-adapter-edge-label.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(pointerdown)': 'onPointerDown($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(pointerenter)': 'onPointerEnter($event)',
    '(pointerleave)': 'onPointerLeave($event)',
    '[style.transform]': '`translate(${position().x}px, ${position().y}px) translate(-50%, -50%)`',
    '[class.selected]': 'selected()',
    '[class.edge-hovered]': 'edgeHovered()',
  },
})
export class AngularAdapterEdgeLabelComponent implements OnInit, OnDestroy {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly edgeComponent = inject(AngularAdapterEdgeComponent);
  private readonly eventMapperService = inject(EventMapperService);
  private readonly batchResizeObserver = inject(BatchResizeObserverService);

  id = input.required<EdgeLabel['id']>();
  positionOnEdge = input.required<EdgeLabel['positionOnEdge']>();
  edgeHovered = input<boolean>(false);

  edgeData = computed(() => this.edgeComponent.data());

  points = computed(() => this.edgeData()?.points);
  edgeId = computed(() => this.edgeData()?.id);
  selected = computed(() => this.edgeData()?.selected || false);
  position = computed(
    () => this.edgeData()?.labels?.find((label) => label.id === this.id())?.position || { x: 0, y: 0 }
  );

  private lastPositionOnEdge = signal<EdgeLabel['positionOnEdge'] | undefined>(undefined);

  constructor() {
    effect(() => {
      const newPositionOnEdge = this.positionOnEdge();
      const lastPositionOnEdge = this.lastPositionOnEdge();
      if (newPositionOnEdge !== lastPositionOnEdge) {
        this.lastPositionOnEdge.set(newPositionOnEdge);
        this.flowCoreProvider.provide().commandHandler.emit('updateEdgeLabel', {
          edgeId: this.edgeId(),
          labelId: this.id(),
          labelChanges: { positionOnEdge: newPositionOnEdge },
        });
      }
    });
  }

  ngOnInit() {
    this.lastPositionOnEdge.set(this.positionOnEdge());
    this.flowCoreProvider.provide().internalUpdater.addEdgeLabel(this.edgeId(), {
      id: this.id(),
      positionOnEdge: this.positionOnEdge(),
    });

    this.batchResizeObserver.observe(this.hostElement.nativeElement, {
      type: 'edge-label',
      edgeId: this.edgeId(),
      labelId: this.id(),
    });
  }

  ngOnDestroy(): void {
    this.flowCoreProvider.provide().commandHandler.emit('deleteEdgeLabels', {
      edgeId: this.edgeId(),
      labelIds: [this.id()],
    });
    this.batchResizeObserver.unobserve(this.hostElement.nativeElement);
  }

  onPointerDown(event: PointerEvent) {
    event.stopPropagation();
    const currentTarget = event.currentTarget as HTMLElement;
    currentTarget.setPointerCapture(event.pointerId);
    this.eventMapperService.emit({
      pointerId: event.pointerId,
      type: 'pointerdown',
      target: this.getEventTarget(),
      pressure: event.pressure,
      timestamp: Date.now(),
      x: event.clientX,
      y: event.clientY,
      button: event.button,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
    });
  }

  onPointerUp(event: PointerEvent) {
    event.stopPropagation();
    this.eventMapperService.emit({
      pointerId: event.pointerId,
      type: 'pointerup',
      target: this.getEventTarget(),
      pressure: event.pressure,
      timestamp: Date.now(),
      x: event.clientX,
      y: event.clientY,
      button: event.button,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
    });

    // Select the parent edge when label is clicked
    this.selectParentEdge();
  }

  onPointerEnter(event: PointerEvent) {
    event.stopPropagation();
    // Trigger hover state on parent edge
    this.edgeComponent.setHovered(true);
  }

  onPointerLeave(event: PointerEvent) {
    event.stopPropagation();
    // Trigger leave state on parent edge
    this.edgeComponent.setHovered(false);
  }

  private selectParentEdge() {
    // Emit a command to select the parent edge
    this.flowCoreProvider.provide().commandHandler.emit('select', {
      edgeIds: [this.edgeId()],
    });
  }

  private getEventTarget(): EdgeLabelTarget {
    const edgeLabel = this.edgeData()?.labels?.find((label) => label.id === this.id());
    if (!edgeLabel) {
      throw new Error(`Edge label with id ${this.id()} on edge ${this.edgeData()?.id} not found`);
    }
    return {
      type: 'edge-label',
      element: edgeLabel,
    };
  }
}
