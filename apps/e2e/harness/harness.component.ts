import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramClipboardService,
  NgDiagramComponent,
  NgDiagramEdgeTemplateMap,
  NgDiagramGroupsService,
  NgDiagramModelService,
  NgDiagramNodeService,
  NgDiagramNodeTemplateMap,
  type NgDiagramPaletteItem,
  NgDiagramPaletteItemComponent,
  NgDiagramPaletteItemPreviewComponent,
  NgDiagramSelectionService,
  NgDiagramService,
  NgDiagramViewportService,
  provideNgDiagram,
} from 'ng-diagram';
import type { HarnessBridge } from './api';
import { DEFAULT_E2E_MODEL } from './default-model';
import { DirectiveHiddenNodeComponent } from './directive-hidden-node.component';
import { HiddenPortsNodeComponent } from './hidden-ports-node.component';
import { LabelledEdgeComponent } from './labelled-edge.component';
import { ResizeSidesNodeComponent } from './resize-sides-node.component';

declare global {
  interface Window extends HarnessBridge {}
}

@Component({
  selector: 'harness-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgDiagramComponent,
    NgDiagramBackgroundComponent,
    NgDiagramPaletteItemComponent,
    NgDiagramPaletteItemPreviewComponent,
  ],
  providers: [provideNgDiagram()],
  template: `
    <div class="shell" [class.with-palette]="showPalette">
      @if (showPalette) {
        <!-- Deliberately unpositioned: an app whose palette panel establishes no containing block
             is the shape in which an unclipped preview reaches the document's scroll area. -->
        <div class="palette-panel" data-testid="palette-panel">
          @for (paletteItem of paletteItems; track paletteItem.type) {
            <ng-diagram-palette-item [item]="paletteItem">
              <div class="palette-item" data-testid="palette-item">{{ paletteItem.type }}</div>
              <ng-diagram-palette-item-preview>
                <div class="palette-preview" [class.wide]="paletteItem.type === 'wide'" data-testid="palette-preview">
                  {{ paletteItem.type }}
                </div>
              </ng-diagram-palette-item-preview>
            </ng-diagram-palette-item>
          }
        </div>
      }
      <div class="diagram-container" data-testid="diagram-container">
        <ng-diagram
          [model]="model()"
          [config]="config"
          [tabbable]="tabbable"
          [nodeTemplateMap]="nodeTemplateMap"
          [edgeTemplateMap]="edgeTemplateMap"
          (diagramInit)="onDiagramInit()"
        >
          <ng-diagram-background type="grid"></ng-diagram-background>
        </ng-diagram>
      </div>
    </div>
  `,
  styles: [
    `
      .diagram-container {
        width: 100vw;
        height: 100vh;
        background: #fafafa;
      }

      .shell.with-palette {
        display: flex;
        width: 100vw;
        height: 100vh;
      }

      .shell.with-palette .diagram-container {
        flex: 1;
        width: auto;
        height: auto;
      }

      .palette-panel {
        width: 240px;
        padding: 16px;
        box-sizing: border-box;
        background: #fff;
      }

      .palette-item {
        width: 100%;
        height: 40px;
        border: 1px solid #333;
      }

      /* Fixed size, so the drag image's expected dimensions are exact. */
      .palette-preview {
        width: 340px;
        height: 200px;
        border: 2px solid #333;
        box-sizing: border-box;
      }

      /*
       * Wider than both a fixed 1000px park offset and the viewport: parking by offset would put
       * this preview's right edge on-screen, and a shrink-to-fit drag image would wrap its lines.
       */
      .palette-preview.wide {
        width: 1300px;
        height: 60px;
      }
    `,
  ],
})
export class HarnessComponent {
  private readonly ngDiagramService = inject(NgDiagramService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly nodeService = inject(NgDiagramNodeService);
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly groupsService = inject(NgDiagramGroupsService);
  private readonly clipboardService = inject(NgDiagramClipboardService);

  readonly model = signal(initializeModel(window.__diagramSeed ?? DEFAULT_E2E_MODEL));
  readonly config = window.__diagramConfig ?? {};
  readonly showPalette = window.__diagramPalette ?? false;
  readonly paletteItems: NgDiagramPaletteItem[] = [
    { type: 'alpha', data: { label: 'Alpha' } },
    { type: 'beta', data: { label: 'Beta' } },
    { type: 'wide', data: { label: 'Wide' } },
  ];
  readonly tabbable = window.__diagramTabbable ?? true;
  readonly nodeTemplateMap = new NgDiagramNodeTemplateMap([
    ['resize-sides', ResizeSidesNodeComponent],
    ['hidden-ports', HiddenPortsNodeComponent],
    ['directive-hidden', DirectiveHiddenNodeComponent],
  ]);
  readonly edgeTemplateMap = new NgDiagramEdgeTemplateMap([['labelled', LabelledEdgeComponent]]);

  onDiagramInit(): void {
    window.__diagram = {
      diagram: this.ngDiagramService,
      model: this.modelService,
      nodes: this.nodeService,
      selection: this.selectionService,
      viewport: this.viewportService,
      groups: this.groupsService,
      clipboard: this.clipboardService,
    };
    window.__diagramReady = true;
  }
}
