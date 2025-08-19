import '@angular/compiler';

import { Component } from '@angular/core';
import {
  NgDiagramComponent,
  NgDiagramContextComponent,
  type AppMiddlewares,
  type NgDiagramConfig,
} from '@angularflow/angular-adapter';
import { createSignalModel } from '@angularflow/angular-signals-model';
import { diagramModel } from './data';
import { LayoutButtonsComponent } from './layout-buttons.component';

@Component({
  imports: [
    NgDiagramContextComponent,
    NgDiagramComponent,
    LayoutButtonsComponent,
  ],
  template: `
    <ng-diagram-context>
      <ng-diagram [model]="model" [config]="config" />
      <layout-buttons />
    </ng-diagram-context>
  `,
  styles: `
    :host {
      flex: 1;
      position: relative;
      display: flex;
      height: 100%;

      .coordinates {
        display: flex;
      }
    }
  `,
})
export class DiagramComponent {
  model = createSignalModel<AppMiddlewares>({
    metadata: {
      viewport: { x: 100, y: 80, scale: 0.5 },
    },
    nodes: diagramModel.nodes,
    edges: diagramModel.edges,
  });

  config: NgDiagramConfig = {};
}
