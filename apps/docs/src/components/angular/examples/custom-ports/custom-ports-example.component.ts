import '@angular/compiler';
import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  NgDiagramModelService,
  type NgDiagramConfig,
  type NgDiagramNodeTemplateMap,
} from 'ng-diagram';
import { NodeComponent } from './node/node.component';

@Component({
  selector: 'custom-ports-example',
  imports: [NgDiagramComponent],
  template: `
    <div class="not-content diagram">
      <ng-diagram
        [model]="model"
        [config]="config"
        [nodeTemplateMap]="nodeTemplateMap"
      />
    </div>
  `,
  styleUrl: './custom-ports-example.component.scss',
  providers: [NgDiagramModelService],
})
export class CustomPortsExampleComponent {
  nodeTemplateMap: NgDiagramNodeTemplateMap = new Map([
    ['myType', NodeComponent],
  ]);

  config = {
    edgeRouting: { defaultRouting: 'orthogonal' },
    zoom: {
      max: 3,
    },
    zIndex: {
      edgesAboveConnectedNodes: true,
    },
  } satisfies NgDiagramConfig;

  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: { x: 100, y: 100 },
        type: 'myType',
        data: {
          name: 'Custom Node',
        },
      },
      {
        id: '2',
        position: { x: 300, y: 200 },
        type: 'myType',
        data: {
          name: 'Custom Node 2',
          leftPortColor: 'red',
        },
      },
    ],
    edges: [
      {
        id: '1',
        source: '1',
        target: '2',
        data: {},
        sourcePort: 'port-bottom',
        targetPort: 'port-left',
        sourceArrowhead: 'ng-diagram-arrow',
      },
      {
        id: '2',
        source: '2',
        target: '1',
        data: {},
        sourcePort: 'port-top',
        targetPort: 'port-right',
        sourceArrowhead: 'ng-diagram-arrow',
      },
      {
        id: '3',
        source: '2',
        target: '1',
        data: {},
        sourcePort: 'port-right',
        targetPort: 'port-left',
        sourceArrowhead: 'ng-diagram-arrow',
      },
    ],
    metadata: { viewport: { x: 0, y: 0, scale: 1 } },
  });
}
