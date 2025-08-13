import '@angular/compiler';

import { Component } from '@angular/core';
import { NgDiagramComponent, NgDiagramContextComponent, createSignalModel } from '@angularflow/angular-adapter';
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
  model = createSignalModel({
    nodes: [
      { id: '1', position: { x: 100, y: 150 }, data: { label: 'Node 1' } },
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
