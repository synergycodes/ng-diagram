import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  provideNgDiagram,
} from 'ng-diagram';

@Component({
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `
    <div class="not-content diagram">
      <ng-diagram [model]="model" />
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
  // @section-start
  model = initializeModel({
    // @collapse-start
    metadata: {
      viewport: { x: 0, y: -50, scale: 1 },
    },
    nodes: [
      {
        id: '1',
        position: { x: 100, y: 100 },
        data: { label: 'Source Node' },
      },
      {
        id: '2',
        position: { x: 400, y: 100 },
        data: { label: 'Target Node' },
      },
      {
        id: '3',
        position: { x: 100, y: 250 },
        data: { label: 'Bidirectional' },
      },
      {
        id: '4',
        position: { x: 400, y: 250 },
        data: { label: 'Connection' },
      },
    ],
    // @collapse-end
    edges: [
      {
        // @mark-start
        targetArrowhead: 'ng-diagram-arrow',
        // @mark-end
        // @collapse-start
        id: '1',
        source: '1',
        sourcePort: 'port-right',
        target: '2',
        targetPort: 'port-left',
        data: {},
        routing: 'straight',
        // @collapse-end
      },
      {
        // @mark-start
        sourceArrowhead: 'ng-diagram-arrow',
        targetArrowhead: 'ng-diagram-arrow',
        // @mark-end
        // @collapse-start
        id: '2',
        source: '3',
        sourcePort: 'port-right',
        target: '4',
        targetPort: 'port-left',
        data: {},
        routing: 'straight',
        // @collapse-end
      },
    ],
  });
}
// @section-end
