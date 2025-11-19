// @section-start:adding-edges
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
  styles: [
    `
      .diagram {
        display: flex;
        height: var(--ng-diagram-height);
        border: var(--ng-diagram-border);
      }
    `,
  ],
})
export class DiagramComponent {
  config = {
    zoom: {
      zoomToFit: {
        onInit: true,
        padding: 120,
      },
    },
  } satisfies NgDiagramConfig;

  // @section-start:ports
  model = initializeModel({
    // @collapse-start:adding-edges
    // @collapse-start:ports
    nodes: [
      {
        id: '1',
        position: {
          x: 100,
          y: 100,
        },
        // @mark-start:else
        data: { label: 'Node 1' },
        // @mark-end:else
      },
      // @mark-start:else
      {
        id: '2',
        position: {
          x: 500,
          y: 100,
        },
        data: { label: 'Node 2' },
      },
      // @mark-end:else
    ],
    // @collapse-end:adding-edges
    // @collapse-end:ports
    // @mark-start:adding-edges
    edges: [
      {
        id: '1',
        source: '1',
        // @mark-start:ports
        sourcePort: 'port-right',
        // @mark-end:ports
        target: '2',
        // @mark-start:ports
        targetPort: 'port-left',
        // @mark-end:ports
        data: {},
      },
    ],
    // @mark-end:adding-edges
  });
  // @section-end:ports
}
// @section-end:adding-edges
