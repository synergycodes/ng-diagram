import '@angular/compiler';

import { Component } from '@angular/core';
import {
  NgDiagramComponent,
  NgDiagramContextComponent,
  type AppMiddlewares,
  type Node,
} from '@angularflow/angular-adapter';
import { createSignalModel } from '@angularflow/angular-signals-model';

@Component({
  imports: [NgDiagramContextComponent, NgDiagramComponent],
  template: `
    <ng-diagram-context>
      <ng-diagram [model]="model" />
    </ng-diagram-context>
  `,
  styles: `
    :host {
      flex: 1;
      display: flex;
      height: 100%;
    }
  `,
})
export class NgDiagramStressTestContainer {
  model = createSignalModel<AppMiddlewares>(this.generateModelData());

  generateModelData() {
    const nodes: Node[] = this.generateNodes();
    const edges = this.generateEdges(nodes);

    return {
      metadata: {
        viewport: { x: 50, y: 130, scale: 0.1 },
      },
      nodes,
      edges,
    };
  }

  private generateNodes(): Node[] {
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

  private generateEdges(nodes: Node[]) {
    return nodes.slice(0, -1).map((node, i) => {
      const next = nodes[i + 1];
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
