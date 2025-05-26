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
} from '@angular/core';
import { EdgeLabel, EdgeLabelTarget } from '@angularflow/core';
import { EventMapperService, FlowCoreProviderService } from '../../services';
import { findParentWithClass } from '../../utils/find-parent-with-class';
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

  points = computed(() => this.edgeComponent.data()?.points);
  edgeId = computed(() => this.edgeComponent.data()?.id);
  position = computed(() => {
    if (!this.points()?.length) {
      return { x: 0, y: 0 };
    }
    const edgeElement = findParentWithClass(this.hostElement.nativeElement, 'flow__angular-adapter-edge');
    const path = edgeElement?.querySelector('.flow__angular-adapter-edge__path');
    if (!path) {
      return { x: 0, y: 0 };
    }
    return this.getPointOnPath(path as SVGPathElement, this.positionOnEdge());
  });

  constructor() {
    let lastPosition = this.position();
    effect(() => {
      if (lastPosition.x !== this.position().x || lastPosition.y !== this.position().y) {
        lastPosition = this.position();
        this.flowCoreProvider.provide().commandHandler.emit('updateEdgeLabel', {
          edgeId: this.edgeId(),
          labelId: this.id(),
          labelChanges: { position: this.position() },
        });
      }
    });
  }

  ngOnInit() {
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
    const edgeLabel = this.edgeComponent.data()?.labels?.find((label) => label.id === this.id());
    if (!edgeLabel) {
      throw new Error(`Edge label with id ${this.id()} on edge ${this.edgeComponent.data()?.id} not found`);
    }
    return {
      type: 'edge-label',
      element: edgeLabel,
    };
  }

  private getPointOnPath(pathElement: SVGPathElement, percentage: number) {
    const totalLength = pathElement.getTotalLength();
    const lengthAtPercent = totalLength * percentage;
    const point = pathElement.getPointAtLength(lengthAtPercent);
    return { x: point.x, y: point.y };
  }
}
