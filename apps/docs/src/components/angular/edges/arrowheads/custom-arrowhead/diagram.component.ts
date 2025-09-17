import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  NgDiagramContextComponent,
} from '@angularflow/angular-adapter';
import { CustomArrowheadsComponent } from './custom-arrowheads.component';

@Component({
  imports: [
    NgDiagramContextComponent,
    NgDiagramComponent,
    CustomArrowheadsComponent,
  ],
  template: `
    <ng-diagram-context>
      <ng-diagram [model]="model" />
      <custom-arrowheads />
    </ng-diagram-context>
  `,
  styles: `
    :host {
      flex: 1;
      display: flex;
      height: 100%;
    }
  `,
})
export class CustomArrowheadDiagram {
  model = initializeModel({
    metadata: {
      viewport: { x: 100, y: 0, scale: 0.8 },
    },
    nodes: [
      {
        id: 'square',
        position: { x: 50, y: 50 },
        data: { label: 'Square' },
      },
      {
        id: 'square-target',
        position: { x: 400, y: 50 },
        data: { label: 'Target' },
      },
      {
        id: 'open-arrow',
        position: { x: 50, y: 150 },
        data: { label: 'Open Arrow' },
      },
      {
        id: 'open-arrow-target',
        position: { x: 400, y: 150 },
        data: { label: 'Target' },
      },
      {
        id: 'circle',
        position: { x: 50, y: 250 },
        data: { label: 'Circle' },
      },
      {
        id: 'circle-target',
        position: { x: 400, y: 250 },
        data: { label: 'Target' },
      },
    ],
    edges: [
      {
        targetArrowhead: 'square-arrowhead',
        id: '1',
        source: 'square',
        target: 'square-target',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        data: {},
      },
      {
        targetArrowhead: 'open-arrow',
        id: '2',
        source: 'open-arrow',
        target: 'open-arrow-target',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        data: {},
      },
      {
        targetArrowhead: 'circle-arrowhead',
        id: '3',
        source: 'circle',
        target: 'circle-target',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        data: {},
      },
    ],
  });
}
