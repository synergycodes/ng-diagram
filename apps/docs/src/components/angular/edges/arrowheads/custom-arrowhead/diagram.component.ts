import '@angular/compiler';

import { Component } from '@angular/core';
// @collapse-start
import {
  initializeModel,
  NgDiagramComponent,
  provideNgDiagram,
  type NgDiagramConfig,
} from 'ng-diagram';
// @collapse-end
// @mark-start
import { CustomArrowheadsComponent } from './custom-arrowheads.component';
// @mark-end

@Component({
  imports: [NgDiagramComponent, CustomArrowheadsComponent],
  providers: [provideNgDiagram()],
  template: `
    <div class="not-content diagram">
      <ng-diagram [model]="model" [config]="config" />
      <!-- @mark-start -->
      <custom-arrowheads />
      <!-- @mark-end -->
    </div>
  `,
  // @collapse-start
  styles: `
    .diagram {
      display: flex;
      height: 20rem;
    }
  `,
  // @collapse-end
})
export class DiagramComponent {
  // @collapse-start
  config = {
    zoom: {
      zoomToFit: {
        onInit: true,
      },
    },
  } satisfies NgDiagramConfig;
  // @collapse-end

  model = initializeModel({
    nodes: [
      // @collapse-start
      {
        id: 'square',
        position: { x: 50, y: 50 },
        data: { label: 'Square' },
      },
      {
        id: 'square-target',
        position: { x: 400, y: 50 },
        data: { label: 'Target' },
      },
      {
        id: 'open-arrow',
        position: { x: 50, y: 150 },
        data: { label: 'Open Arrow' },
      },
      {
        id: 'open-arrow-target',
        position: { x: 400, y: 150 },
        data: { label: 'Target' },
      },
      {
        id: 'circle',
        position: { x: 50, y: 250 },
        data: { label: 'Circle' },
      },
      {
        id: 'circle-target',
        position: { x: 400, y: 250 },
        data: { label: 'Target' },
      },
      // @collapse-end
    ],
    edges: [
      {
        // @mark-start
        targetArrowhead: 'square-arrowhead',
        // @mark-end
        // @collapse-start
        id: '1',
        source: 'square',
        target: 'square-target',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        data: {},
        // @collapse-end
      },
      {
        // @mark-start
        targetArrowhead: 'open-arrow',
        // @mark-end
        // @collapse-start
        id: '2',
        source: 'open-arrow',
        target: 'open-arrow-target',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        data: {},
        // @collapse-end
      },
      {
        // @mark-start
        targetArrowhead: 'circle-arrowhead',
        // @mark-end
        // @collapse-start
        id: '3',
        source: 'circle',
        target: 'circle-target',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        data: {},
        // @collapse-end
      },
    ],
  });
}
