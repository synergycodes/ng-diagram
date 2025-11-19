import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  provideNgDiagram,
  type NgDiagramConfig,
} from 'ng-diagram';

@Component({
  imports: [NgDiagramComponent, NgDiagramBackgroundComponent],
  providers: [provideNgDiagram()],
  styleUrls: ['./diagram.component.scss'],
  template: `
    <div class="not-content diagram">
      <ng-diagram [model]="model" [config]="config">
        <ng-diagram-background />
      </ng-diagram>
    </div>
  `,
})
export class DiagramComponent {
  config = {
    zoom: {
      zoomToFit: {
        onInit: true,
        padding: 130,
      },
    },
  } satisfies NgDiagramConfig;

  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: {
          x: 40,
          y: 40,
        },
        data: { label: 'Node 1' },
        groupId: '3',
      },
      {
        id: '3',
        position: {
          x: 0,
          y: 0,
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
