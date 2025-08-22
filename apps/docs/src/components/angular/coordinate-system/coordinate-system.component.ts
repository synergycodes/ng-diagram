import '@angular/compiler';

import { Component } from '@angular/core';
import {
  NgDiagramComponent,
  NgDiagramContextComponent,
  type AppMiddlewares,
} from '@angularflow/angular-adapter';
import { createSignalModel } from '@angularflow/angular-signals-model';
import { CoordinatesPreview } from './coordinates-preview.component';

@Component({
  imports: [NgDiagramContextComponent, NgDiagramComponent, CoordinatesPreview],
  template: `
    <ng-diagram-context>
      <ng-diagram [model]="model" />
      <coordinates-preview />
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
export class NgDiagramComponentContainer {
  model = createSignalModel<AppMiddlewares>({
    metadata: {
      viewport: {
        x: 5,
        y: 85,
        scale: 1,
      },
    },
    nodes: [
      { id: '1', position: { x: 100, y: 150 }, data: { label: 'Node 1' } },
      {
        id: '2',
        position: { x: 410, y: 150 },
        data: { label: 'Node 2' },
        groupId: '3',
      },
      {
        id: '3',
        isGroup: true,
        position: { x: 390, y: 100 },
        size: { width: 220, height: 140 },
        data: {},
      },
    ],
    edges: [],
  });
}
