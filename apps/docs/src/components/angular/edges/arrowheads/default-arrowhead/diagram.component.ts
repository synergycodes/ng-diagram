import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  provideNgDiagram,
} from 'ng-diagram';

@Component({
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: ` <ng-diagram [model]="model" /> `,
  styles: `
    :host {
      flex: 1;
      display: flex;
      height: 100%;
    }
  `,
})
export class DefaultArrowheadDiagram {
  model = initializeModel({
    metadata: {
      viewport: { x: 0, y: -50, scale: 1 },
    },
    nodes: [
      {
        id: '1',
        position: { x: 100, y: 100 },
        data: { label: 'Source Node' },
      },
      {
        id: '2',
        position: { x: 400, y: 100 },
        data: { label: 'Target Node' },
      },
      {
        id: '3',
        position: { x: 100, y: 250 },
        data: { label: 'Bidirectional' },
      },
      {
        id: '4',
        position: { x: 400, y: 250 },
        data: { label: 'Connection' },
      },
    ],
    edges: [
      {
        targetArrowhead: 'ng-diagram-arrow',
        id: '1',
        source: '1',
        sourcePort: 'port-right',
        target: '2',
        targetPort: 'port-left',
        data: {},
        routing: 'straight',
      },
      {
        sourceArrowhead: 'ng-diagram-arrow',
        targetArrowhead: 'ng-diagram-arrow',
        id: '2',
        source: '3',
        sourcePort: 'port-right',
        target: '4',
        targetPort: 'port-left',
        data: {},
        routing: 'straight',
      },
    ],
  });
}
