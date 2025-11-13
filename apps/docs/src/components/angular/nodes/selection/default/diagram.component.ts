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

import { DefaultNodeComponent } from './node/node.component';

@Component({
  imports: [NgDiagramComponent, NgDiagramBackgroundComponent],
  providers: [provideNgDiagram()],
  template: `
    <div class="not-content default-diagram">
      <ng-diagram
        [model]="model"
        [config]="config"
        [nodeTemplateMap]="nodeTemplateMap"
      >
        <ng-diagram-background />
      </ng-diagram>
    </div>
  `,
  styleUrls: ['./diagram.component.scss'],
})
export class DiagramComponent {
  nodeTemplateMap: NgDiagramNodeTemplateMap = new Map([
    ['myType', DefaultNodeComponent],
  ]);

  config = {
    zoom: {
      max: 3,
      zoomToFit: {
        onInit: true,
        padding: 140,
      },
    },
  } satisfies NgDiagramConfig;

  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: { x: 0, y: 0 },
        size: { width: 250, height: 170 },
        autoSize: false,
        type: 'myType',
        data: {},
      },
    ],
  });
}
