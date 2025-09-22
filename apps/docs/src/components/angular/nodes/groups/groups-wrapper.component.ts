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
  styleUrls: ['./groups-wrapper.component.scss'],
  template: `
    <div class="not-content diagram">
      <ng-diagram [model]="model" [config]="config" />
    </div>
  `,
})
export class GroupsDiagram {
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
          y: 115,
        },
        data: { label: 'Node 1' },
        groupId: '3',
      },
      {
        id: '3',
        position: {
          x: 230,
          y: 85,
        },
        data: {},
        size: { width: 200, height: 100 },
        isGroup: true,
        resizable: true,
        rotatable: true,
      },
    ],
  });
}
