import '@angular/compiler';

import { Component, effect, inject, untracked } from '@angular/core';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  NgDiagramEdgeTemplateMap,
  NgDiagramNodeTemplateMap,
  NgDiagramService,
  NgDiagramViewportService,
  provideNgDiagram,
  type Edge,
  type NgDiagramConfig,
} from 'ng-diagram';
import { EdgeComponent } from './edge/edge.component';
import { NodeComponent } from './node/node.component';
import { diagramModel } from './tree-data';
import { TreeService } from './tree.service';
import { EdgeTemplateType, NodeTemplateType } from './types';

@Component({
  imports: [NgDiagramComponent, NgDiagramBackgroundComponent],
  template: `
    <div class="not-content diagram" [class.ready]="isLayoutReady">
      <ng-diagram
        [model]="model"
        [config]="config"
        [nodeTemplateMap]="nodeTemplateMap"
        [edgeTemplateMap]="edgeTemplateMap"
      >
        <ng-diagram-background />
      </ng-diagram>
    </div>
  `,
  styleUrl: './diagram.component.scss',
  providers: [provideNgDiagram(), TreeService],
})
export class DiagramComponent {
  private readonly ngDiagramService = inject(NgDiagramService);
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly treeService = inject(TreeService);

  protected isLayoutReady = false;

  constructor() {
    effect(() => {
      // Use isInitialized() signal instead of onDiagramInit callback to perform initial layout
      // after change detection. onDiagramInit doesn't support async operations.
      if (this.ngDiagramService.isInitialized()) {
        untracked(async () => await this.initLayout());
      }
    });
  }

  config = {
    linking: {
      finalEdgeDataBuilder: (edge: Edge) => ({
        ...edge,
        type: EdgeTemplateType.TreeEdge,
      }),
    },
  } satisfies NgDiagramConfig;

  nodeTemplateMap = new NgDiagramNodeTemplateMap([
    [NodeTemplateType.TreeNode, NodeComponent],
  ]);

  edgeTemplateMap = new NgDiagramEdgeTemplateMap([
    [EdgeTemplateType.TreeEdge, EdgeComponent],
  ]);

  model = initializeModel(diagramModel);

  private async initLayout() {
    // Wait for all elements to be measured after layout, before we can safely call zoomToFit
    await this.ngDiagramService.transaction(
      async () => {
        await this.treeService.applyLayout();
      },
      { waitForMeasurements: true }
    );

    this.viewportService.zoomToFit();
    this.isLayoutReady = true;
  }
}
