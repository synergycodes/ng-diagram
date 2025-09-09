import '@angular/compiler';

import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  initializeModel,
  NgDiagramComponent,
  NgDiagramContextComponent,
  type AppMiddlewares,
  NgDiagramEdgeTemplateMap,
} from '@angularflow/angular-adapter';
import { LabelPanel } from './label-panel.component';
import { ModifiableLabelEdgeComponent } from './modifiable-label-edge.component';

@Component({
  selector: 'diagram',
  imports: [
    NgDiagramContextComponent,
    NgDiagramComponent,
    FormsModule,
    LabelPanel,
  ],
  template: `
    <ng-diagram-context>
      <ng-diagram [model]="model" [edgeTemplateMap]="edgeTemplateMap" />
      <label-panel />
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
    ['modifiable-label', ModifiableLabelEdgeComponent],
  ]);

  model = initializeModel<AppMiddlewares>({
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
        type: 'modifiable-label',
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
        type: 'modifiable-label',
        data: {
          texts: [],
        },
      },
    ],
  });
}
