import '@angular/compiler';

import { Component } from '@angular/core';
import {
  NgDiagramComponent,
  NgDiagramContextComponent,
  type AppMiddlewares,
  NgDiagramEdgeTemplateMap,
} from '@angularflow/angular-adapter';
import { createSignalModel } from '@angularflow/angular-signals-model';
import { CustomEdgeComponent } from './custom-edge.component';

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
    ['custom', CustomEdgeComponent],
  ]);

  model = createSignalModel<AppMiddlewares>({
    metadata: {
      viewport: { x: 0, y: 0, scale: 0.88 },
    },
    nodes: [
      {
        id: '1',
        position: { x: 150, y: 150 },
        data: { label: 'Node 1' },
        rotatable: true,
      },
      { id: '2', position: { x: 500, y: 150 }, data: { label: 'Node 2' } },
    ],
    edges: [
      {
        id: '1',
        source: '1',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        target: '2',
        type: 'custom',
        data: {},
      },
    ],
  });
}
