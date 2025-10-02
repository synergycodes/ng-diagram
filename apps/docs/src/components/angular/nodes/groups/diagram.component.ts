import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  provideNgDiagram,
  type NgDiagramConfig,
} from 'ng-diagram';

@Component({
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  styleUrls: ['./diagram.component.scss'],
  template: `
    <div class="not-content diagram">
      <ng-diagram [model]="model" [config]="config" />
    </div>
  `,
})
export class DiagramComponent {
  config: NgDiagramConfig = {
    snapping: {
      shouldSnapResizeForNode: () => false,
    },
  };
  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: {
          x: 240,
          y: 130,
        },
        data: { label: 'Node 1' },
        groupId: '3',
      },
      {
        id: '3',
        position: {
          x: 200,
          y: 90,
        },
        data: {},
        size: { width: 260, height: 126 },
        autoSize: false,
        isGroup: true,
        resizable: true,
      },
    ],
  });
}
