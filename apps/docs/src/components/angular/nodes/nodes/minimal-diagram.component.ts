import '@angular/compiler';

import { Component } from '@angular/core';
import {
  NgDiagramComponent,
  NgDiagramContextComponent,
  type AppMiddlewares,
} from '@angularflow/angular-adapter';
import { createSignalModel } from '@angularflow/angular-signals-model';

@Component({
  imports: [NgDiagramContextComponent, NgDiagramComponent],
  template: `
    <ng-diagram-context>
      <ng-diagram [model]="model" />
    </ng-diagram-context>
  `,
})
export class Diagram {
  model = createSignalModel<AppMiddlewares>({
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
