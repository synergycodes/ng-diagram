import '@angular/compiler';

import { Component, inject } from '@angular/core';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  NgDiagramModelService,
  NgDiagramService,
  provideNgDiagram,
  type DiagramInitEvent,
  type NgDiagramConfig,
} from 'ng-diagram';
import { ArcRouting } from './arc-routing';

@Component({
  selector: 'custom-routing',
  imports: [NgDiagramComponent, NgDiagramBackgroundComponent],
  providers: [provideNgDiagram()],
  // @mark-substring:(diagramInit)="onDiagramInit($event)"
  template: `
    <div class="not-content diagram">
      <ng-diagram
        [model]="model"
        [config]="config"
        (diagramInit)="onDiagramInit($event)"
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
  private diagramService = inject(NgDiagramService);
  private modelService = inject(NgDiagramModelService);

  config = {
    zoom: {
      zoomToFit: {
        onInit: true,
      },
    },
    // @mark-start
    edgeRouting: {
      arc: {
        radiusMultiplier: 0.5,
      },
    },
    // @mark-end
  } satisfies NgDiagramConfig;

  // @mark-start
  onDiagramInit(_: DiagramInitEvent) {
    this.diagramService.registerRouting(new ArcRouting());
    // An edge is routed when it is added, so it is added after the routing is registered
    this.modelService.addEdges([
      {
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        data: {},
        routing: 'arc',
      },
    ]);
  }
  // @mark-end

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
  });
}
