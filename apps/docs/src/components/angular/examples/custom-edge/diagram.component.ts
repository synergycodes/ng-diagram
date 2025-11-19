import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  NgDiagramEdgeTemplateMap,
  NgDiagramNodeTemplateMap,
  provideNgDiagram,
  type NgDiagramConfig,
} from 'ng-diagram';
import { CircleArrowheadComponent } from './circle-arrowhead.component';
import { LabeledEdgeComponent } from './labeled-edge.component';
import { NodeComponent } from './node/node.component';
import { SinusoidEdgeComponent } from './sinusoid-edge.component';

enum NodeTemplateType {
  CustomNodeType = 'customNodeType',
}

@Component({
  imports: [
    NgDiagramComponent,
    NgDiagramBackgroundComponent,
    CircleArrowheadComponent,
  ],
  providers: [provideNgDiagram()],
  template: `
    <div class="not-content diagram">
      <ng-diagram
        [model]="model"
        [edgeTemplateMap]="edgeTemplateMap"
        [nodeTemplateMap]="nodeTemplateMap"
        [config]="config"
      >
        <ng-diagram-background />
      </ng-diagram>
      <circle-arrowhead />
    </div>
  `,
  styleUrls: ['./diagram.component.scss'],
})
export class DiagramComponent {
  nodeTemplateMap = new NgDiagramNodeTemplateMap([
    [NodeTemplateType.CustomNodeType, NodeComponent],
  ]);
  edgeTemplateMap = new NgDiagramEdgeTemplateMap([
    ['labeled', LabeledEdgeComponent],
    ['sinusoid', SinusoidEdgeComponent],
  ]);

  config = {
    zoom: {
      zoomToFit: {
        onInit: true,
      },
    },
  } satisfies NgDiagramConfig;

  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: { x: 200, y: 0 },
        data: { label: 'Node 1' },
        type: NodeTemplateType.CustomNodeType,
      },
      {
        id: '2',
        position: { x: 620, y: 80 },
        data: { label: 'Node 2' },
        type: NodeTemplateType.CustomNodeType,
      },
      {
        id: '3',
        position: { x: 180, y: 230 },
        data: { label: 'Node 3' },
        type: NodeTemplateType.CustomNodeType,
      },
      {
        id: '4',
        position: { x: 430, y: 480 },
        data: { label: 'Node 4' },
        type: NodeTemplateType.CustomNodeType,
      },
    ],
    edges: [
      {
        id: '1',
        source: '1',
        sourcePort: 'port-bottom',
        targetPort: 'port-left',
        target: '2',
        data: {},
        sourceArrowhead: 'circle-arrowhead',
      },
      {
        id: '2',
        source: '2',
        sourcePort: 'port-left',
        targetPort: 'port-right',
        target: '3',
        type: 'labeled',
        data: {},
      },
      {
        id: '3',
        source: '3',
        sourcePort: 'port-bottom',
        targetPort: 'port-left',
        target: '4',
        type: 'sinusoid',
        data: {},
      },
    ],
  });
}
