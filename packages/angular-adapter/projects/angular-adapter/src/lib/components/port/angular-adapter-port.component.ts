import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  HostBinding,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
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
  @HostBinding('attr.data-port-id') get dataPortIdAttr() {
    return this.id();
  }

  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly eventMapperService = inject(EventMapperService);
  private readonly nodeComponent = inject(AngularAdapterNodeComponent);
  private readonly updatePortsService = inject(UpdatePortsService);
  private resizeObserver!: ResizeObserver;

  id = input.required<Port['id']>();
  type = input.required<Port['type']>();
  side = input.required<Port['side']>();
  nodeData = computed(() => this.nodeComponent.data());

  lastSide = signal<Port['side'] | undefined>(undefined);
  lastType = signal<Port['type'] | undefined>(undefined);

  constructor() {
    effect(() => {
      if (this.lastSide() !== this.side()) {
        this.lastSide.set(this.side());
        this.flowCoreProvider.provide().commandHandler.emit('updatePort', {
          nodeId: this.nodeData().id,
          portId: this.id(),
          portChanges: { side: this.side() },
        });
      }
    });

    effect(() => {
      if (this.lastType() !== this.type()) {
        this.lastType.set(this.type());
        this.flowCoreProvider.provide().commandHandler.emit('updatePort', {
          nodeId: this.nodeData().id,
          portId: this.id(),
          portChanges: { type: this.type() },
        });
      }
    });
  }

  ngOnInit(): void {
    const portData = this.updatePortsService.getPortData(this.hostElement.nativeElement);
    this.lastSide.set(this.side());
    this.lastType.set(this.type());
    this.flowCoreProvider.provide().commandHandler.emit('addPorts', {
      nodeId: this.nodeData().id,
      ports: [
        {
          id: this.id(),
          type: this.type(),
          nodeId: this.nodeData().id,
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
          nodeId: this.nodeData().id,
          portId: this.id(),
          portChanges: { ...portData, size: { width, height } },
        });
      }
    });
    this.resizeObserver.observe(this.hostElement.nativeElement);
  }

  ngOnDestroy(): void {
    this.flowCoreProvider.provide().commandHandler.emit('deletePorts', {
      nodeId: this.nodeData().id,
      portIds: [this.id()],
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

  private getEventTarget(): PortTarget {
    const port = this.nodeData()?.ports?.find((port) => port.id === this.id());
    if (!port) {
      throw new Error(`Port with id ${this.id()} on node ${this.nodeData()?.id} not found`);
    }
    return {
      type: 'port',
      element: port,
    };
  }
}
