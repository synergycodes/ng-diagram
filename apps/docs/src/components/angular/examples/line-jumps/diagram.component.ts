import '@angular/compiler';

import { Component, inject } from '@angular/core';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  NgDiagramModelService,
  NgDiagramNodeTemplateMap,
  NgDiagramService,
  provideNgDiagram,
  type Edge,
  type Node,
  type NgDiagramConfig,
} from 'ng-diagram';
import { LineJumpsRouting } from './line-jumps-routing';
import { NodeComponent } from './node.component';

@Component({
  imports: [NgDiagramComponent, NgDiagramBackgroundComponent],
  providers: [provideNgDiagram()],
  template: `
    <div class="not-content diagram">
      <ng-diagram
        [model]="model"
        [config]="config"
        [nodeTemplateMap]="nodeTemplateMap"
        (diagramInit)="onDiagramInit()"
      >
        <ng-diagram-background />
      </ng-diagram>
    </div>
  `,
  styleUrls: ['./diagram.component.scss'],
})
export class DiagramComponent {
  private readonly diagramService = inject(NgDiagramService);
  private readonly modelService = inject(NgDiagramModelService);

  nodeTemplateMap = new NgDiagramNodeTemplateMap([['device', NodeComponent]]);

  config = {
    zoom: {
      zoomToFit: {
        onInit: true,
        padding: 60,
      },
    },
    edgeRouting: {
      defaultRouting: 'orthogonal',
      // 'gap' breaks the line instead of drawing an arc
      'line-jumps': { size: 16, style: 'arc' },
    },
  } satisfies NgDiagramConfig;

  model = initializeModel({
    nodes: [
      device('sensor-a', 'Sensor A', 200, 0),
      device('sensor-b', 'Sensor B', 450, 0),
      device('gateway', 'Gateway', 0, 140),
      device('cloud', 'Cloud', 700, 140),
      device('backup', 'Backup', 700, 240),
      device('panel-a', 'Panel A', 200, 340),
      device('panel-b', 'Panel B', 450, 340),
    ],
  });

  // The routing must be registered before the edges are routed,
  // so the edges are added after diagramInit.
  async onDiagramInit() {
    this.diagramService.registerRouting(
      new LineJumpsRouting(this.modelService.edges)
    );
    // Edges without `routing`, also the ones drawn by the user, use the jumps
    this.diagramService.setDefaultRouting('line-jumps');
    await this.modelService.addEdges(edges);
  }
}

const edges: Edge[] = [
  connect('sensor-a', 'port-bottom', 'panel-a', 'port-top'),
  connect('sensor-b', 'port-bottom', 'panel-b', 'port-top'),
  connect('gateway', 'port-right', 'cloud', 'port-left'),
  connect('gateway', 'port-bottom', 'backup', 'port-left'),
];

function device(id: string, label: string, x: number, y: number): Node {
  return { id, type: 'device', position: { x, y }, data: { label } };
}

function connect(
  source: string,
  sourcePort: string,
  target: string,
  targetPort: string
): Edge {
  return {
    id: `${source}-${target}`,
    source,
    sourcePort,
    target,
    targetPort,
    targetArrowhead: 'ng-diagram-arrow',
    data: {},
  };
}
