import '@angular/compiler';
import { ChangeDetectionStrategy, Component, Type } from '@angular/core';
import {
  NgDiagramComponent,
  NgDiagramContextComponent,
  type NgDiagramConfig,
  type NgDiagramGroupNodeTemplate,
  type NgDiagramNodeTemplate,
  type NgDiagramNodeTemplateMap,
} from '@angularflow/angular-adapter';
import { createSignalModel } from '@angularflow/angular-signals-model';

import { NodeComponent } from './node/node.component';

enum NodeTemplateType {
  CustomNodeType = 'customNodeType',
}

@Component({
  selector: 'customnode',
  imports: [NgDiagramComponent, NgDiagramContextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-diagram-context>
      <div class="not-content diagram">
        <ng-diagram
          [model]="model"
          [config]="config"
          [nodeTemplateMap]="nodeTemplateMap"
        />
      </div>
    </ng-diagram-context>
  `,
  styles: [
    `
      :host {
        flex: 1;
        display: flex;

        .diagram {
          flex: 1;
          display: flex;
          height: 20rem;
          font-family: 'Poppins', sans-serif;
        }
      }
    `,
  ],
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
        position: { x: 80, y: 100 },
        type: 'customNodeType',
        data: {
          name: 'Node 1',
          description: 'This is Node 1',
          tooltip: 'Node 1 is a custom node',
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
          description: 'This is Node 2',
          tooltip: 'Node 2 is a custom node',
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
    metadata: { viewport: { x: 0, y: 0, scale: 1 } },
  });
}
