import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  provideNgDiagram,
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
  styles: [
    `
      .diagram {
        display: flex;
        height: 30rem;
      }
    `,
  ],
})
export class DiagramComponent {
  config = {
    zoom: {
      zoomToFit: { onInit: true },
    },
  } satisfies NgDiagramConfig;
  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: {
          x: 100,
          y: 100,
        },
        data: { label: 'Node 1' },
      },
      {
        id: '2',
        position: {
          x: 400,
          y: 200,
        },
        data: { label: 'Node 2' },
      },
    ],
    edges: [
      {
        id: '1',
        source: '1',
        sourcePort: undefined,
        target: '2',
        targetPort: 'port-left',
        data: {},
      },
    ],
  });
}
