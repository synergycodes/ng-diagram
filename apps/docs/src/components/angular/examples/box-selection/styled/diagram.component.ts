import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  provideNgDiagram,
} from 'ng-diagram';

// @section-start:styling
@Component({
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
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

        --ngd-box-selection-border-color: rgba(40, 255, 2, 0.5);
        --ngd-box-selection-border-size: 2px;
        --ngd-box-selection-background: rgba(0, 255, 204, 0.2);
      }
    `,
  ],
})
// @section-end:styling
export class DiagramComponent {
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
    ],
  });
}
