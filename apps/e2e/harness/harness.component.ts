import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramClipboardService,
  NgDiagramComponent,
  NgDiagramGroupsService,
  NgDiagramModelService,
  NgDiagramNodeService,
  NgDiagramSelectionService,
  NgDiagramService,
  NgDiagramViewportService,
  provideNgDiagram,
} from 'ng-diagram';
import type { HarnessBridge } from './api';
import { DEFAULT_E2E_MODEL } from './default-model';

declare global {
  interface Window extends HarnessBridge {}
}

@Component({
  selector: 'harness-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDiagramComponent, NgDiagramBackgroundComponent],
  providers: [provideNgDiagram()],
  template: `
    <div class="diagram-container" data-testid="diagram-container">
      <ng-diagram [model]="model()" [config]="config" (diagramInit)="onDiagramInit()">
        <ng-diagram-background type="grid"></ng-diagram-background>
      </ng-diagram>
    </div>
  `,
  styles: [
    `
      .diagram-container {
        width: 100vw;
        height: 100vh;
        background: #fafafa;
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
