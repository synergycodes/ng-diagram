import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  provideNgDiagram,
} from 'ng-diagram';

@Component({
  // @collapse-start
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: ` <ng-diagram [model]="model" /> `,
  styles: `
    :host {
      flex: 1;
      display: flex;
      height: 100%;
    }
  `,
  // @collapse-end
})
export class Diagram {
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
