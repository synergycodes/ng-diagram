import '@angular/compiler';

import { Component, inject } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  NgDiagramModelService,
  type NgDiagramConfig,
  type SelectionMovedEvent,
} from '@angularflow/angular-adapter';
import { diagramModel } from './data';
import { LayoutButtonsComponent } from './layout-buttons.component';

@Component({
  selector: 'diagram-component',
  imports: [NgDiagramComponent, LayoutButtonsComponent],
  template: `
    <ng-diagram
      [model]="model"
      [config]="config"
      (selectionMoved)="onSelectionMoved($event)"
    />
    <layout-buttons />
  `,
  styles: `
    :host {
      flex: 1;
      position: relative;
      display: flex;
      height: 100%;

      .coordinates {
        display: flex;
      }
    }
  `,
})
export class DiagramComponent {
  private modelService = inject(NgDiagramModelService);

  model = initializeModel({
    metadata: {
      viewport: { x: 100, y: 80, scale: 0.5 },
    },
    nodes: diagramModel.nodes,
    edges: diagramModel.edges,
  });

  config: NgDiagramConfig = {
    edgeRouting: { defaultRouting: 'orthogonal' },
    treeLayout: { layoutAngle: 0 },
  };

  // When user manually moves nodes, edges in manual routing mode should be
  // reset to auto so they follow the node movement and re-route appropriately
  onSelectionMoved(event: SelectionMovedEvent): void {
    const movedNodeIds = new Set(event.nodes.map((n) => n.id));
    const edges = this.modelService.edges();

    const edgesToUpdate = edges
      .filter(
        (edge) =>
          (movedNodeIds.has(edge.source) || movedNodeIds.has(edge.target)) &&
          edge.routingMode === 'manual'
      )
      .map((edge) => ({
        id: edge.id,
        routingMode: 'auto' as const,
      }));

    if (edgesToUpdate.length > 0) {
      this.modelService.updateEdges(edgesToUpdate);
    }
  }
}
