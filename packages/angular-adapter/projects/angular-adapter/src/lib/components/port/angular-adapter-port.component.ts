import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Port, PortTarget } from '@angularflow/core';
import { EventMapperService } from '../../services';
import { AngularAdapterNodeComponent } from '../node/angular-adapter-node.component';

@Component({
  selector: 'angular-adapter-port',
  templateUrl: './angular-adapter-port.component.html',
  styleUrl: './angular-adapter-port.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(pointerdown)': 'onPointerDown($event)',
    '(pointerup)': 'onPointerUp($event)',
  },
})
export class AngularAdapterPortComponent {
  private readonly eventMapperService = inject(EventMapperService);
  private readonly nodeComponent = inject(AngularAdapterNodeComponent);

  id = input.required<string>();
  type = input.required<Port['type']>();

  onPointerDown(event: PointerEvent) {
    event.stopPropagation();
    this.eventMapperService.emit({
      pointerId: event.pointerId,
      type: 'pointerdown',
      target: this.getEventTarget(),
      pressure: event.pressure,
      timestamp: Date.now(),
      x: event.clientX,
      y: event.clientY,
      button: event.button,
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
    });
  }

  private getEventTarget(): PortTarget {
    return {
      type: 'port',
      element: {
        id: this.id(),
        type: this.type(),
        nodeId: this.nodeComponent.data()?.id ?? '',
        position: { x: 0, y: 0 }, // user positions the port in their template - do we need this?
        size: { width: 8, height: 8 }, // comes from the port styles
      },
    };
  }
}
