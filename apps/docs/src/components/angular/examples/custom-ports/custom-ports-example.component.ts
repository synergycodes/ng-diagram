import '@angular/compiler';
import { Component, inject } from '@angular/core';
import {
  NgDiagramComponent,
  NgDiagramModelService,
  type NgDiagramConfig,
  type NgDiagramNodeTemplateMap,
} from '@angularflow/angular-adapter';
import { createSignalModel } from '@angularflow/angular-signals-model';
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
  styles: [
    `
      :host {
        width: 100%;
        height: 100%;
        .diagram {
          flex: 1;
          display: flex;
          height: 20rem;
          font-family: 'Poppins', sans-serif;
        }
      }
    `,
  ],
  providers: [NgDiagramModelService],
})
export class CustomPortsExampleComponent {
  private readonly modelService = inject(NgDiagramModelService);
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

  model = createSignalModel({
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
