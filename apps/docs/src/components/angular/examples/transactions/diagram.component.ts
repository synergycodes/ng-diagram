import '@angular/compiler';

import { Component, inject } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  NgDiagramModelService,
  NgDiagramService,
  provideNgDiagram,
  type NgDiagramConfig,
} from 'ng-diagram';

@Component({
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `
    <div class="toolbar">
      <button (click)="onTestTransactionClick()">
        Create diagram (Transaction)
      </button>
      <button (click)="onTestWithoutTransactionClick()">
        Create diagram (Without Transaction)
      </button>
    </div>
    <div class="not-content diagram">
      <ng-diagram [model]="model" [config]="config" />
    </div>
  `,
  styleUrls: ['./diagram.component.scss'],
})
export class DiagramComponent {
  private ngDiagramService = inject(NgDiagramService);
  private modelService = inject(NgDiagramModelService);

  config: NgDiagramConfig = {
    debugMode: true,
    zoom: {
      zoomToFit: {
        onInit: true,
        padding: 200,
      },
    },
  };

  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: { x: 100, y: 200 },
        data: { label: 'Use Buttons to test transaction' },
      },
    ],
  });

  onTestTransactionClick() {
    this.cleanDiagram();
    this.ngDiagramService.transaction(() => {
      this.createDiagram('Transaction Node');
    });
  }

  onTestWithoutTransactionClick() {
    this.cleanDiagram();
    this.createDiagram('Non-transaction Node');
  }

  private createDiagram(nodeName: string) {
    this.modelService.addNodes([
      {
        id: '1',
        position: { x: 100, y: 100 },
        data: { label: nodeName },
      },
      {
        id: '2',
        position: { x: 100, y: 200 },
        data: { label: nodeName },
      },
      {
        id: '3',
        position: { x: 100, y: 300 },
        data: { label: nodeName },
      },
    ]);

    this.modelService.updateNodeData('1', {
      label: `Updated ${nodeName} 1`,
    });
    this.modelService.updateNodeData('2', {
      label: `Updated ${nodeName} 2`,
    });
    this.modelService.updateNodeData('3', {
      label: `Updated ${nodeName} 3`,
    });

    this.modelService.addEdges([
      {
        id: 'edge-1',
        source: '1',
        target: '2',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        data: {},
      },
      {
        id: 'edge-2',
        source: '2',
        target: '3',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        data: {},
      },
    ]);
  }

  private cleanDiagram() {
    this.modelService.deleteNodes(
      this.modelService.nodes().map((node) => node.id)
    );
  }
}
