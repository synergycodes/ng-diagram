import { booleanAttribute, Directive, effect, inject, input, OnDestroy, untracked } from '@angular/core';
import { NgDiagramEdgeComponent } from '../../components/edge/ng-diagram-edge.component';
import { NgDiagramNodeComponent } from '../../components/node/ng-diagram-node.component';
import { FlowCoreProviderService } from '../../services';

const OUTSIDE_TEMPLATE_WARNING =
  '[ngDiagram] ngDiagramHidden must be used inside a node or edge template — the binding is ignored.';

const VIRTUALIZATION_WARNING =
  '[ngDiagram] ngDiagramHidden is not supported with virtualization enabled and is ignored — ' +
  'a hidden element is removed from the virtualized render set, which destroys the template ' +
  'declaring it. Use the model-level `hidden` flag instead.';

/**
 * The `NgDiagramHiddenDirective` hides the node or edge from inside its
 * template. It is the template equivalent of the model `hidden` flag.
 *
 * ## Example usage
 * ```html
 * <!-- inside a node or edge template -->
 * <div class="my-node" [ngDiagramHidden]="collapsed()">
 *   <!-- content -->
 * </div>
 * ```
 *
 * The element is hidden when any of these applies: the model `hidden` flag,
 * this binding, a hidden ancestor group, or (for edges) a hidden endpoint
 * node. All of them feed the same effective visibility. Hidden elements stay
 * in the DOM with `display: none`, never block initialization or
 * `waitForMeasurements`, and are ignored by user interactions. Programmatic
 * APIs such as `select` do not skip hidden elements.
 *
 * Not supported with virtualization: hiding the element would remove the
 * template that holds the binding. With virtualization enabled the binding is
 * ignored and a console warning is logged. Use the model `hidden` flag
 * instead.
 *
 * @public
 * @since 1.4.0
 * @category Directives
 */
@Directive({
  selector: '[ngDiagramHidden]',
  standalone: true,
})
export class NgDiagramHiddenDirective implements OnDestroy {
  /**
   * Whether the node or edge that owns this template is hidden.
   *
   * A plain `ngDiagramHidden` attribute without a binding also works and
   * means hidden, like the native HTML `hidden` attribute.
   */
  hidden = input.required<boolean, unknown>({ alias: 'ngDiagramHidden', transform: booleanAttribute });

  private readonly nodeComponent = inject(NgDiagramNodeComponent, { optional: true });
  private readonly edgeComponent = inject(NgDiagramEdgeComponent, { optional: true });
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  /** Owner identity captured on first apply — guards teardown of replaced elements. */
  private ownerInternalId: unknown;
  private warnedVirtualization = false;
  private warnedOutsideTemplate = false;

  constructor() {
    effect(() => {
      const hidden = this.hidden();
      untracked(() => this.apply(hidden));
    });
  }

  /** @internal */
  ngOnDestroy(): void {
    const flowCore = this.flowCoreProvider.provide();

    // Skip cleanup while a new FlowCore initializes after model
    // reinitialization — old components are destroyed against the new
    // registry and must not touch it.
    if (!flowCore.isInitialized) {
      return;
    }

    if (flowCore.isVirtualizationActive) {
      // The binding never wrote the registry under virtualization.
      return;
    }

    const owner = this.resolveOwner();
    if (!owner) {
      return;
    }

    // Skip if the element was deleted or replaced (removed + re-added with
    // the same id) — a new template instance may already own the entry.
    const current = owner.kind === 'node' ? flowCore.getNodeById(owner.id) : flowCore.getEdgeById(owner.id);
    if (!current) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (this.ownerInternalId !== undefined && (current as any)._internalId !== this.ownerInternalId) {
      return;
    }

    // Clear this template's declaration; the model flag stays authoritative.
    this.writeRegistry(owner, false);
  }

  private apply(hidden: boolean): void {
    const flowCore = this.flowCoreProvider.provide();

    if (flowCore.isVirtualizationActive) {
      if (!this.warnedVirtualization) {
        this.warnedVirtualization = true;
        console.warn(VIRTUALIZATION_WARNING);
      }
      return;
    }

    const owner = this.resolveOwner();
    if (!owner) {
      if (!this.warnedOutsideTemplate) {
        this.warnedOutsideTemplate = true;
        console.warn(OUTSIDE_TEMPLATE_WARNING);
      }
      return;
    }

    if (this.ownerInternalId === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.ownerInternalId = (owner.data as any)._internalId;
    }

    this.writeRegistry(owner, hidden);
  }

  private resolveOwner(): { kind: 'node' | 'edge'; id: string; data: object } | null {
    const node = this.nodeComponent?.node();
    if (node) {
      return { kind: 'node', id: node.id, data: node };
    }

    const edge = this.edgeComponent?.edge();
    if (edge) {
      return { kind: 'edge', id: edge.id, data: edge };
    }

    return null;
  }

  private writeRegistry(owner: { kind: 'node' | 'edge'; id: string }, hidden: boolean): void {
    const registry = this.flowCoreProvider.provide().templateVisibilityRegistry;
    if (owner.kind === 'node') {
      registry.setNodeHidden(owner.id, hidden);
    } else {
      registry.setEdgeHidden(owner.id, hidden);
    }
  }
}
