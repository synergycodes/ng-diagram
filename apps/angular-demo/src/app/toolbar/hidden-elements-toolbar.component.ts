import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import {
  GroupNode,
  NgDiagramModelService,
  NgDiagramSelectionService,
  NgDiagramService,
  NgDiagramViewportService,
  Node,
} from 'ng-diagram';
import { COLLAPSIBLE_GROUP_ID, FAR_NODE_ID } from '../data/hidden-elements-model';

const isGroupNode = (node: Node): node is GroupNode => 'isGroup' in node && node.isGroup === true;

@Component({
  selector: 'app-hidden-elements-toolbar',
  styleUrl: './toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <button (click)="exit.emit()">Exit</button>
      <span class="separator">|</span>
      <button (click)="toggleGroup()">{{ isCollapsed() ? 'Expand demo group' : 'Collapse demo group' }}</button>
      <button (click)="toggleSelectedGroups()" [disabled]="selectedGroups().length === 0">
        {{ isSelectedCollapsed() ? 'Expand selected group' : 'Collapse selected group' }}
      </button>
      <label class="demo-toggle">
        <input type="checkbox" [checked]="wholeGroupHidden()" (change)="toggleWholeGroup()" />
        Hide whole group (inheritance)
      </label>
      <span class="separator">|</span>
      <span class="group-label">Per child:</span>
      @for (child of groupChildren(); track child.id) {
        <label class="demo-toggle">
          <input type="checkbox" [checked]="!!child.hidden" (change)="toggleChild(child.id, !child.hidden)" />
          {{ child.id }}
        </label>
      }
      <span class="separator">|</span>
      <label class="demo-toggle">
        <input type="checkbox" [checked]="farNodeHidden()" (change)="toggleFarNode()" />
        Hide far node (then Zoom to Fit)
      </label>
      <span class="separator">|</span>
      <label class="demo-toggle">
        <input type="checkbox" [checked]="ghostsRevealed()" (change)="toggleGhosts()" />
        Reveal hidden as ghosts
      </label>
      <button (click)="toggleDebugMode()">{{ debugModeEnabled() ? 'Disable' : 'Enable' }} debug mode</button>
      <button (click)="logDomProof()">Log DOM proof</button>
      <button (click)="zoomToFit()">Zoom to Fit</button>
      <span class="group-label">
        Effectively hidden: {{ hiddenNodeCount() }} node(s), {{ hiddenEdgeCount() }} edge(s) — all still in the model
        and mounted in the DOM as display: none.
      </span>
    </div>
  `,
})
export class HiddenElementsToolbarComponent {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly ngDiagramService = inject(NgDiagramService);
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly viewportService = inject(NgDiagramViewportService);

  exit = output<void>();
  /** Toggles the ghost-reveal CSS class on the diagram container. */
  revealGhosts = output<boolean>();

  protected readonly ghostsRevealed = signal(false);

  protected readonly groupChildren = computed(() =>
    this.modelService.nodes().filter((node) => node.groupId === COLLAPSIBLE_GROUP_ID)
  );

  protected readonly isCollapsed = computed(() => this.groupChildren().some((node) => node.hidden));

  // Read through the reactive nodes() signal — getNodeById is a plain lookup
  // and would leave these computeds stale after the first toggle.
  protected readonly wholeGroupHidden = computed(
    () => !!this.modelService.nodes().find((node) => node.id === COLLAPSIBLE_GROUP_ID)?.hidden
  );

  protected readonly farNodeHidden = computed(
    () => !!this.modelService.nodes().find((node) => node.id === FAR_NODE_ID)?.hidden
  );

  /** Effective visibility (computedHidden) — includes inherited hiding. */
  protected readonly hiddenNodeCount = computed(
    () => this.modelService.nodes().filter((node) => node.computedHidden).length
  );

  protected readonly hiddenEdgeCount = computed(
    () => this.modelService.edges().filter((edge) => edge.computedHidden).length
  );

  toggleGroup(): void {
    const hidden = !this.isCollapsed();
    this.modelService.updateNodes(this.groupChildren().map(({ id }) => ({ id, hidden })));
  }

  /** Groups in the current selection — the target of the selected-group collapse. */
  protected readonly selectedGroups = computed(() => this.selectionService.selection().nodes.filter(isGroupNode));

  private readonly selectedGroupChildren = computed(() => {
    const groupIds = new Set(this.selectedGroups().map((group) => group.id));
    return this.modelService.nodes().filter((node) => node.groupId !== undefined && groupIds.has(node.groupId));
  });

  protected readonly isSelectedCollapsed = computed(() => this.selectedGroupChildren().some((node) => node.hidden));

  /** Collapses/expands every selected group by toggling the `hidden` flag of its direct children. */
  toggleSelectedGroups(): void {
    const children = this.selectedGroupChildren();
    if (children.length === 0) {
      return;
    }
    const hidden = !this.isSelectedCollapsed();
    this.modelService.updateNodes(children.map(({ id }) => ({ id, hidden })));
  }

  toggleChild(id: string, hidden: boolean): void {
    this.modelService.updateNode(id, { hidden });
  }

  /**
   * Hides the group node itself — its children (and their edges) disappear
   * through inheritance even when their own `hidden` flags are false.
   */
  toggleWholeGroup(): void {
    this.modelService.updateNode(COLLAPSIBLE_GROUP_ID, { hidden: !this.wholeGroupHidden() });
  }

  /**
   * The far node sits well outside the rest of the content — hiding it and
   * pressing Zoom to Fit visibly tightens the frame, because hidden geometry
   * is excluded from the bounds.
   */
  toggleFarNode(): void {
    this.modelService.updateNode(FAR_NODE_ID, { hidden: !this.farNodeHidden() });
  }

  toggleGhosts(): void {
    this.ghostsRevealed.update((revealed) => !revealed);
    this.revealGhosts.emit(this.ghostsRevealed());
  }

  protected readonly debugModeEnabled = computed(() => this.ngDiagramService.config().debugMode || false);

  /** Debug mode registers the logger middleware and exposes window.flowCore for console inspection. */
  toggleDebugMode(): void {
    this.ngDiagramService.updateConfig({ debugMode: !this.debugModeEnabled() });
  }

  /**
   * Proves hidden elements are still present: for every effectively hidden
   * node/edge, logs its model geometry and whether its host element is
   * mounted in the DOM (as display: none).
   */
  logDomProof(): void {
    const rows = [
      ...this.modelService
        .nodes()
        .filter((node) => node.computedHidden)
        .map((node) => ({ kind: 'node', id: node.id, selector: `[data-node-id="${node.id}"]`, size: node.size })),
      ...this.modelService
        .edges()
        .filter((edge) => edge.computedHidden)
        .map((edge) => ({ kind: 'edge', id: edge.id, selector: `[data-edge-id="${edge.id}"]`, size: undefined })),
    ].map(({ kind, id, selector, size }) => {
      const element = document.querySelector<HTMLElement>(selector);
      return {
        kind,
        id,
        mountedInDom: !!element,
        display: element ? getComputedStyle(element).display : '—',
        modelSize: size ? `${size.width}×${size.height}` : '—',
      };
    });

    console.table(rows);
  }

  zoomToFit(): void {
    this.viewportService.zoomToFit();
  }
}
