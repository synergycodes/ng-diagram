import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  provideNgDiagram,
} from 'ng-diagram';

// @section-start
@Component({
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `
    <ng-diagram [model]="model" />
    <svg height="0" width="0">
      <defs>
        <!-- @mark-start -->
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
        <!-- @mark-end -->
      </defs>
    </svg>
  `,
  styles: `
    :host {
      // @collapse-start
      flex: 1;
      display: flex;
      height: 100%;
      // @collapse-end
      // @mark-start
      --ngd-default-edge-stroke: #cccccc;
      --ngd-default-edge-stroke-hover: gray;
      --ngd-default-edge-stroke-selected: blue;
      // @mark-end
    }
  `,
})
export class Diagram {
  model = initializeModel({
    // @collapse-start
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
      // @collapse-end
    ],
    edges: [
      {
        // @collapse-start
        id: '1',
        source: '1',
        sourcePort: 'port-right',
        target: '2',
        targetPort: 'port-left',
        data: {},
        // @collapse-end
        // @mark-start
        targetArrowhead: 'custom-arrowhead',
        routing: 'bezier',
        // @mark-end
      },
    ],
  });
}
// @section-end
