// @section-start:config
import '@angular/compiler';
import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  provideNgDiagram,
  type NgDiagramConfig,
  type NgDiagramNodeTemplateMap,
} from 'ng-diagram';

import { CustomNodeComponent } from './node/node.component';

// @mark-substring:config:config
@Component({
  // @collapse-start:config
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  // @collapse-end:config
  template: `
    <div class="not-content diagram">
      <ng-diagram
        [model]="model"
        [config]="config"
        [nodeTemplateMap]="nodeTemplateMap"
      />
    </div>
  `,
  styleUrl: './diagram.component.scss',
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
    nodeRotation: {
      computeSnapAngleForNode: () => 45,
      defaultSnapAngle: 25,
      shouldSnapForNode: () => true,
    },
    // @mark-end:config
  } satisfies NgDiagramConfig;
  // @collapse-start:config
  // @section-start:enabling
  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: { x: 200, y: 70 },
        size: { width: 250, height: 170 },
        autoSize: false,
        type: 'myType',
        data: {},
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
