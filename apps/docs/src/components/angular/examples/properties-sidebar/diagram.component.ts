import '@angular/compiler';

import { Component } from '@angular/core';
import {
  NgDiagramComponent,
  NgDiagramContextComponent,
  type AppMiddlewares,
} from '@angularflow/angular-adapter';
import { SidebarContainer } from './sidebar.component';
import { createSignalModel } from '@angularflow/angular-signals-model';

@Component({
  imports: [NgDiagramContextComponent, NgDiagramComponent, SidebarContainer],
  template: `
    <ng-diagram-context>
      <ng-diagram [model]="model" />
      <sidebar-container />
    </ng-diagram-context>
  `,
  styles: `
    :host {
      flex: 1;
      display: flex;
      height: 100%;

      .coordinates {
        display: flex;
      }
    }
  `,
})
export class NgDiagramPropertiesSidebarContainer {
  model = createSignalModel<AppMiddlewares>({
    metadata: {
      viewport: { x: -45, y: 80, scale: 0.88 },
    },
    nodes: [
      {
        id: '1',
        position: { x: 100, y: 150 },
        data: { label: 'Node 1' },
        rotatable: true,
      },
      { id: '2', position: { x: 400, y: 150 }, data: { label: 'Node 2' } },
    ],
    edges: [
      {
        id: '1',
        source: '1',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        target: '2',
        data: {},
      },
    ],
  });
}
