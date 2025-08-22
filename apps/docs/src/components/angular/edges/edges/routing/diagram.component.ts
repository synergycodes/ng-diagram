import '@angular/compiler';

import { Component } from '@angular/core';
import {
  NgDiagramComponent,
  NgDiagramContextComponent,
  type AppMiddlewares,
} from '@angularflow/angular-adapter';
import { createSignalModel } from '@angularflow/angular-signals-model';

@Component({
  imports: [NgDiagramContextComponent, NgDiagramComponent],
  template: `
    <ng-diagram-context>
      <ng-diagram [model]="model" />
    </ng-diagram-context>
  `,
  styles: `
    :host {
      flex: 1;
      display: flex;
      height: 100%;
    }
  `,
})
export class Diagram {
  model = createSignalModel<AppMiddlewares>({
    metadata: {
      viewport: { x: 0, y: 0, scale: 0.7 },
    },
    nodes: [
      {
        id: 'source-node',
        position: { x: 200, y: 250 },
        data: { label: 'Node 1' },
        rotatable: true,
      },
      { id: '2', position: { x: 600, y: 50 }, data: { label: 'Straight' } },
      { id: '3', position: { x: 600, y: 200 }, data: { label: 'Orthogonal' } },
      { id: '4', position: { x: 600, y: 350 }, data: { label: 'Bezier' } },
    ],
    edges: [
      {
        id: '1',
        source: 'source-node',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        target: '2',
        routing: 'straight',
        data: {},
      },
      {
        id: '2',
        source: 'source-node',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        target: '3',
        routing: 'orthogonal',
        data: {},
      },
      {
        id: '3',
        source: 'source-node',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        target: '4',
        routing: 'bezier',
        data: {},
      },
    ],
  });
}
