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

import { CustomNodeComponent } from './node.component';

@Component({
  selector: 'resizing',
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
  styleUrls: ['./resizing-wrapper.component.scss'],
})
export class ResizingWrapperComponent {
  nodeTemplateMap: NgDiagramNodeTemplateMap = new Map([
    ['myType', CustomNodeComponent],
  ]);

  config = {
    zoom: {
      max: 3,
    },
    resize: {
      getMinNodeSize: (_: Node) => {
        return { width: 200, height: 80 };
      },
    },
    snapping: {
      shouldSnapResizeForNode: () => false,
    },
  } satisfies NgDiagramConfig;

  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: { x: 100, y: 100 },
        type: 'myType',
        data: {},
        resizable: true,
      },
    ],
    edges: [],
    metadata: { viewport: { x: 0, y: 0, scale: 1 } },
  });
}
