import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { NgDiagramModelService, NgDiagramViewportService } from 'ng-diagram';
import { COLLAPSIBLE_GROUP_ID, FAR_NODE_ID } from '../data/hidden-elements-model';

@Component({
  selector: 'app-hidden-elements-toolbar',
  styleUrl: './toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <button (click)="exit.emit()">Exit</button>
      <span class="separator">|</span>
      <button (click)="toggleGroup()">{{ isCollapsed() ? 'Expand Group' : 'Collapse Group' }}</button>
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
