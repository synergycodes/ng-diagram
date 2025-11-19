import '@angular/compiler';
import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  provideNgDiagram,
  type NgDiagramConfig,
  type NgDiagramNodeTemplateMap,
} from 'ng-diagram';

import { CustomNodeComponent } from './node/node.component';

@Component({
  imports: [NgDiagramComponent, NgDiagramBackgroundComponent],
  providers: [provideNgDiagram()],
  template: `
    <div class="not-content diagram">
      <ng-diagram
        [model]="model"
        [config]="config"
        [nodeTemplateMap]="nodeTemplateMap"
      >
        <ng-diagram-background />
      </ng-diagram>
    </div>
  `,
  styleUrl: './diagram.component.scss',
})
export class DiagramComponent {
  nodeTemplateMap: NgDiagramNodeTemplateMap = new Map([
    ['myType', CustomNodeComponent],
  ]);

  config = {
    zoom: {
      max: 3,
      zoomToFit: {
        onInit: true,
        padding: 150,
      },
    },
  } satisfies NgDiagramConfig;

  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: { x: 0, y: 100 },
        size: { width: 250, height: 170 },
        autoSize: false,
        type: 'myType',
        data: { label: 'Node 1' },
      },
      {
        id: '2',
        position: { x: 400, y: 100 },
        size: { width: 250, height: 170 },
        autoSize: false,
        type: 'myType',
        data: { label: 'Node 2' },
      },
    ],
    edges: [
      {
        id: '1',
        data: {},
        source: '1',
        target: '2',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        sourceArrowhead: 'ng-diagram-arrow',
      },
    ],
  });
}
