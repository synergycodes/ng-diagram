import '@angular/compiler';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  NgDiagramNodeTemplateMap,
  provideNgDiagram,
  type Edge,
  type NgDiagramConfig,
} from 'ng-diagram';

import { NodeComponent } from './node/node.component';

enum NodeTemplateType {
  CustomNodeType = 'customNodeType',
}

@Component({
  imports: [NgDiagramComponent, NgDiagramBackgroundComponent],
  providers: [provideNgDiagram()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="not-content diagram flex h-[30rem] border border-gray-200 dark:border-gray-700"
    >
      <ng-diagram
        [model]="model"
        [config]="config"
        [nodeTemplateMap]="nodeTemplateMap"
      >
        <ng-diagram-background />
      </ng-diagram>
    </div>
  `,
})
export class DiagramComponent {
  nodeTemplateMap = new NgDiagramNodeTemplateMap([
    [NodeTemplateType.CustomNodeType, NodeComponent],
  ]);

  config = {
    zoom: {
      max: 3,
      zoomToFit: {
        onInit: true,
        padding: 70,
      },
    },
    edgeRouting: {
      defaultRouting: 'orthogonal',
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
    nodes: [
      {
        id: '1',
        position: { x: 80, y: 100 },
        type: 'customNodeType',
        autoSize: false,
        data: {
          name: 'Node 1',
          description: 'This is Tailwind Node 1',
          tooltip: 'Styles are applied with Tailwind CSS',
        },
        rotatable: true,
        resizable: false,
      },
      {
        id: '2',
        position: { x: 450, y: 100 },
        type: 'customNodeType',
        data: {
          name: 'Node 2',
          description: 'This is Tailwind Node 2',
          tooltip: 'Styles are applied with Tailwind CSS',
        },
        rotatable: true,
        resizable: false,
        angle: 30,
      },
    ],
    edges: [
      {
        id: '1',
        source: '1',
        target: '2',
        data: {},
        sourcePort: 'port-right',
        targetPort: 'port-left',
        sourceArrowhead: 'ng-diagram-arrow',
      },
    ],
  });
}
