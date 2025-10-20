import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import type { NgDiagramConfig, Node } from 'ng-diagram';
import { NgDiagramComponent, NgDiagramModelService } from 'ng-diagram';
import { LocalStorageModelAdapter } from './local-storage-model-adapter';

@Component({
  selector: 'diagram',
  imports: [CommonModule, NgDiagramComponent],
  templateUrl: './diagram.component.html',
  styleUrl: './diagram.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagramComponent {
  private modelService = inject(NgDiagramModelService);

  config: NgDiagramConfig = {
    edgeRouting: { defaultRouting: 'orthogonal' },
  };

  modelAdapter: LocalStorageModelAdapter = new LocalStorageModelAdapter(
    'ng-diagram-custom-demo',
    this.getDefaultDiagram()
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

  reset() {
    if (window.confirm('Are you sure you want to reset the diagram?')) {
      this.resetDiagramToDefault();
    }
  }

  private resetDiagramToDefault() {
    const nodeIds = this.modelService.nodes().map((node) => node.id);
    const edgeIds = this.modelService.edges().map((edge) => edge.id);
    this.modelService.deleteNodes(nodeIds);
    this.modelService.deleteEdges(edgeIds);

    const defaultDiagram = this.getDefaultDiagram();
    this.modelService.addNodes(defaultDiagram.nodes);
    this.modelService.addEdges(defaultDiagram.edges);
  }

  private getDefaultDiagram() {
    return {
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
    };
  }
}
