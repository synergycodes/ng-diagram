import '@angular/compiler';

import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NgDiagramComponent,
  NgDiagramContextComponent,
  type AppMiddlewares,
  NgDiagramEdgeTemplateMap,
} from '@angularflow/angular-adapter';
import { createSignalModel } from '@angularflow/angular-signals-model';
import { MultipleLabelsEdgeComponent } from './multiple-labels-edge.component';

@Component({
  imports: [NgDiagramContextComponent, NgDiagramComponent, FormsModule],
  template: `
    <ng-diagram-context>
      <ng-diagram [model]="model" [edgeTemplateMap]="edgeTemplateMap" />
    </ng-diagram-context>
  `,
  styles: `
    :host {
      position: relative;
      flex: 1;
      display: flex;
      height: 100%;
    }
  `,
})
export class Diagram {
  edgeTemplateMap = new NgDiagramEdgeTemplateMap([
    ['multiple-labels', MultipleLabelsEdgeComponent],
  ]);

  model = createSignalModel<AppMiddlewares>({
    metadata: {
      viewport: { x: 0, y: 0, scale: 0.7 },
    },
    nodes: [
      {
        id: 'a',
        position: { x: 75, y: 25 },
        data: { label: 'Node 1' },
        rotatable: true,
      },
      { id: 'b', position: { x: 550, y: 175 }, data: { label: 'Node 2' } },
      { id: 'c', position: { x: 75, y: 375 }, data: { label: 'Node 3' } },
    ],
    edges: [
      {
        id: '1',
        source: 'a',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        target: 'b',
        type: 'multiple-labels',
        data: {
          texts: [],
        },
      },
      {
        id: '2',
        source: 'b',
        sourcePort: 'port-left',
        targetPort: 'port-right',
        target: 'c',
        type: 'multiple-labels',
        data: {
          texts: [],
        },
      },
    ],
  });
}
