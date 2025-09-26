// @collapse-start
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
// @collapse-end

// @section-start
@Component({
  selector: 'resizing',
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `
    <div class="not-content diagram">
      <ng-diagram
        [model]="model"
        <!-- @mark-start -->
        [config]="config"
        <!-- @mark-end -->
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
    // @mark-start
    resize: {
      getMinNodeSize: (_: Node) => {
        return { width: 200, height: 80 };
      },
    },
    // @mark-end
    snapping: {
      shouldSnapResizeForNode: () => false,
    },
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
        resizable: true,
        // @mark-end
      },
    ],
    edges: [],
    metadata: { viewport: { x: 0, y: 0, scale: 1 } },
  });
  // @collapse-end
}
// @section-end
