import '@angular/compiler';

import { Component, inject } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  NgDiagramService,
  provideNgDiagram,
  type DiagramInitEvent,
  type NgDiagramConfig,
} from 'ng-diagram';
import { ArcRouting } from './arc-routing';

@Component({
  selector: 'custom-routing',
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `
    <div class="not-content diagram">
      <ng-diagram
        [model]="model"
        [config]="config"
        (diagramInit)="onDiagramInit($event)"
      />
    </div>
  `,
  styles: `
    .diagram {
      display: flex;
      height: 20rem;
    }
  `,
})
export class DiagramComponent {
  private diagramService = inject(NgDiagramService);

  config = {
    zoom: {
      zoomToFit: {
        onInit: true,
      },
    },
    edgeRouting: {
      arc: {
        radiusMultiplier: 0.5,
      },
    },
  } satisfies NgDiagramConfig;

  onDiagramInit(_: DiagramInitEvent) {
    this.diagramService.registerRouting(new ArcRouting());
  }

  model = initializeModel({
    nodes: [
      {
        id: 'node1',
        position: { x: 100, y: 50 },
        data: { label: 'Node 1' },
      },
      {
        id: 'node2',
        position: { x: 400, y: 50 },
        data: { label: 'Node 2' },
      },
    ],
    edges: [
      {
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        data: {},
        routing: 'arc',
      },
    ],
  });
}
