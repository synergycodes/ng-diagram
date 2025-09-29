import '@angular/compiler';
import { ChangeDetectionStrategy, Component } from '@angular/core';
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
  selector: 'customnode',
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="not-content diagram">
      <ng-diagram
        [model]="model"
        [config]="config"
        [nodeTemplateMap]="nodeTemplateMap"
      />
    </div>
  `,
  styleUrl: './angular-material.component.scss',
})
export class AngularMaterialExampleComponent {
  nodeTemplateMap = new NgDiagramNodeTemplateMap([
    [NodeTemplateType.CustomNodeType, NodeComponent],
  ]);

  config = {
    zoom: {
      max: 3,
    },
  } satisfies NgDiagramConfig;

  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: { x: 80, y: 100 },
        size: { width: 200, height: 150 },
        type: 'customNodeType',
        data: {
          name: 'Node 1',
          description:
            'This is Node 1. This node is a custom node with a custom template.',
          tooltip: 'Node 1 is a custom node',
          status: 'orange',
        },
      },
      {
        id: '2',
        position: { x: 400, y: 100 },
        type: 'customNodeType',
        data: {
          name: 'Node 2',
          description:
            'This is Node 2. Initial status is red. This node is a custom node with a custom template.',
          tooltip: 'Node 2 is a custom node',
          status: 'red',
        },
      },
    ],
    edges: [],
    metadata: { viewport: { x: 0, y: 0, scale: 1 } },
  });
}
