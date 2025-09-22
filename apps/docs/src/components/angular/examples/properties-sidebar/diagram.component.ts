import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  provideNgDiagram,
} from 'ng-diagram';
import { SidebarContainer } from './sidebar.component';

@Component({
  imports: [NgDiagramComponent, SidebarContainer],
  providers: [provideNgDiagram()],
  template: `
    <ng-diagram [model]="model" />
    <sidebar-container />
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
  model = initializeModel({
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
