import '@angular/compiler';
import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  NgDiagramContextComponent,
  type NgDiagramConfig,
  type NgDiagramNodeTemplateMap,
} from '@angularflow/angular-adapter';

import { CustomNodeComponent } from './node.component';

@Component({
  selector: 'ports',
  imports: [NgDiagramComponent, NgDiagramContextComponent],
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
        }
      }
    `,
  ],
})
export class PortsWrapperComponent {
  nodeTemplateMap: NgDiagramNodeTemplateMap = new Map([
    ['myType', CustomNodeComponent],
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
        position: { x: 100, y: 100 },
        type: 'myType',
        data: {},
      },
      {
        id: '2',
        position: { x: 400, y: 100 },
        type: 'myType',
        data: {},
      },
    ],
    edges: [
      {
        id: '1',
        data: {},
        source: '1',
        target: '2',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        sourceArrowhead: 'ng-diagram-arrow',
      },
    ],
    metadata: { viewport: { x: 0, y: 0, scale: 1 } },
  });
}
