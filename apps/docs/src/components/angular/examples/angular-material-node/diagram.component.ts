import '@angular/compiler';
import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  NgDiagramNodeTemplateMap,
  provideNgDiagram,
  type NgDiagramConfig,
} from 'ng-diagram';

import { NodeComponent } from './node/node.component';

enum NodeTemplateType {
  CustomNodeType = 'customNodeType',
}

@Component({
  imports: [NgDiagramComponent, NgDiagramBackgroundComponent],
  providers: [provideNgDiagram()],
  template: `
    <div class="not-content diagram">
      <ng-diagram
        [model]="model"
        [config]="config"
        [nodeTemplateMap]="nodeTemplateMap"
      >
        <ng-diagram-background />
      </ng-diagram>
    </div>
  `,
  styleUrl: './diagram.component.scss',
})
export class DiagramComponent {
  nodeTemplateMap = new NgDiagramNodeTemplateMap([
    [NodeTemplateType.CustomNodeType, NodeComponent],
  ]);

  config = {
    zoom: {
      max: 3,
      zoomToFit: {
        onInit: true,
        padding: 100,
      },
    },
  } satisfies NgDiagramConfig;

  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: { x: 50, y: 0 },
        type: 'customNodeType',
        data: {
          name: 'Node 1',
          description:
            'This is Node 1. This node is a custom node with a custom template.',
          tooltip: 'Node 1 is a custom node',
          status: 'Active',
        },
      },
      {
        id: '2',
        position: { x: 400, y: 0 },
        type: 'customNodeType',
        data: {
          name: 'Node 2',
          description:
            'This is Node 2. Initial status is red. This node is a custom node with a custom template.',
          tooltip: 'Node 2 is a custom node',
          status: 'Error',
        },
      },
    ],
  });
}
