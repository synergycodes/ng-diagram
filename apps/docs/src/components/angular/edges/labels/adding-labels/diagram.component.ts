import '@angular/compiler';

import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  NgDiagramEdgeTemplateMap,
  provideNgDiagram,
  type NgDiagramConfig,
} from 'ng-diagram';
import { LabelPanel } from './label-panel.component';
import { ModifiableLabelEdgeComponent } from './modifiable-label-edge.component';

@Component({
  selector: 'diagram',
  imports: [
    NgDiagramComponent,
    FormsModule,
    LabelPanel,
    NgDiagramBackgroundComponent,
  ],
  providers: [provideNgDiagram()],
  template: `
    <div class="not-content diagram">
      <ng-diagram
        [model]="model"
        [edgeTemplateMap]="edgeTemplateMap"
        [config]="config"
      >
        <ng-diagram-background />
      </ng-diagram>
      <label-panel />
    </div>
  `,
  styles: `
    .diagram {
      position: relative;
      display: flex;
      height: var(--ng-diagram-height);
      border: var(--ng-diagram-border);
    }
  `,
})
export class DiagramComponent {
  edgeTemplateMap = new NgDiagramEdgeTemplateMap([
    ['modifiable-label', ModifiableLabelEdgeComponent],
  ]);

  config = {
    zoom: {
      zoomToFit: {
        onInit: true,
        padding: [50, 170, 50, 50],
      },
    },
  } satisfies NgDiagramConfig;

  model = initializeModel({
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
