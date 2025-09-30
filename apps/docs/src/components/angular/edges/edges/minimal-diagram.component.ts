import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  provideNgDiagram,
} from 'ng-diagram';

// @section-start:adding-edges
@Component({
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `<ng-diagram [model]="model" />`,
})
export class Diagram {
  // @section-start:ports
  model = initializeModel({
    // @collapse-start:adding-edges
    // @collapse-start:ports
    nodes: [
      {
        id: '1',
        position: {
          x: 0,
          y: 0,
        },
        // @mark-start:else
        data: { label: 'Node 1' },
        // @mark-end:else
      },
      // @mark-start:else
      {
        id: '2',
        position: {
          x: 100,
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
