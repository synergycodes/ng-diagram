// @collapse-start
import '@angular/compiler';
import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  provideNgDiagram,
  type NgDiagramConfig,
  type NgDiagramNodeTemplateMap,
} from 'ng-diagram';

import { CustomNodeComponent } from './node.component';
// @collapse-end

@Component({
  selector: 'rotation',
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `
    <div class="not-content diagram">
      <ng-diagram
        [model]="model"
        // @mark-start
        [config]="config"
        // @mark-end
        [nodeTemplateMap]="nodeTemplateMap"
      />
    </div>
  `,
  styleUrl: './rotation-wrapper.component.scss',
})
export class RotationWrapperComponent {
  nodeTemplateMap: NgDiagramNodeTemplateMap = new Map([
    ['myType', CustomNodeComponent],
  ]);

  config = {
    zoom: {
      max: 3,
    },
    // @mark-start
    nodeRotation: {
      computeSnapAngleForNode: () => 45,
      defaultSnapAngle: 25,
      shouldSnapForNode: () => true,
    },
    // @mark-end
  } satisfies NgDiagramConfig;

  // @collapse-start
  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: { x: 100, y: 100 },
        type: 'myType',
        data: {},
        // @mark-start
        rotatable: true,
        // @mark-end
      },
    ],
    edges: [],
    metadata: { viewport: { x: 0, y: 0, scale: 1 } },
  });
  // @collapse-end
}
