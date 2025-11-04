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
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="not-content diagram flex h-[30rem]">
      <ng-diagram
        [model]="model"
        [config]="config"
        [nodeTemplateMap]="nodeTemplateMap"
      />
    </div>
  `,
})
export class DiagramComponent {
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
        type: 'customNodeType',
        data: {
          name: 'Node 1',
          description: 'This is Tailwind Node 1',
          tooltip: 'Styles are applied with Tailwind CSS',
        },
        rotatable: true,
        resizable: true,
      },
      {
        id: '2',
        position: { x: 450, y: 100 },
        type: 'customNodeType',
        data: {
          name: 'Node 2',
          description: 'This is Tailwind Node 2',
          tooltip: 'Styles are applied with Tailwind CSS',
        },
        rotatable: true,
        resizable: true,
        angle: 30,
      },
    ],
    edges: [
      {
        id: '1',
        source: '1',
        target: '2',
        data: {},
        sourcePort: 'port-right',
        targetPort: 'port-left',
        sourceArrowhead: 'ng-diagram-arrow',
      },
    ],
  });
}
