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
  template: `<ng-diagram [model]="model" />`,
})
export class Diagram {
  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: {
          x: 0,
          y: 0,
        },
        data: { label: 'Node 1' },
      },
      {
        id: '2',
        position: {
          x: 100,
          y: 100,
        },
        data: { label: 'Node 2' },
      },
    ],
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
  });
}
