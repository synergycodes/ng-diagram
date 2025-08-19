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
        <ng-diagram [model]="model" [config]="config" [nodeTemplateMap]="nodeTemplateMap" />
      </div>
    </ng-diagram-context>
  `,
  styles: [
    `
      :host {
        flex: 1;
        display: flex;
      }
      .diagram {
        flex: 1;
        display: flex;
        height: 20rem;
        font-family: 'Poppins', sans-serif;
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
