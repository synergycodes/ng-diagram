import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  NgDiagramEdgeTemplateMap,
  provideNgDiagram,
  type NgDiagramConfig,
} from 'ng-diagram';
import { CustomEdgeComponent } from './custom-edge.component';

@Component({
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `
    <div class="not-content diagram">
      <ng-diagram
        [model]="model"
        [config]="config"
        [edgeTemplateMap]="edgeTemplateMap"
      />
    </div>
  `,
  styleUrls: ['./diagram.component.scss'],
})
export class DiagramComponent {
  config = {
    zoom: {
      max: 3,
    },
  } satisfies NgDiagramConfig;

  edgeTemplateMap = new NgDiagramEdgeTemplateMap([
    ['custom', CustomEdgeComponent],
  ]);

  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: { x: 10, y: 100 },
        data: {},
      },
      {
        id: '2',
        position: { x: 270, y: 100 },
        data: {},
      },
      {
        id: '3',
        position: { x: 530, y: 100 },
        data: {},
      },
    ],
    edges: [
      {
        id: '1',
        source: '1',
        target: '2',
        data: {},
        sourcePort: 'port-right',
        targetPort: 'port-left',
        targetArrowhead: 'ng-diagram-arrow',
        type: 'custom',
      },
      {
        id: '2',
        source: '2',
        target: '3',
        data: {},
        sourcePort: 'port-right',
        targetPort: 'port-left',
        targetArrowhead: 'ng-diagram-arrow',
      },
    ],
    metadata: { viewport: { x: 0, y: 0, scale: 1 } },
  });
}
