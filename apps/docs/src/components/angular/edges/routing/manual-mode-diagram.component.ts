import '@angular/compiler';

import { Component } from '@angular/core';
// @collapse-start
import {
  initializeModel,
  NgDiagramComponent,
  provideNgDiagram,
} from 'ng-diagram';
// @collapse-end

@Component({
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `<ng-diagram [model]="model" />`,
  styles: `
    :host {
      flex: 1;
      display: flex;
      height: 100%;
    }
  `,
})
export class ManualModeDiagram {
  model = initializeModel({
    // @collapse-start
    metadata: {
      viewport: { x: 0, y: 0, scale: 0.9 },
    },
    // @collapse-end
    nodes: [
      {
        id: 'node1',
        position: { x: 100, y: 150 },
        data: { label: 'Move me!' },
        rotatable: true,
      },
      {
        id: 'node2',
        position: { x: 500, y: 150 },
        data: { label: 'Move me too!' },
        rotatable: true,
      },
    ],
    // @mark-start
    edges: [
      {
        id: 'manual-edge',
        source: 'node1',
        sourcePort: 'port-right',
        target: 'node2',
        targetPort: 'port-left',
        routing: 'orthogonal',
        routingMode: 'manual',
        points: [
          { x: 285, y: 172 },
          { x: 345, y: 172 },
          { x: 345, y: 100 },
          { x: 445, y: 100 },
          { x: 445, y: 172 },
          { x: 500, y: 172 },
        ],
        data: {},
      },
    ],
    // @mark-end
  });
}
