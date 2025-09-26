import '@angular/compiler';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  provideNgDiagram,
  type NgDiagramConfig,
  type NgDiagramNodeTemplateMap,
} from 'ng-diagram';

import { CustomNodeComponent } from './node.component';

@Component({
  selector: 'customnode',
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="not-content diagram">
    // @section-start usage
      <ng-diagram
        [model]="model"
        [config]="config"
        // @mark-start
        [nodeTemplateMap]="nodeTemplateMap"
        // @mark-end
      />
    // @section-end usage
    </div>
  `,
  styleUrl: './custom-node-wrapper.component.scss',
})
// @section-start registering
export class CustomNodeWrapperComponent {
  nodeTemplateMap: NgDiagramNodeTemplateMap = new Map([
    ['myType', CustomNodeComponent],
  ]);
  // @section-end registering

  config = {
    zoom: {
      max: 3,
    },
  } satisfies NgDiagramConfig;

  // @section-start model
  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: { x: 100, y: 100 },
        // @mark-start
        type: 'myType',
        // @mark-end
        data: {},
      },
    ],
    edges: [],
    metadata: { viewport: { x: 0, y: 0, scale: 1.25 } },
  });
  // @section-end model
}
