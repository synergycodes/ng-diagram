import '@angular/compiler';
import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  NgDiagramContextComponent,
  type NgDiagramConfig,
  type NgDiagramNodeTemplateMap,
} from 'ng-diagram';

import { CustomNodeComponent } from './node.component';

@Component({
  selector: 'rotation',
  imports: [NgDiagramComponent, NgDiagramContextComponent],
  template: `
    <ng-diagram-context>
      <div class="not-content diagram">
        <ng-diagram
          [model]="model"
          [config]="config"
          [nodeTemplateMap]="nodeTemplateMap"
        />
      </div>
    </ng-diagram-context>
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
    nodeRotation: {
      computeSnapAngleForNode: () => 45,
      defaultSnapAngle: 25,
      shouldSnapForNode: () => true,
    },
  } satisfies NgDiagramConfig;

  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: { x: 100, y: 100 },
        type: 'myType',
        data: {},
        rotatable: true,
      },
    ],
    edges: [],
    metadata: { viewport: { x: 0, y: 0, scale: 1 } },
  });
}
