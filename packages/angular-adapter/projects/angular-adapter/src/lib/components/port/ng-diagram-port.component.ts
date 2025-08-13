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
import { NodeContextGuardBase } from '../../utils/node-context-guard.base';

@Component({
  selector: 'ng-diagram-port',
  template: '',
  styleUrl: './ng-diagram-port.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-port-id]': 'id()',
    '[class]': '`ng-diagram-port ${side()}`',
    '[style.display]': 'isRenderedOnCanvas() ? "block" : "none"',
  },
  hostDirectives: [{ directive: LinkingInputDirective, inputs: ['portId: id'] }],
})
export class NgDiagramPortComponent extends NodeContextGuardBase implements OnInit, OnDestroy {
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly batchResizeObserver = inject(BatchResizeObserverService);
  private readonly linkingInputDirective = inject(LinkingInputDirective);

  id = input.required<Port['id']>();
  type = input.required<Port['type']>();
  side = input.required<Port['side']>();
  nodeData = computed(() => this.nodeComponent?.node());

  lastSide = signal<Port['side'] | undefined>(undefined);
  lastType = signal<Port['type'] | undefined>(undefined);
  private isInitialized = signal(false);

  constructor() {
    super();
    effect(() => {
      const nodeData = this.nodeData();
      if (this.isInitialized() && nodeData && this.lastSide() !== this.side()) {
        this.lastSide.set(this.side());
        this.flowCoreProvider.provide().commandHandler.emit('updatePorts', {
          nodeId: nodeData.id,
          ports: [{ portId: this.id(), portChanges: { side: this.side() } }],
        });
      }
    });

    effect(() => {
      const nodeData = this.nodeData();
      if (this.isInitialized() && nodeData) {
        this.linkingInputDirective.setTargetNode(nodeData);
      }
    });

    effect(() => {
      const nodeData = this.nodeData();
      if (this.isInitialized() && this.lastType() !== this.type() && nodeData) {
        this.lastType.set(this.type());
        this.flowCoreProvider.provide().commandHandler.emit('updatePorts', {
          nodeId: nodeData.id,
          ports: [{ portId: this.id(), portChanges: { type: this.type() } }],
        });
      }
    });
  }

  ngOnInit(): void {
    this.lastSide.set(this.side());
    this.lastType.set(this.type());
    const nodeData = this.nodeData();
    if (!nodeData) {
      return;
    }

    this.flowCoreProvider.provide().updater.addPort(nodeData.id, {
      id: this.id(),
      type: this.type(),
      nodeId: nodeData.id,
      side: this.side(),
    });

    this.batchResizeObserver.observe(this.hostElement.nativeElement, {
      type: 'port',
      nodeId: nodeData.id,
      portId: this.id(),
    });
    this.isInitialized.set(true);
  }

  ngOnDestroy(): void {
    const nodeData = this.nodeData();
    if (!nodeData) {
      return;
    }

    this.flowCoreProvider.provide().commandHandler.emit('deletePorts', {
      nodeId: nodeData.id,
      portIds: [this.id()],
    });

    this.batchResizeObserver.unobserve(this.hostElement.nativeElement);
  }
}
