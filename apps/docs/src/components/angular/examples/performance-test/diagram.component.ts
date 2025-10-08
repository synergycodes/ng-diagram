import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  provideNgDiagram,
  type Edge,
  type Node,
} from 'ng-diagram';

@Component({
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `
    <div class="not-content diagram">
      <ng-diagram [model]="model" />
    </div>
  `,
  styles: `
    .diagram {
      display: flex;
      height: 30rem;
    }
  `,
})
export class DiagramComponent {
  model = initializeModel(this.generateModelData());

  generateModelData() {
    const nodes = this.generateNodes();
    const edges = this.generateEdges(nodes);

    return {
      metadata: {
        viewport: { x: 50, y: 100, scale: 0.1 },
      },
      nodes,
      edges,
    };
  }

  private generateNodes(): Node<Data>[] {
    const spacingX = 250;
    const spacingY = 120;
    const rows = 20;
    const columns = 25;
    const arrayLength = rows * columns;

    return Array.from({ length: arrayLength }, (_, index) => {
      const row = Math.floor(index / columns);
      const column = index % columns;
      const x = column * spacingX;
      const y = row * spacingY;
      const id =
        row % 2 === 0
          ? row * columns + column + 1
          : row * columns + (columns - column);

      return {
        id: `${id}`,
        position: { x, y },
        data: { label: `Node ${id}`, row },
      };
    }).sort((a, b) => Number(a.id) - Number(b.id));
  }

  private generateEdges(nodes: Node<Data>[]): Edge[] {
    return nodes.slice(0, -1).map((node, index) => {
      const next = nodes[index + 1];
      return {
        id: `edge-${node.id}`,
        source: node.id,
        target: next.id,
        sourcePort: node.data.row % 2 === 0 ? 'port-right' : 'port-left',
        targetPort: next.data.row % 2 === 0 ? 'port-left' : 'port-right',
        data: {},
      };
    });
  }
}

type Data = {
  label: string;
  row: number;
};
