import {
  AfterContentInit,
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
  untracked,
  viewChild,
} from '@angular/core';
import { OriginPoint, Port } from '../../../core/src';
import { LinkingInputDirective } from '../../directives/input-events/linking/linking.directive';
import { FlowCoreProviderService } from '../../services';
import { BatchResizeObserverService } from '../../services/flow-resize-observer/batched-resize-observer.service';
import { NodeContextGuardBase } from '../../utils/node-context-guard.base';

/**
 * Mapping of origin point values to their corresponding CSS class names.
 * @internal
 */
const originPointClassMap: Record<OriginPoint, string> = {
  topLeft: 'top-left',
  topCenter: 'top-center',
  topRight: 'top-right',
  centerLeft: 'center-left',
  center: 'center',
  centerRight: 'center-right',
  bottomLeft: 'bottom-left',
  bottomCenter: 'bottom-center',
  bottomRight: 'bottom-right',
};

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
  template: `
    <div #contentProjection class="content-projection">
      <ng-content />
    </div>
  `,
  styleUrl: './ng-diagram-port.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-port-id]': 'id()',
    '[class]': 'portClass',
    '[style.display]': 'isRenderedOnCanvas() ? "block" : "none"',
  },
  hostDirectives: [{ directive: LinkingInputDirective, inputs: ['portId: id'] }],
})
export class NgDiagramPortComponent extends NodeContextGuardBase implements OnInit, OnDestroy, AfterContentInit {
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

  /**
   * The origin point for the port (e.g., topLeft, center, bottomRight).
   */
  originPoint = input<OriginPoint>('center');

  get portClass(): string {
    const originClass = originPointClassMap[this.originPoint()] || 'center';
    return `ng-diagram-port ${this.hasContent ? 'custom-content' : ''} ${this.side()} origin-${originClass}`;
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

    effect(() => {
      const nodeData = this.nodeData();
      if (this.isInitialized() && nodeData) {
        // Angular 18 backward compatibility
        untracked(() => {
          this.linkingInputDirective.setTargetNode(nodeData);
        });
      }
    });

    effect(() => {
      const nodeData = this.nodeData();
      if (this.isInitialized() && this.lastType() !== this.type() && nodeData) {
        // Angular 18 backward compatibility
        untracked(() => {
          this.lastType.set(this.type());
        });
        this.flowCoreProvider.provide().commandHandler.emit('updatePorts', {
          nodeId: nodeData.id,
          ports: [{ portId: this.id(), portChanges: { type: this.type() } }],
        });
      }
    });
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

  private readonly custom = viewChild<ElementRef<HTMLElement>>('contentProjection');
  protected hasContent = false;

  /** @internal */
  ngAfterContentInit() {
    this.hasContent = (this.custom()?.nativeElement?.childNodes?.length ?? 0) > 0;
  }
}
