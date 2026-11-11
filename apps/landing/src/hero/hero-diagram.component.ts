import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, NgZone, output } from '@angular/core';
import {
  type DiagramInitEvent,
  initializeModel,
  NgDiagramComponent,
  type NgDiagramConfig,
  NgDiagramModelService,
  NgDiagramNodeTemplateMap,
  NgDiagramViewportService,
  provideNgDiagram,
  type Rect,
} from 'ng-diagram';
// The diagram content is the docs example "Landing Page Diagram". Its node components and
// data stay in apps/docs, where the example page also shows their source.
import {
  DIAGRAM_EDGES,
  DIAGRAM_NODES,
} from '../../../docs/src/components/angular/examples/landing-page-diagram/diagram/diagram-data.config';
import { GraphNodeComponent } from '../../../docs/src/components/angular/examples/landing-page-diagram/graph-node/graph-node.component';
import { GroupNodeComponent } from '../../../docs/src/components/angular/examples/landing-page-diagram/group-node/group-node.component';
import { UserPanelNodeComponent } from '../../../docs/src/components/angular/examples/landing-page-diagram/user-panel-node/user-panel-node.component';
import { WorkflowNodeComponent } from '../../../docs/src/components/angular/examples/landing-page-diagram/workflow-node/workflow-node.component';

/**
 * The live hero diagram. It fills the whole hero, while its content is scaled and centred on
 * the `stage` element, so dragged nodes can travel across the hero outside the stage.
 *
 * The page keeps the keyboard: the diagram is not a Tab stop, has no shortcuts, and never
 * zooms. Plain wheel scrolls the page because viewport panning is off.
 */
@Component({
  selector: 'landing-hero-diagram',
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  styleUrls: [
    '../../../docs/src/components/angular/examples/landing-page-diagram/diagram/tokens.scss',
    './hero-diagram.component.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-diagram
      [model]="model"
      [config]="config"
      [nodeTemplateMap]="nodeTemplateMap"
      [tabbable]="false"
      (diagramInit)="onDiagramInit($event)"
    />
  `,
})
export class HeroDiagramComponent {
  /** Element that covers the whole hero; the diagram canvas has the same rectangle. */
  readonly host = input.required<HTMLElement>();
  /** Element the diagram content is fitted into. */
  readonly stage = input.required<HTMLElement>();
  /** Emits once, after the content was fitted to the stage for the first time. */
  readonly fitted = output<void>();

  private readonly viewport = inject(NgDiagramViewportService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  /** Content bounds taken once after init, so dragging a node never rescales the diagram. */
  private contentBounds: Rect | null = null;
  private frame = 0;
  private hasFitted = false;

  readonly nodeTemplateMap = new NgDiagramNodeTemplateMap([
    ['workflow', WorkflowNodeComponent],
    ['group', GroupNodeComponent],
    ['userPanel', UserPanelNodeComponent],
    ['graph', GraphNodeComponent],
  ]);

  readonly config: NgDiagramConfig = {
    edgeRouting: { defaultRouting: 'orthogonal' },
    resize: { allowResizeBelowChildrenBounds: false },
    selectionMoving: { edgePanningEnabled: false },
    linking: { edgePanningEnabled: false },
    zoom: { step: 0, max: 1, zoomToFit: { onInit: false } },
    viewportPanningEnabled: false,
    shortcuts: [],
    hideWatermark: true,
  };

  readonly model = initializeModel({ nodes: DIAGRAM_NODES, edges: DIAGRAM_EDGES });

  onDiagramInit({ nodes, edges }: DiagramInitEvent): void {
    const bounds = this.modelService.computePartsBounds(nodes, edges);
    if (!bounds.width || !bounds.height) {
      return;
    }
    this.contentBounds = bounds;

    this.zone.runOutsideAngular(() => {
      const observer = new ResizeObserver(() => this.scheduleFit());
      observer.observe(this.host());
      observer.observe(this.stage());
      this.destroyRef.onDestroy(() => {
        observer.disconnect();
        cancelAnimationFrame(this.frame);
      });
    });
    this.scheduleFit();
  }

  private scheduleFit(): void {
    if (this.frame) {
      return;
    }
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.zone.run(() => this.fit());
    });
  }

  private async fit(): Promise<void> {
    const bounds = this.contentBounds;
    if (!bounds) {
      return;
    }
    const host = this.host().getBoundingClientRect();
    const stage = this.stage().getBoundingClientRect();
    if (!stage.width || !stage.height) {
      return;
    }

    const scale = Math.min(stage.width / bounds.width, stage.height / bounds.height, 1);
    const x = stage.left - host.left + (stage.width - bounds.width * scale) / 2 - bounds.x * scale;
    const y = stage.top - host.top + (stage.height - bounds.height * scale) / 2 - bounds.y * scale;
    await this.viewport.setViewport(x, y, scale);

    if (!this.hasFitted) {
      this.hasFitted = true;
      this.fitted.emit();
    }
  }
}
