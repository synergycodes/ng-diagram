import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import type { NgDiagramConfig, Node } from 'ng-diagram';
import {
  NgDiagramNodeTemplateMap,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  NgDiagramModelService,
} from 'ng-diagram';
import { LocalStorageModelAdapter } from './local-storage-model-adapter';
import { NodeComponent } from './node/node.component';

enum NodeTemplateType {
  CustomNodeType = 'customNodeType',
}

@Component({
  selector: 'diagram',
  imports: [CommonModule, NgDiagramComponent, NgDiagramBackgroundComponent],
  templateUrl: './diagram.component.html',
  styleUrl: './diagram.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagramComponent {
  nodeTemplateMap = new NgDiagramNodeTemplateMap([
    [NodeTemplateType.CustomNodeType, NodeComponent],
  ]);
  private modelService = inject(NgDiagramModelService);

  config: NgDiagramConfig = {
    zoom: {
      zoomToFit: {
        onInit: true,
        padding: 180,
      },
    },
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
      type: NodeTemplateType.CustomNodeType,
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
          position: { x: 0, y: 0 },
          data: { label: 'Node 1' },
          type: NodeTemplateType.CustomNodeType,
        },
        {
          id: '2',
          position: { x: 420, y: 0 },
          data: { label: 'Node 2' },
          type: NodeTemplateType.CustomNodeType,
        },
      ],
      edges: [
        {
          id: 'edge-1',
          source: '1',
          target: '2',
          sourcePort: 'port-bottom',
          targetPort: 'port-top',
          data: {},
        },
      ],
    };
  }
}
