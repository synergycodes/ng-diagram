import '@angular/compiler';

import { Component, computed, inject } from '@angular/core';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  NgDiagramModelService,
  NgDiagramService,
  provideNgDiagram,
  type Edge,
  type Node,
  type NgDiagramConfig,
} from 'ng-diagram';
import { LineJumpsRouting, type LineJumpStyle } from './line-jumps-routing';

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
      device('sensor-a', 'Sensor A', 100, 0),
      device('sensor-b', 'Sensor B', 440, 0),
      device('gateway', 'Gateway', 0, 150),
      device('router', 'Router', 0, 260),
      device('cloud', 'Cloud', 840, 150),
      device('backup', 'Backup', 840, 260),
      device('panel-a', 'Panel A', 400, 410),
      device('panel-b', 'Panel B', 740, 410),
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
  connect('sensor-a', 'panel-a'),
  connect('sensor-b', 'panel-b'),
  connect('gateway', 'cloud'),
  connect('router', 'backup'),
];

function device(id: string, label: string, x: number, y: number): Node {
  return { id, position: { x, y }, data: { label } };
}

function connect(source: string, target: string): Edge {
  return {
    id: `${source}-${target}`,
    source,
    sourcePort: 'port-right',
    target,
    targetPort: 'port-left',
    targetArrowhead: 'ng-diagram-arrow',
    data: {},
  };
}
