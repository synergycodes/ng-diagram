// @section-start
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
    <div class="not-content default-diagram">
      <ng-diagram [config]="config" [model]="model" />
    </div>
  `,
  styles: `
    .default-diagram {
      display: flex;
      height: 20rem;

      // @mark-start
      --ngd-node-border-color: #d04a02;
      --ngd-node-border-color-hover: #9b0018;
      --ngd-node-border-radius: 1.75rem;
      --ngd-node-bg-primary-default: #240f0f;

      --ngd-txt-primary-default: #ffffff;

      --ngd-port-border-color: #d04a02;
      --ngd-port-background-color-hover: #9b0018;

      --ngd-selected-node-box-shadow: 0 0 0 0.25rem #9b001852;
      // @mark-end
    }
  `,
})
export class DiagramComponent {
  // @collapse-start
  config = {
    zoom: {
      zoomToFit: {
        onInit: true,
        padding: 120,
      },
    },
  } satisfies NgDiagramConfig;

  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: { x: 0, y: 0 },
        data: { label: 'Node 1' },
      },
    ],
  });
  // @collapse-end
}
// @section-end
