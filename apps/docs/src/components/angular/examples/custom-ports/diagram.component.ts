import '@angular/compiler';
import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  NgDiagramModelService,
  provideNgDiagram,
  type Edge,
  type NgDiagramConfig,
  type NgDiagramNodeTemplateMap,
} from 'ng-diagram';
import { HeaderNodeComponent } from './header-node/header-node.component';
import { SocketNodeComponent } from './socket-node/socket-node.component';

@Component({
  imports: [NgDiagramComponent, NgDiagramBackgroundComponent],
  providers: [NgDiagramModelService, provideNgDiagram()],
  template: `
    <div class="not-content diagram">
      <ng-diagram
        [model]="model"
        [config]="config"
        [nodeTemplateMap]="nodeTemplateMap"
      >
        <ng-diagram-background />
      </ng-diagram>
    </div>
  `,
  styleUrl: './diagram.component.scss',
})
export class DiagramComponent {
  nodeTemplateMap: NgDiagramNodeTemplateMap = new Map([
    ['headerNodeType', HeaderNodeComponent],
    ['socketNodeType', SocketNodeComponent],
  ]);

  config = {
    zoom: {
      max: 3,
      zoomToFit: {
        onInit: false,
      },
    },
    edgeRouting: {
      orthogonal: {
        maxCornerRadius: 0,
      },
    },
    linking: {
      finalEdgeDataBuilder: (edge: Edge) => ({
        ...edge,
        targetArrowhead: undefined,
      }),
    },
    zIndex: {
      edgesAboveConnectedNodes: true,
    },
  } satisfies NgDiagramConfig;

  model = initializeModel({
    metadata: { viewport: { x: 200, y: 50, scale: 1 } },
    nodes: [
      {
        id: '1',
        position: { x: 0, y: 0 },
        autoSize: false,
        size: { width: 200, height: 400 },
        type: 'headerNodeType',
        data: {
          name: 'IC 111111',
        },
      },
      {
        id: '2',
        position: { x: 300, y: 140 },
        autoSize: false,
        angle: 90,
        size: { width: 250, height: 80 },
        type: 'socketNodeType',
        data: {
          name: 'Socket 01',
        },
      },
    ],
    edges: [
      {
        id: 'abf5265b-c5c3-45af-a382-77776faa65aa',
        data: {},
        source: '2',
        sourcePort: 'port-bottom-1',
        target: '1',
        targetPort: 'port-c1plus',
      },
      {
        id: 'ffde2e9d-3fd8-4463-b570-ff9b3d3ec6ac',
        data: {},
        source: '2',
        sourcePort: 'port-bottom-2',
        target: '1',
        targetPort: 'port-r3in',
      },
      {
        id: '96b05c41-c4bb-4c65-a737-dc0e480cc15e',
        data: {},
        source: '2',
        sourcePort: 'port-bottom-3',
        target: '1',
        targetPort: 'port-r4in',
      },
      {
        id: 'c74539f0-1ab5-4bf7-a0af-49e194ed8063',
        data: {},
        source: '2',
        sourcePort: 'port-bottom-4',
        target: '1',
        targetPort: 'port-t3out',
      },
      {
        id: 'd86312f4-4269-4006-bd1f-3d9bbbe49cee',
        data: {},
        source: '2',
        sourcePort: 'port-bottom-5',
        target: '1',
        targetPort: 'port-t1out',
      },
    ],
  });
}
