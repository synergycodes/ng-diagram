import '@angular/compiler';
import { Component } from '@angular/core';
import {
  initializeModel,
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
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `
    <div class="not-content diagram">
      <ng-diagram
        [model]="model"
        [config]="config"
        [nodeTemplateMap]="nodeTemplateMap"
      />
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
      },
    },
  } satisfies NgDiagramConfig;

  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: { x: 50, y: 20 },
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
        position: { x: 400, y: 20 },
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
