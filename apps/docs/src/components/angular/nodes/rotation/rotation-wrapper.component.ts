import '@angular/compiler';
import { Component } from '@angular/core';
import {
  NgDiagramComponent,
  NgDiagramContextComponent,
  type NgDiagramConfig,
  type NgDiagramNodeTemplateMap,
} from '@angularflow/angular-adapter';
import { createSignalModel } from '@angularflow/angular-signals-model';

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
  styles: [
    `
      :host {
        flex: 1;
        display: flex;
        .diagram {
          flex: 1;
          display: flex;
          height: 20rem;
        }
      }
    `,
  ],
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

  model = createSignalModel({
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
