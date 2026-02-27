import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import type { Model, NgDiagramConfig, Node } from 'ng-diagram';
import {
  initializeModelAdapter,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  NgDiagramModelService,
  NgDiagramService,
  NgDiagramViewportService,
} from 'ng-diagram';
import { LocalStorageModelAdapter } from './local-storage-model-adapter';

@Component({
  selector: 'diagram',
  imports: [NgDiagramComponent, NgDiagramBackgroundComponent],
  templateUrl: './diagram.component.html',
  styleUrl: './diagram.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagramComponent {
  private modelService = inject(NgDiagramModelService);
  private diagramService = inject(NgDiagramService);
  private viewportService = inject(NgDiagramViewportService);

  config: NgDiagramConfig = {
    zoom: {
      zoomToFit: {
        onInit: true,
        padding: 20,
      },
    },
  };

  model = initializeModelAdapter(
    new LocalStorageModelAdapter(
      'ng-diagram-custom-demo',
      this.getDefaultModel()
    )
  );

  async addNode() {
    const existingNodes = this.modelService.nodes();
    const newId = this.generateId();
    const randomX = Math.floor(Math.random() * 400) + 50;
    const randomY = Math.floor(Math.random() * 300) + 50;

    const newNode: Node = {
      id: newId,
      position: { x: randomX, y: randomY },
      data: { label: `Custom Node ${existingNodes.length + 1}` },
    };

    await this.diagramService.transaction(
      () => {
        this.modelService.addNodes([newNode]);
      },
      { waitForMeasurements: true }
    );
    this.viewportService.zoomToFit();
  }

  reset() {
    if (window.confirm('Are you sure you want to reset the diagram?')) {
      this.resetDiagramToDefault();
    }
  }

  private async resetDiagramToDefault() {
    const nodeIds = this.modelService.nodes().map((node) => node.id);
    const edgeIds = this.modelService.edges().map((edge) => edge.id);
    const defaultModel = this.getDefaultModel();

    // This works because default model IDs are unique (generated via crypto.randomUUID).
    // Be aware of ID collision pitfalls when mixing delete + add in a single transaction:
    // https://www.ngdiagram.dev/docs/guides/transactions/#how-transactions-work
    await this.diagramService.transaction(
      () => {
        this.modelService.deleteNodes(nodeIds);
        this.modelService.deleteEdges(edgeIds);

        this.modelService.addNodes(defaultModel.nodes);
        this.modelService.addEdges(defaultModel.edges);
      },
      { waitForMeasurements: true }
    );
    this.viewportService.zoomToFit();
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  private getDefaultModel(): Model {
    const nodeId1 = this.generateId();
    const nodeId2 = this.generateId();

    return {
      nodes: [
        {
          id: nodeId1,
          position: { x: 0, y: 0 },
          data: { label: 'Node 1' },
        },
        {
          id: nodeId2,
          position: { x: 420, y: 0 },
          data: { label: 'Node 2' },
        },
      ],
      edges: [
        {
          id: this.generateId(),
          source: nodeId1,
          target: nodeId2,
          sourcePort: 'port-right',
          targetPort: 'port-left',
          data: {},
        },
      ],
      metadata: {},
    };
  }
}
