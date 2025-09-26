import '@angular/compiler';

import { Component } from '@angular/core';
// @collapse-start
import {
  initializeModel,
  NgDiagramComponent,
  NgDiagramEdgeTemplateMap,
  provideNgDiagram,
} from 'ng-diagram';
import { RoutingEdgeComponent } from './routing-edge.component';
// @collapse-end

@Component({
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `
    <ng-diagram [model]="model" [edgeTemplateMap]="edgeTemplateMap" />
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
    // @collapse-start
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
    // @collapse-end
    edges: [
      {
        id: '1',
        source: 'source-node',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        target: '2',
        routing: 'polyline', // @mark 'polyline'
        type: 'routing-edge',
        data: {},
      },
      {
        id: '2',
        source: 'source-node',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        target: '3',
        routing: 'orthogonal', // @mark 'orthogonal'
        type: 'routing-edge',
        data: {},
      },
      {
        id: '3',
        source: 'source-node',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        target: '4',
        routing: 'bezier', // @mark 'bezier'
        type: 'routing-edge',
        data: {},
      },
    ],
  });
}
