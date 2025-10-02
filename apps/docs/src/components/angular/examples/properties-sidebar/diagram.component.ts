import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  provideNgDiagram,
} from 'ng-diagram';
import { SidebarContainer } from './sidebar/sidebar.component';

@Component({
  imports: [NgDiagramComponent, SidebarContainer],
  providers: [provideNgDiagram()],
  template: `
    <div class="not-content diagram">
      <ng-diagram [model]="model" />
    </div>
    <sidebar-container />
  `,
  styleUrls: ['./diagram.component.scss'],
})
export class DiagramComponent {
  model = initializeModel({
    metadata: {
      viewport: { x: 0, y: 0, scale: 0.88 },
    },
    nodes: [
      {
        id: '1',
        position: { x: 50, y: 120 },
        data: { label: 'Node 1' },
        rotatable: true,
      },
      { id: '2', position: { x: 300, y: 120 }, data: { label: 'Node 2' } },
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
