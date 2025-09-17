import '@angular/compiler';
import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  NgDiagramContextComponent,
} from '@angularflow/angular-adapter';

@Component({
  imports: [NgDiagramContextComponent, NgDiagramComponent],
  styleUrls: ['./groups-wrapper.component.scss'],
  template: `
    <ng-diagram-context>
      <div class="not-content diagram">
        <ng-diagram [model]="model" />
      </div>
    </ng-diagram-context>
  `,
})
export class GroupsDiagram {
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
