import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  NgDiagramEdgeTemplateMap,
  provideNgDiagram,
  type NgDiagramConfig,
} from 'ng-diagram';
import { RoutingEdgeComponent } from './routing-edge.component';

@Component({
  imports: [NgDiagramComponent, NgDiagramBackgroundComponent],
  providers: [provideNgDiagram()],
  template: `
    <div class="not-content diagram">
      <ng-diagram
        [model]="model"
        [edgeTemplateMap]="edgeTemplateMap"
        [config]="config"
      >
        <ng-diagram-background />
      </ng-diagram>
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
  edgeTemplateMap = new NgDiagramEdgeTemplateMap([
    ['routing-edge', RoutingEdgeComponent],
  ]);

  // @collapse-start
  config = {
    zoom: {
      zoomToFit: {
        onInit: true,
      },
    },
  } satisfies NgDiagramConfig;
  // @collapse-end

  // @section-start
  model = initializeModel({
    // @collapse-start
    nodes: [
      {
        id: 'source-node',
        position: { x: 150, y: 240 },
        data: { label: 'Source' },
        rotatable: true,
      },
      {
        id: '2',
        position: { x: 600, y: 30 },
        data: { label: 'Target 1' },
        rotatable: true,
      },
      {
        id: '3',
        position: { x: 600, y: 180 },
        data: { label: 'Target 2' },
        rotatable: true,
      },
      {
        id: '4',
        position: { x: 600, y: 330 },
        data: { label: 'Target 3' },
        rotatable: true,
      },
    ],
    // @collapse-end
    edges: [
      {
        id: '1',
        source: 'source-node',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        target: '2',
        data: {},
        // @mark-start
        routing: 'polyline',
        // @mark-end
        type: 'routing-edge',
      },
      {
        id: '2',
        source: 'source-node',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        target: '3',
        data: {},
        // @mark-start
        routing: 'orthogonal',
        // @mark-end
        type: 'routing-edge',
      },
      {
        id: '3',
        source: 'source-node',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        target: '4',
        data: {},
        // @mark-start
        routing: 'bezier',
        // @mark-end
        type: 'routing-edge',
      },
    ],
  });
}
// @section-end
