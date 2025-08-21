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
    <svg height="0" width="0">
      <defs>
        <marker
          id="custom-arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="5"
          orient="auto"
        >
          <circle cx="5" cy="5" r="4" fill="red" />
        </marker>
      </defs>
    </svg>
  `,
  styles: `
    :host {
      flex: 1;
      display: flex;
      height: 100%;

      --ngd-default-edge-stroke: white;
      --ngd-default-edge-stroke-hover: gray;
      --ngd-default-edge-stroke-selected: blue;
    }
  `,
})
export class Diagram {
  model = createSignalModel<AppMiddlewares>({
    metadata: {
      viewport: { x: 0, y: 0, scale: 0.88 },
    },
    nodes: [
      {
        id: '1',
        position: { x: 150, y: 100 },
        data: { label: 'Node 1' },
        rotatable: true,
      },
      { id: '2', position: { x: 500, y: 200 }, data: { label: 'Node 2' } },
    ],
    edges: [
      {
        id: '1',
        source: '1',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        target: '2',
        sourceArrowhead: 'custom-arrowhead',
        routing: 'bezier',
        data: {},
      },
    ],
  });
}
