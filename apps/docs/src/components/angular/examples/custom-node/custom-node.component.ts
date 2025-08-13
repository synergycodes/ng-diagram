import '@angular/compiler';
import { ChangeDetectionStrategy, Component, Type } from '@angular/core';
import {
  createSignalModel,
  NgDiagramComponent,
  NgDiagramContextComponent,
  type NgDiagramConfig,
  type NgDiagramGroupNodeTemplate,
  type NgDiagramNodeTemplate,
  type NgDiagramNodeTemplateMap,
} from '@angularflow/angular-adapter';

import { NodeComponent } from './node/node.component';

enum NodeTemplateType {
  CustomNodeType = 'customNodeType',
}
@Component({
  selector: 'customnode',
  templateUrl: './custom-node.component.html',
  styleUrl: './custom-node.component.scss',
  imports: [NgDiagramComponent, NgDiagramContextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomNodeComponent {
  nodeTemplateMap: NgDiagramNodeTemplateMap = new Map<
    NodeTemplateType,
    Type<NgDiagramNodeTemplate> | Type<NgDiagramGroupNodeTemplate>
  >([[NodeTemplateType.CustomNodeType, NodeComponent]]);

  config = {
    zoom: {
      max: 3,
    },
  } satisfies NgDiagramConfig;

  model = createSignalModel({
    nodes: [
      {
        id: '1',
        position: { x: 100, y: 50 },
        type: 'customNodeType',
        data: {
          name: 'Node 1',
          description: 'This is Node 1',
          tooltip: 'Node 1 is a custom node',
        },
      },
    ],
    edges: [],
    metadata: { viewport: { x: 0, y: 0, scale: 1.25 } },
  });
}
