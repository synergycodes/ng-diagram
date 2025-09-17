import { CommonModule } from '@angular/common';
import '@angular/compiler';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { Node } from '@angularflow/angular-adapter';
import {
  NgDiagramComponent,
  NgDiagramContextComponent,
} from '@angularflow/angular-adapter';
import { LocalStorageModelAdapter } from './local-storage-model-adapter';

@Component({
  selector: 'app-custom-model-example',
  standalone: true,
  imports: [CommonModule, NgDiagramComponent, NgDiagramContextComponent],
  templateUrl: './custom-model-example.component.html',
  styleUrl: './custom-model-example.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomModelExampleComponent {
  modelAdapter: LocalStorageModelAdapter = new LocalStorageModelAdapter(
    'ng-diagram-custom-demo',
    {
      nodes: [
        {
          id: '1',
          position: { x: 100, y: 100 },
          data: { label: 'Persistent Node 1' },
        },
        {
          id: '2',
          position: { x: 300, y: 100 },
          data: { label: 'Persistent Node 2' },
        },
      ],
      edges: [
        {
          id: 'edge-1',
          source: '1',
          target: '2',
          sourcePort: 'port-right',
          targetPort: 'port-left',
          data: { label: 'Stored Connection' },
        },
      ],
      metadata: { viewport: { x: 0, y: 0, scale: 0.5 } },
    }
  );

  addNode() {
    const existingNodes = this.modelAdapter.getNodes();
    const newId = `node-${Date.now()}`;
    const randomX = Math.floor(Math.random() * 400) + 50;
    const randomY = Math.floor(Math.random() * 300) + 50;

    const newNode: Node = {
      id: newId,
      position: { x: randomX, y: randomY },
      data: { label: `Custom Node ${existingNodes.length + 1}` },
    };

    this.modelAdapter.updateNodes([...existingNodes, newNode]);
  }

  clearAll() {
    this.modelAdapter.updateNodes([]);
    this.modelAdapter.updateEdges([]);
  }
}
