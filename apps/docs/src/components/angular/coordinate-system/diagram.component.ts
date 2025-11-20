// @collapse-start
import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  provideNgDiagram,
  type NgDiagramConfig,
} from 'ng-diagram';
import { CoordinatesComponent } from './preview/coordinates.component';
// @collapse-end

@Component({
  imports: [
    NgDiagramComponent,
    CoordinatesComponent,
    NgDiagramBackgroundComponent,
  ],
  providers: [provideNgDiagram()],
  template: `
    <div class="not-content diagram">
      <ng-diagram [model]="model" [config]="config">
        <ng-diagram-background />
      </ng-diagram>
      <coordinates />
    </div>
  `,
  styles: `
    .diagram {
      display: flex;
      height: var(--ng-diagram-height);
      border: var(--ng-diagram-border);
    }
  `,
})
export class DiagramComponent {
  config = {
    zoom: {
      zoomToFit: {
        onInit: true,
        padding: 100,
      },
    },
  } satisfies NgDiagramConfig;

  model = initializeModel({
    metadata: {
      // @section-start:viewport-coordinates
      viewport: {
        x: 0, // Horizontal offset from diagram origin
        y: 0, // Vertical offset from diagram origin
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
        position: { x: 50, y: 150 }, // 100 px from left, 150 px from top
        data: { label: 'Node 1' },
      },
      // @section-end:element-positioning-nodes
      {
        id: '2',
        position: { x: 350, y: 150 },
        data: { label: 'Node 2' },
        groupId: '3',
      },
      // @section-start:element-positioning-groups
      {
        id: '3',
        isGroup: true,
        position: { x: 310, y: 80 }, // Group's top-left corner
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
