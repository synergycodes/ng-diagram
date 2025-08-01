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
import { Port } from '@angularflow/core';
import { LinkingInputDirective } from '../../directives/input-events/linking/linking.directive';
import { FlowCoreProviderService } from '../../services';
import { BatchResizeObserverService } from '../../services/flow-resize-observer/batched-resize-observer.service';
import { NgDiagramNodeComponent } from '../node/ng-diagram-node.component';

@Component({
  selector: 'ng-diagram-port',
  templateUrl: './ng-diagram-port.component.html',
  styleUrl: './ng-diagram-port.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-port-id]': 'id()',
    '[class]': '`ng-diagram-port ${side()}`',
  },
  hostDirectives: [{ directive: LinkingInputDirective, inputs: ['portId: id'] }],
})
export class NgDiagramPortComponent implements OnInit, OnDestroy {
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly batchResizeObserver = inject(BatchResizeObserverService);
  private readonly nodeComponent = inject(NgDiagramNodeComponent);
  private readonly linkingInputDirective = inject(LinkingInputDirective);

  id = input.required<Port['id']>();
  type = input.required<Port['type']>();
  side = input.required<Port['side']>();
  nodeData = computed(() => this.nodeComponent.data());

  lastSide = signal<Port['side'] | undefined>(undefined);
  lastType = signal<Port['type'] | undefined>(undefined);
  private isInitialized = signal(false);

  constructor() {
    effect(() => {
      if (this.isInitialized() && this.lastSide() !== this.side()) {
        this.lastSide.set(this.side());
        this.flowCoreProvider.provide().commandHandler.emit('updatePorts', {
          nodeId: this.nodeData().id,
          ports: [{ portId: this.id(), portChanges: { side: this.side() } }],
        });
      }
    });

    effect(() => {
      if (this.isInitialized() && this.nodeData()) {
        this.linkingInputDirective.setTargetNode(this.nodeData());
      }
    });

    effect(() => {
      if (this.isInitialized() && this.lastType() !== this.type()) {
        this.lastType.set(this.type());
        this.flowCoreProvider.provide().commandHandler.emit('updatePorts', {
          nodeId: this.nodeData().id,
          ports: [{ portId: this.id(), portChanges: { type: this.type() } }],
        });
      }
    });
  }

  ngOnInit(): void {
    this.lastSide.set(this.side());
    this.lastType.set(this.type());

    this.flowCoreProvider.provide().updater.addPort(this.nodeData().id, {
      id: this.id(),
      type: this.type(),
      nodeId: this.nodeData().id,
      side: this.side(),
    });

    this.batchResizeObserver.observe(this.hostElement.nativeElement, {
      type: 'port',
      nodeId: this.nodeData().id,
      portId: this.id(),
    });
    this.isInitialized.set(true);
  }

  ngOnDestroy(): void {
    this.flowCoreProvider.provide().commandHandler.emit('deletePorts', {
      nodeId: this.nodeData().id,
      portIds: [this.id()],
    });

    this.batchResizeObserver.unobserve(this.hostElement.nativeElement);
  }
}
