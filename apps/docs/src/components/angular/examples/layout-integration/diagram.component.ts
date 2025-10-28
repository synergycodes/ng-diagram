import '@angular/compiler';

import { Component, inject } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  NgDiagramModelService,
  provideNgDiagram,
  type NgDiagramConfig,
  type SelectionMovedEvent,
} from 'ng-diagram';
import { diagramModel } from './data';
import { LayoutButtonsComponent } from './layout-buttons/layout-buttons.component';

@Component({
  imports: [NgDiagramComponent, LayoutButtonsComponent],
  template: `
    <layout-buttons />
    <div class="not-content diagram">
      <ng-diagram
        [model]="model"
        [config]="config"
        (selectionMoved)="onSelectionMoved($event)"
      />
    </div>
  `,
  styleUrls: ['./diagram.component.scss'],
  providers: [provideNgDiagram()],
})
export class DiagramComponent {
  private modelService = inject(NgDiagramModelService);

  model = initializeModel({
    nodes: diagramModel.nodes,
    edges: diagramModel.edges,
  });

  config: NgDiagramConfig = {
    edgeRouting: { defaultRouting: 'orthogonal' },
    zoom: {
      zoomToFit: {
        onInit: true,
      },
    },
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
