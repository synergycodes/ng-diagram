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
  // @mark-substring [model]="model"
  template: `
    <div class="not-content diagram">
      <ng-diagram [model]="model" />
    </div>
  `,
  styles: [
    `
      .diagram {
        display: flex;
        height: 20rem;
      }
    `,
  ],
})
export class DiagramComponent {
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
