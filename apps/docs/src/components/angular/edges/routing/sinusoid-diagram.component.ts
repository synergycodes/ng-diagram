import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  NgDiagramEdgeTemplateMap,
  provideNgDiagram,
} from 'ng-diagram';
import { SinusoidEdgeComponent } from './sinusoid-edge.component';

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
export class SinusoidDiagram {
  edgeTemplateMap = new NgDiagramEdgeTemplateMap([
    ['sinusoid', SinusoidEdgeComponent],
  ]);

  model = initializeModel({
    metadata: {
      viewport: { x: 0, y: 0, scale: 0.9 },
    },
    nodes: [
      {
        id: 'node1',
        position: { x: 100, y: 150 },
        data: { label: 'Drag me!' },
      },
      {
        id: 'node2',
        position: { x: 500, y: 150 },
        data: { label: 'Dynamic path' },
      },
    ],
    edges: [
      {
        id: 'edge1',
        source: 'node1',
        sourcePort: 'port-right',
        target: 'node2',
        targetPort: 'port-left',
        type: 'sinusoid',
        data: {},
      },
    ],
  });
}
