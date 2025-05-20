import { ChangeDetectionStrategy, Component, ElementRef, inject, input, OnDestroy, OnInit } from '@angular/core';
import { Port, PortTarget } from '@angularflow/core';
import { EventMapperService, FlowCoreProviderService } from '../../services';
import { UpdatePortsService } from '../../services/update-ports/update-ports.service';
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
export class AngularAdapterPortComponent implements OnInit, OnDestroy {
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly eventMapperService = inject(EventMapperService);
  private readonly nodeComponent = inject(AngularAdapterNodeComponent);
  private readonly updatePortsService = inject(UpdatePortsService);
  private resizeObserver!: ResizeObserver;

  id = input.required<string>();
  type = input.required<Port['type']>();
  side = input.required<Port['side']>();

  ngOnInit(): void {
    const node = this.nodeComponent.data();
    this.hostElement.nativeElement.setAttribute('data-port-id', this.id());

    const portData = this.updatePortsService.getPortData(this.hostElement.nativeElement);
    this.flowCoreProvider.provide().commandHandler.emit('addPorts', {
      nodeId: node.id,
      ports: [
        {
          id: this.id(),
          type: this.type(),
          nodeId: node.id,
          side: this.side(),
          ...portData,
        },
      ],
    });

    this.resizeObserver = new ResizeObserver((entries) => {
      const borderBox = entries[0].borderBoxSize?.[0];
      if (borderBox) {
        const width = borderBox.inlineSize;
        const height = borderBox.blockSize;
        const portData = this.updatePortsService.getPortData(this.hostElement.nativeElement);
        this.flowCoreProvider.provide().commandHandler.emit('updatePort', {
          nodeId: node.id,
          portId: this.id(),
          portChanges: { ...portData, size: { width, height }, side: this.side() },
        });
      }
    });
    this.resizeObserver.observe(this.hostElement.nativeElement);
  }

  ngOnDestroy(): void {
    const node = this.nodeComponent.data();
    this.flowCoreProvider.provide().commandHandler.emit('deletePorts', {
      nodeId: node.id,
      portIds: [this.id()],
    });
    this.resizeObserver.disconnect();
  }

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

  private getEventTarget(): PortTarget {
    const port = this.nodeComponent.data()?.ports?.find((port) => port.id === this.id());
    if (!port) {
      throw new Error(`Port with id ${this.id()} on node ${this.nodeComponent.data()?.id} not found`);
    }
    return {
      type: 'port',
      element: port,
    };
  }
}
