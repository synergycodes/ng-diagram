import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  NgDiagramContextComponent,
} from '@angularflow/angular-adapter';

@Component({
  imports: [NgDiagramContextComponent, NgDiagramComponent],
  template: `
    <ng-diagram-context>
      <ng-diagram [model]="model" />
    </ng-diagram-context>
  `,
  styles: `
    :host {
      flex: 1;
      display: flex;
      height: 100%;
    }
  `,
})
export class Diagram {
  model = initializeModel({
    metadata: {
      viewport: { x: 222, y: 130, scale: 1.6 },
    },
    nodes: [
      {
        id: '1',
        position: { x: 0, y: 0 },
        data: { label: 'Node 1' },
        rotatable: true,
        resizable: true,
      },
    ],
  });
}
