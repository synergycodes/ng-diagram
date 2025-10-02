import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  provideNgDiagram,
} from 'ng-diagram';

// @section-start
@Component({
  // @collapse-start
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `
    <div class="not-content rotatable-resizable-diagram">
      <ng-diagram [model]="model" />
    </div>
  `,
  styles: `
    .rotatable-resizable-diagram {
      display: flex;
      height: 20rem;
    }
  `,
  // @collapse-end
})
export class DiagramComponent {
  model = initializeModel({
    // @collapse-start
    metadata: {
      viewport: { x: 222, y: 130, scale: 1.6 },
    },
    // @collapse-end
    nodes: [
      {
        id: '1',
        position: { x: 0, y: 0 },
        data: { label: 'Node 1' },
        // @mark-start
        rotatable: true,
        resizable: true,
        // @mark-end
      },
    ],
  });
}
// @section-end
