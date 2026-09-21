import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  provideNgDiagram,
  type NgDiagramConfig,
} from 'ng-diagram';

@Component({
  imports: [NgDiagramComponent, NgDiagramBackgroundComponent],
  providers: [provideNgDiagram()],
  template: `
    <div class="not-content diagram">
      <ng-diagram [model]="model" [config]="config">
        <ng-diagram-background />
      </ng-diagram>
    </div>
  `,
  styles: `
    .diagram {
      display: flex;
      height: var(--ng-diagram-height);
      border: var(--ng-diagram-border);
    }
  `,
})
export class DiagramComponent {
  // @section-start:config
  config = {
    // @collapse-start:config
    zoom: {
      zoomToFit: {
        onInit: true,
        padding: 80,
      },
    },
    // @collapse-end:config
    danglingEdges: {
      // Keep edges dropped on empty canvas
      // @mark-start:config
      enabled: true,
      // @mark-end:config
      // Deleting a node detaches its edges instead of deleting them
      detachOnNodeDelete: true,
    },
  } satisfies NgDiagramConfig;
  // @section-end:config

  // @section-start:model-shape
  model = initializeModel({
    // @collapse-start:model-shape
    nodes: [
      { id: 'node-1', position: { x: 100, y: 100 }, data: { label: 'Node 1' } },
      { id: 'node-2', position: { x: 500, y: 100 }, data: { label: 'Node 2' } },
      { id: 'node-3', position: { x: 500, y: 300 }, data: { label: 'Node 3' } },
    ],
    // @collapse-end:model-shape
    edges: [
      // @collapse-start:model-shape
      {
        id: 'connected',
        source: 'node-1',
        sourcePort: 'port-right',
        target: 'node-2',
        targetPort: 'port-left',
        data: {},
      },
      // @collapse-end:model-shape
      {
        id: 'dangling',
        source: '', // free endpoint: no node, no port
        sourcePosition: { x: 200, y: 340 }, // anchored here, in flow coordinates
        target: 'node-3',
        targetPort: 'port-left',
        data: {},
      },
    ],
  });
  // @section-end:model-shape
}
