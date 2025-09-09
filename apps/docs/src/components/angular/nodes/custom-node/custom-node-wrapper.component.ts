import '@angular/compiler';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  NgDiagramContextComponent,
  type NgDiagramConfig,
  type NgDiagramNodeTemplateMap,
} from '@angularflow/angular-adapter';

import { CustomNodeComponent } from './node.component';

@Component({
  selector: 'customnode',
  imports: [NgDiagramComponent, NgDiagramContextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  styleUrl: './custom-node-wrapper.component.scss',
})
export class CustomNodeWrapperComponent {
  nodeTemplateMap: NgDiagramNodeTemplateMap = new Map([
    ['myType', CustomNodeComponent],
  ]);

  config = {
    zoom: {
      max: 3,
    },
  } satisfies NgDiagramConfig;

  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: { x: 100, y: 100 },
        type: 'myType',
        data: {},
      },
    ],
    edges: [],
    metadata: { viewport: { x: 0, y: 0, scale: 1.25 } },
  });
}
