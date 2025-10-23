// @collapse-start
import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  provideNgDiagram,
  type NgDiagramConfig,
} from 'ng-diagram';
import { CoordinatesComponent } from './preview/coordinates.component';
// @collapse-end

@Component({
  imports: [NgDiagramComponent, CoordinatesComponent],
  providers: [provideNgDiagram()],
  template: `
    <div class="not-content diagram">
      <ng-diagram [model]="model" [config]="config" />
      <coordinates />
    </div>
  `,
  styles: `
    .diagram {
      display: flex;
      height: 30rem;
    }
  `,
})
export class DiagramComponent {
  config: NgDiagramConfig = {
    snapping: {
      shouldSnapResizeForNode: () => false,
    },
  };
  model = initializeModel({
    metadata: {
      // @section-start:viewport-coordinates
      viewport: {
        x: 5, // Horizontal offset from diagram origin
        y: 85, // Vertical offset from diagram origin
        scale: 1, // Zoom level (1.0 = 100%)
        width: 710, // Viewport width - optional
        height: 470, // Viewport height - optional
      },
      // @section-end:viewport-coordinates
    },
    nodes: [
      // @section-start:element-positioning-nodes
      {
        id: '1',
        position: { x: 100, y: 150 }, // 100 px from left, 150 px from top
        data: { label: 'Node 1' },
      },
      // @section-end:element-positioning-nodes
      {
        id: '2',
        position: { x: 410, y: 150 },
        data: { label: 'Node 2' },
        groupId: '3',
      },
      // @section-start:element-positioning-groups
      {
        id: '3',
        isGroup: true,
        position: { x: 370, y: 80 }, // Group's top-left corner
        size: { width: 260, height: 186 },
        autoSize: false,
        data: {},
        resizable: true,
      },
      // @section-end:element-positioning-groups
    ],
    edges: [],
  });
}
