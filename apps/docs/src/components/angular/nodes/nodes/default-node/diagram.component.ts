import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  NgDiagramContextComponent,
  type AppMiddlewares,
} from '@angularflow/angular-adapter';

@Component({
  imports: [NgDiagramContextComponent, NgDiagramComponent],
  template: `
    <ng-diagram-context>
      <ng-diagram class="customized-diagram" [model]="model" />
    </ng-diagram-context>
  `,
  styles: `
    :host .customized-diagram {
      flex: 1;
      display: flex;
      height: 100%;

      --ngd-node-border-color: #d04a02;
      --ngd-node-border-color-hover: #9b0018;
      --ngd-node-border-radius: 1.75rem;
      --ngd-node-bg-primary-default: #240f0f;

      --ngd-txt-primary-default: #ffffff;

      --ngd-port-border-color: #d04a02;
      --ngd-port-background-color-hover: #9b0018;

      --ngd-selected-node-box-shadow: 0 0 0 0.25rem #9b001852;
    }
  `,
})
export class Diagram {
  model = initializeModel<AppMiddlewares>({
    metadata: {
      viewport: { x: 222, y: 130, scale: 1.6 },
    },
    nodes: [
      {
        id: '1',
        position: { x: 0, y: 0 },
        data: { label: 'Node 1' },
      },
    ],
  });
}
