// @section-start:config
// @section-start:usage
import '@angular/compiler';
import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  NgDiagramNodeTemplateMap,
  provideNgDiagram,
  type NgDiagramConfig,
  type Node,
} from 'ng-diagram';

import { CustomNodeComponent } from './node/node.component';

// @mark-substring:config:config
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
  styleUrls: ['./diagram.component.scss'],
})
export class DiagramComponent {
  // @collapse-start:config
  nodeTemplateMap = new NgDiagramNodeTemplateMap([
    ['myType', CustomNodeComponent],
  ]);

  // @collapse-end:config
  config = {
    zoom: {
      max: 3,
      zoomToFit: {
        onInit: true,
        padding: 130,
      },
    },
    // @mark-start:config
    resize: {
      getMinNodeSize: (_: Node) => {
        return { width: 200, height: 80 };
      },
    },
    // @mark-end:config
  } satisfies NgDiagramConfig;
  // @collapse-start:config

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
  // @collapse-end:config
}
// @section-end:config
// @section-end:usage
