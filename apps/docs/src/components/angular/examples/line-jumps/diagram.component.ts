import '@angular/compiler';

import { Component, computed, inject } from '@angular/core';
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
import { LineJumpsRouting, type LineJumpStyle } from './line-jumps-routing';
import { NodeComponent } from './node/node.component';

@Component({
  imports: [NgDiagramComponent, NgDiagramBackgroundComponent],
  providers: [provideNgDiagram()],
  template: `
    <div class="not-content diagram">
      <div class="controls">
        <button
          type="button"
          [class.active]="jumpStyle() === 'arc'"
          [attr.aria-pressed]="jumpStyle() === 'arc'"
          [disabled]="!isInitialized()"
          (click)="setJumpStyle('arc')"
        >
          Arc
        </button>
        <button
          type="button"
          [class.active]="jumpStyle() === 'gap'"
          [attr.aria-pressed]="jumpStyle() === 'gap'"
          [disabled]="!isInitialized()"
          (click)="setJumpStyle('gap')"
        >
          Gap
        </button>
      </div>
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

  private readonly routing = new LineJumpsRouting(
    this.modelService.edges,
    this.diagramService.config
  );

  // The buttons show the style from the config, so there is one source of truth
  readonly jumpStyle = computed(() => this.routing.options().style);
  // updateConfig() needs the diagram, so the buttons wait for it
  readonly isInitialized = this.diagramService.isInitialized;

  nodeTemplateMap = new NgDiagramNodeTemplateMap([['device', NodeComponent]]);

  config = {
    zoom: {
      zoomToFit: {
        onInit: true,
        padding: 60,
      },
    },
    edgeRouting: {
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
  onDiagramInit() {
    this.diagramService.registerRouting(this.routing);
    // Edges without `routing`, also the ones drawn by the user, use the jumps
    this.diagramService.setDefaultRouting('line-jumps');
    this.modelService.addEdges(edges);
  }

  // 'arc' draws a bridge over the crossed line, 'gap' only breaks the line
  setJumpStyle(style: LineJumpStyle) {
    this.diagramService.updateConfig({
      edgeRouting: { 'line-jumps': { style } },
    });
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
