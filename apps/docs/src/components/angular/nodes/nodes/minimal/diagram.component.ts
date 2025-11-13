// @section-start
import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  provideNgDiagram,
} from 'ng-diagram';

@Component({
  imports: [NgDiagramComponent, NgDiagramBackgroundComponent],
  providers: [provideNgDiagram()],
  // @mark-substring [model]="model"
  template: `
    <div class="not-content diagram">
      <ng-diagram [model]="model">
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
