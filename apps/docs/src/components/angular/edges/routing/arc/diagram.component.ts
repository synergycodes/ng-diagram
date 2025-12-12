import '@angular/compiler';

import { Component, inject } from '@angular/core';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
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
    edges: [
      {
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        data: {},
        // @mark-start
        routing: 'arc',
        // @mark-end
      },
    ],
  });
}
