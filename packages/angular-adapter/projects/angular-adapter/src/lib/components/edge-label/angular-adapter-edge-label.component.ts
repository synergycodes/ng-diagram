import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input } from '@angular/core';
import { EdgeLabel, EdgeLabelTarget } from '@angularflow/core';
import { EventMapperService } from '../../services';
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
    '[style.transform]': '`translate(${calculatedPosition().x}px, ${calculatedPosition().y}px) translate(-50%, -50%)`',
  },
})
export class AngularAdapterEdgeLabelComponent {
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly edgeComponent = inject(AngularAdapterEdgeComponent);
  private readonly eventMapperService = inject(EventMapperService);

  id = input.required<EdgeLabel['id']>();
  position = input.required<EdgeLabel['position']>();
  points = computed(() => this.edgeComponent.data()?.points);
  edgeId = computed(() => this.edgeComponent.data()?.id);
  calculatedPosition = computed(() => {
    console.log('recalculating position');
    this.points();
    const edgeElement = findParentWithClass(this.hostElement.nativeElement, 'flow__angular-adapter-edge');
    const path = edgeElement?.querySelector('path');
    if (!path) {
      throw new Error(`Path for edge with id ${this.edgeId()} not found`);
    }
    return this.getPointOnPath(path as SVGPathElement, this.position());
  });

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
