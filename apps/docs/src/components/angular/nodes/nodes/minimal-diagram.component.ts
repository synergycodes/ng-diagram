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
  template: ` <ng-diagram [model]="model" /> `,
})
export class Diagram {
  model = initializeModel({
    nodes: [
      // @mark-start
      {
        id: '1',
        position: {
          x: 0,
          y: 0,
        },
        data: { label: 'Node 1' },
      },
      // @mark-end
    ],
  });
}
// @section-end
