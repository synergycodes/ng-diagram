import '@angular/compiler';
import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  provideNgDiagram,
  type NgDiagramConfig,
  type NgDiagramNodeTemplateMap,
  type Node,
} from 'ng-diagram';

import { CustomNodeComponent } from './node/node.component';

// @section-start:config
// @section-start:usage
// @mark-substring:config:config
@Component({
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `
    <div class="not-content diagram">
      <ng-diagram
        [model]="model"
        [config]="config"
        [nodeTemplateMap]="nodeTemplateMap"
      />
    </div>
  `,
  styleUrls: ['./diagram.component.scss'],
})
export class DiagramComponent {
  // @collapse-start:config
  nodeTemplateMap: NgDiagramNodeTemplateMap = new Map([
    ['myType', CustomNodeComponent],
  ]);

  // @collapse-end:config
  config = {
    zoom: {
      max: 3,
    },
    // @mark-start:config
    resize: {
      getMinNodeSize: (_: Node) => {
        return { width: 200, height: 80 };
      },
    },
    // @mark-end:config
    snapping: {
      shouldSnapResizeForNode: () => false,
    },
  } satisfies NgDiagramConfig;
  // @collapse-start:config

  // @section-start:enabling
  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: { x: 100, y: 100 },
        type: 'myType',
        data: {},
        // @mark-start:enabling
        resizable: true,
        // @mark-end:enabling
      },
    ],
    // @collapse-start:enabling
    edges: [],
    metadata: { viewport: { x: 0, y: 0, scale: 1 } },
    // @collapse-end:enabling
  });
  // @section-end:enabling
  // @collapse-end:config
}
// @section-end:config
// @section-end:usage
