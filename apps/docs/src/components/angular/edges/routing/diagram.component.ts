import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  NgDiagramContextComponent,
  NgDiagramEdgeTemplateMap,
} from '@angularflow/angular-adapter';
import { RoutingEdgeComponent } from './routing-edge.component';

@Component({
  imports: [NgDiagramContextComponent, NgDiagramComponent],
  template: `
    <ng-diagram-context>
      <ng-diagram [model]="model" [edgeTemplateMap]="edgeTemplateMap" />
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
export class Diagram {
  edgeTemplateMap = new NgDiagramEdgeTemplateMap([
    ['routing-edge', RoutingEdgeComponent],
  ]);

  model = initializeModel({
    metadata: {
      viewport: { x: 0, y: 0, scale: 0.8 },
    },
    nodes: [
      {
        id: 'source-node',
        position: { x: 150, y: 240 },
        data: { label: 'Source' },
        rotatable: true,
      },
      {
        id: '2',
        position: { x: 600, y: 30 },
        data: { label: 'Target 1' },
        rotatable: true,
      },
      {
        id: '3',
        position: { x: 600, y: 180 },
        data: { label: 'Target 2' },
        rotatable: true,
      },
      {
        id: '4',
        position: { x: 600, y: 330 },
        data: { label: 'Target 3' },
        rotatable: true,
      },
    ],
    edges: [
      {
        id: '1',
        source: 'source-node',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        target: '2',
        routing: 'polyline',
        type: 'routing-edge',
        data: {},
      },
      {
        id: '2',
        source: 'source-node',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        target: '3',
        routing: 'orthogonal',
        type: 'routing-edge',
        data: {},
      },
      {
        id: '3',
        source: 'source-node',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        target: '4',
        routing: 'bezier',
        type: 'routing-edge',
        data: {},
      },
    ],
  });
}
