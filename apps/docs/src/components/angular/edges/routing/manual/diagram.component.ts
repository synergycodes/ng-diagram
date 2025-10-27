import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  provideNgDiagram,
  type NgDiagramConfig,
} from 'ng-diagram';

@Component({
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `
    <div class="not-content diagram">
      <ng-diagram [model]="model" [config]="config" />
    </div>
  `,
  styles: `
    .diagram {
      display: flex;
      height: 20rem;
    }
  `,
})
export class DiagramComponent {
  // @collapse-start
  config = {
    zoom: {
      zoomToFit: {
        onInit: true,
      },
    },
  } satisfies NgDiagramConfig;
  // @collapse-end

  // @section-start
  model = initializeModel({
    // @collapse-start
    nodes: [
      {
        id: 'node1',
        position: { x: 100, y: 150 },
        data: { label: 'Move me!' },
        rotatable: true,
      },
      {
        id: 'node2',
        position: { x: 500, y: 150 },
        data: { label: 'Move me too!' },
        rotatable: true,
      },
    ],
    // @collapse-end
    edges: [
      {
        id: 'manual-edge',
        source: 'node1',
        sourcePort: 'port-right',
        target: 'node2',
        targetPort: 'port-left',
        // @mark-start
        routing: 'orthogonal',
        routingMode: 'manual',
        points: [
          { x: 285, y: 172 },
          { x: 345, y: 172 },
          { x: 345, y: 100 },
          { x: 445, y: 100 },
          { x: 445, y: 172 },
          { x: 500, y: 172 },
        ],
        // @mark-end
        data: {},
      },
    ],
  });
}
// @section-end
