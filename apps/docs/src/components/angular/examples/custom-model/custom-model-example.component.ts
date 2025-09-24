import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import type { Node } from 'ng-diagram';
import { NgDiagramComponent, NgDiagramModelService } from 'ng-diagram';
import { LocalStorageModelAdapter } from './local-storage-model-adapter';

@Component({
  selector: 'app-custom-model-example',
  standalone: true,
  imports: [CommonModule, NgDiagramComponent],
  templateUrl: './custom-model-example.component.html',
  styleUrl: './custom-model-example.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomModelExampleComponent {
  private modelService = inject(NgDiagramModelService);

  modelAdapter: LocalStorageModelAdapter = new LocalStorageModelAdapter(
    'ng-diagram-custom-demo',
    {
      nodes: [
        {
          id: '1',
          position: { x: 100, y: 100 },
          data: { label: 'Custom Node 1' },
        },
        {
          id: '2',
          position: { x: 300, y: 100 },
          data: { label: 'Custom Node 2' },
        },
      ],
      edges: [
        {
          id: 'edge-1',
          source: '1',
          target: '2',
          sourcePort: 'port-right',
          targetPort: 'port-left',
          data: {},
        },
      ],
      metadata: { viewport: { x: 0, y: 0, scale: 1 } },
    }
  );

  addNode() {
    const existingNodes = this.modelService.nodes();
    const newId = `node-${crypto.randomUUID()}`;
    const randomX = Math.floor(Math.random() * 400) + 50;
    const randomY = Math.floor(Math.random() * 300) + 50;

    const newNode: Node = {
      id: newId,
      position: { x: randomX, y: randomY },
      data: { label: `Custom Node ${existingNodes.length + 1}` },
    };

    this.modelService.addNodes([newNode]);
  }

  clearAll() {
    const nodeIds = this.modelService.nodes().map((node) => node.id);
    const edgeIds = this.modelService.edges().map((edge) => edge.id);
    this.modelService.deleteNodes(nodeIds);
    this.modelService.deleteEdges(edgeIds);
  }
}
