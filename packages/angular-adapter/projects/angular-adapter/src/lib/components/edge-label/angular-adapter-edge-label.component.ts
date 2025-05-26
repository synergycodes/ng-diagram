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
import { findParentWithClass } from '../../utils/find-parent-with-class';
import { getPointOnPath } from '../../utils/get-point-on-path';
import { AngularAdapterEdgeComponent } from '../edge/angular-adapter-edge.component';

@Component({
  selector: 'angular-adapter-edge-label',
  templateUrl: './angular-adapter-edge-label.component.html',
  styleUrl: './angular-adapter-edge-label.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(pointerdown)': 'onPointerDown($event)',
    '(pointerup)': 'onPointerUp($event)',
    '[style.transform]': '`translate(${position().x}px, ${position().y}px) translate(-50%, -50%)`',
  },
})
export class AngularAdapterEdgeLabelComponent implements OnInit, OnDestroy {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly edgeComponent = inject(AngularAdapterEdgeComponent);
  private readonly eventMapperService = inject(EventMapperService);
  private resizeObserver!: ResizeObserver;

  id = input.required<EdgeLabel['id']>();
  positionOnEdge = input.required<EdgeLabel['positionOnEdge']>();

  edgeData = computed(() => this.edgeComponent.data());

  points = computed(() => this.edgeData()?.points);
  edgeId = computed(() => this.edgeData()?.id);
  position = computed(() => {
    if (this.positionOnEdge() < 0 || this.positionOnEdge() > 1) {
      throw new Error(`Position on edge must be between 0 and 1, got ${this.positionOnEdge()}`);
    }
    if (!this.points()?.length) {
      return { x: 0, y: 0 };
    }
    const path = findParentWithClass(this.hostElement.nativeElement, 'flow__angular-adapter-edge')?.querySelector(
      '.flow__angular-adapter-edge__path'
    );
    if (!path) {
      return { x: 0, y: 0 };
    }
    return getPointOnPath(path as SVGPathElement, this.positionOnEdge());
  });

  private lastEmittedPosition = signal<EdgeLabel['position'] | undefined>(undefined);
  private lastPositionOnEdge = signal<EdgeLabel['positionOnEdge'] | undefined>(undefined);

  constructor() {
    effect(() => {
      const newPosition = this.position();
      const lastPosition = this.lastEmittedPosition();

      if (newPosition.x !== lastPosition?.x || newPosition.y !== lastPosition?.y) {
        this.lastEmittedPosition.set(newPosition);

        this.flowCoreProvider.provide().commandHandler.emit('updateEdgeLabel', {
          edgeId: this.edgeId(),
          labelId: this.id(),
          labelChanges: { position: newPosition },
        });
      }
    });
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
    this.flowCoreProvider.provide().commandHandler.emit('addEdgeLabels', {
      edgeId: this.edgeId(),
      labels: [
        {
          id: this.id(),
          positionOnEdge: this.positionOnEdge(),
          position: { x: 0, y: 0 },
          size: { width: 0, height: 0 },
        },
      ],
    });

    this.resizeObserver = new ResizeObserver((entries) => {
      const borderBox = entries[0].borderBoxSize?.[0];
      if (borderBox) {
        const width = borderBox.inlineSize;
        const height = borderBox.blockSize;
        this.flowCoreProvider.provide().commandHandler.emit('updateEdgeLabel', {
          edgeId: this.edgeId(),
          labelId: this.id(),
          labelChanges: { size: { width, height } },
        });
      }
    });
    this.resizeObserver.observe(this.hostElement.nativeElement);
  }

  ngOnDestroy(): void {
    this.flowCoreProvider.provide().commandHandler.emit('deleteEdgeLabels', {
      edgeId: this.edgeId(),
      labelIds: [this.id()],
    });
    this.resizeObserver.disconnect();
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
