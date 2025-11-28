// @collapse-start
import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  provideNgDiagram,
  type Edge,
  type NgDiagramConfig,
} from 'ng-diagram';

@Component({
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `
    <div class="not-content diagram">
      <ng-diagram [model]="model" [config]="config" />
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
// @collapse-end
export class DiagramComponent {
  config = {
    zoom: {
      zoomToFit: { onInit: true },
    },
    // @mark-start
    linking: {
      temporaryEdgeDataBuilder: (edge: Edge) =>
        ({
          ...edge,
          sourcePort: undefined,
        }) satisfies Edge,
      finalEdgeDataBuilder: (edge: Edge) =>
        ({
          ...edge,
          sourcePort: undefined,
          targetPort: undefined,
        }) satisfies Edge,
    },
    // @mark-end
  } satisfies NgDiagramConfig;
  // @collapse-start
  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: {
          x: 0,
          y: 100,
        },
        data: { label: 'Node 1' },
      },
      {
        id: '2',
        position: {
          x: 300,
          y: 0,
        },
        data: { label: 'Node 2' },
      },
      {
        id: '3',
        position: {
          x: 300,
          y: 200,
        },
        data: { label: 'Node 3' },
      },
    ],
    edges: [
      {
        id: '1',
        source: '1',
        sourcePort: undefined,
        target: '2',
        targetPort: undefined,
        data: {},
      },
    ],
  });
  // @collapse-end
}
