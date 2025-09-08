import '@angular/compiler';

import { Component } from '@angular/core';
import {
  NgDiagramComponent,
  NgDiagramContextComponent,
  NgDiagramEdgeTemplateMap,
  type AppMiddlewares,
} from '@angularflow/angular-adapter';
import { createSignalModel } from '@angularflow/angular-signals-model';
import { SinusoidEdgeComponent } from './sinusoid-edge.component';

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
export class SinusoidDiagram {
  edgeTemplateMap = new NgDiagramEdgeTemplateMap([
    ['sinusoid', SinusoidEdgeComponent],
  ]);

  model = createSignalModel<AppMiddlewares>({
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
