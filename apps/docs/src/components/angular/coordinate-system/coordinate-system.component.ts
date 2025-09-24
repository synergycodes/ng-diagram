import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  provideNgDiagram,
  type NgDiagramConfig,
} from 'ng-diagram';
import { CoordinatesPreview } from './coordinates-preview.component';

@Component({
  imports: [NgDiagramComponent, CoordinatesPreview],
  providers: [provideNgDiagram()],
  template: `
    <ng-diagram [model]="model" [config]="config" />
    <coordinates-preview />
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
  config: NgDiagramConfig = {
    snapping: {
      shouldSnapResizeForNode: () => false,
    },
  };
  model = initializeModel({
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
        position: { x: 370, y: 80 },
        size: { width: 260, height: 186 },
        autoSize: false,
        data: {},
        resizable: true,
      },
    ],
    edges: [],
  });
}
