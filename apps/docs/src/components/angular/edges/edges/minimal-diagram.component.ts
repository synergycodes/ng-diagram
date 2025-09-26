import '@angular/compiler';

import { Component } from '@angular/core';
// @collapse-start
import {
  initializeModel,
  NgDiagramComponent,
  provideNgDiagram,
} from 'ng-diagram';
// @collapse-end

@Component({
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `<ng-diagram [model]="model" />`,
})
export class Diagram {
  model = initializeModel({
    // @collapse-start
    nodes: [
      {
        id: '1',
        position: {
          x: 0,
          y: 0,
        },
        // @mark-start
        data: { label: 'Node 1' },
        // @mark-end
      },
      // @mark-start
      {
        id: '2',
        position: {
          x: 100,
          y: 100,
        },
        data: { label: 'Node 2' },
      },
      // @mark-end
    ],
    // @collapse-end
    // @mark-start
    edges: [
      {
        id: '1',
        source: '1',
        sourcePort: 'port-right',
        target: '2',
        targetPort: 'port-left',
        data: {},
      },
    ],
    // @mark-end
  });
}
