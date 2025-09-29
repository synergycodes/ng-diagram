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
import { Port } from '../../../core/src';
import { LinkingInputDirective } from '../../directives/input-events/linking/linking.directive';
import { FlowCoreProviderService } from '../../services';
import { BatchResizeObserverService } from '../../services/flow-resize-observer/batched-resize-observer.service';
import { NodeContextGuardBase } from '../../utils/node-context-guard.base';

/**
 * The `NgDiagramPortComponent` represents a single port on a node within the diagram.
 *
 * ## Example usage
 * ```html
 * <ng-diagram-port [id]="port.id" [type]="port.type" [side]="port.side" />
 * ```
 *
 * @category Components
 */
@Component({
  selector: 'ng-diagram-port',
  standalone: true,
  template: '',
  styleUrl: './ng-diagram-port.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-port-id]': 'id()',
    '[class]': 'portClass',
    '[style.display]': 'isRenderedOnCanvas() ? "block" : "none"',
  },
  hostDirectives: [{ directive: LinkingInputDirective, inputs: ['portId: id'] }],
})
export class NgDiagramPortComponent extends NodeContextGuardBase implements OnInit, OnDestroy {
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly batchResizeObserver = inject(BatchResizeObserverService);
  private readonly linkingInputDirective = inject(LinkingInputDirective);
  protected readonly isInitialized = signal(false);
  protected readonly lastSide = signal<Port['side'] | undefined>(undefined);
  protected readonly lastType = signal<Port['type'] | undefined>(undefined);
  protected readonly nodeData = computed(() => this.nodeComponent?.node());

  /**
   * The unique identifier for the port. test
   */
  id = input.required<Port['id']>();

  /**
   * The type of the port (e.g., source, target, both).
   */
  type = input.required<Port['type']>();

  /**
   * The side of the node where the port is rendered (e.g., top, right, bottom, left).
   */
  side = input.required<Port['side']>();

  get portClass(): string {
    return `ng-diagram-port ${this.side()}`;
  }

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

    effect(
      () => {
        const nodeData = this.nodeData();
        if (this.isInitialized() && nodeData) {
          this.linkingInputDirective.setTargetNode(nodeData);
        }
      },
      { allowSignalWrites: true }
    );

    effect(
      () => {
        const nodeData = this.nodeData();
        if (this.isInitialized() && this.lastType() !== this.type() && nodeData) {
          this.lastType.set(this.type());
          this.flowCoreProvider.provide().commandHandler.emit('updatePorts', {
            nodeId: nodeData.id,
            ports: [{ portId: this.id(), portChanges: { type: this.type() } }],
          });
        }
      },
      { allowSignalWrites: true }
    );
  }

  /** @internal */
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

  /** @internal */
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
