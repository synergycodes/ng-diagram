import '@angular/compiler';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  provideNgDiagram,
  type NgDiagramConfig,
  type NgDiagramNodeTemplateMap,
} from 'ng-diagram';

import { CustomNodeComponent } from './node/node.component';

@Component({
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="not-content diagram">
      <!-- @section-start:usage -->
      <!-- @mark-substring:[nodeTemplateMap]="nodeTemplateMap":usage -->
      <ng-diagram
        [model]="model"
        [config]="config"
        [nodeTemplateMap]="nodeTemplateMap"
      />
      <!-- @section-end:usage -->
    </div>
  `,
  styleUrl: './diagram.component.scss',
})
// @section-start:registering
export class DiagramComponent {
  nodeTemplateMap: NgDiagramNodeTemplateMap = new Map([
    ['myType', CustomNodeComponent],
  ]);
  // @section-end:registering

  config = {
    zoom: {
      max: 3,
    },
  } satisfies NgDiagramConfig;

  // @section-start:model
  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: { x: 200, y: 50 },
        size: { width: 250, height: 170 },
        autoSize: false,
        // @mark-start
        type: 'myType',
        // @mark-end
        data: {},
      },
    ],
  });
  // @section-end:model
}
