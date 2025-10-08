import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  provideNgDiagram,
  type NgDiagramConfig,
} from 'ng-diagram';

// @section-start
@Component({
  // @collapse-start
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
  // @collapse-end
})
export class DiagramComponent {
  config: NgDiagramConfig = {
    // @mark-start
    edgeRouting: {
      defaultRouting: 'orthogonal', // Set default routing
      orthogonal: {
        firstLastSegmentLength: 30, // Length of first and last segments
        maxCornerRadius: 8, // Maximum radius for rounded corners
      },
      bezier: {
        bezierControlOffset: 150, // Distance of control points from nodes
      },
    },
    // @mark-end
  };
  // @collapse-start

  model = initializeModel({
    metadata: {
      viewport: { x: 0, y: 0, scale: 0.8 },
    },
    nodes: [
      {
        id: 'node1',
        position: { x: 100, y: 100 },
        data: { label: 'Source' },
      },
      {
        id: 'node2',
        position: { x: 400, y: 100 },
        data: { label: 'Target 1' },
      },
      {
        id: 'node3',
        position: { x: 400, y: 250 },
        data: { label: 'Target 2' },
      },
    ],
    edges: [
      {
        id: 'edge1',
        source: 'node1',
        sourcePort: 'port-right',
        target: 'node2',
        targetPort: 'port-left',
        // No routing specified - uses default 'orthogonal' from config
        data: {},
      },
      {
        id: 'edge2',
        source: 'node1',
        sourcePort: 'port-rigth',
        target: 'node3',
        targetPort: 'port-left',
        routing: 'bezier', // Explicitly set to bezier
        data: {},
      },
    ],
  });
  // @collapse-end
}
// @section-end
