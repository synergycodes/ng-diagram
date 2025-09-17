import { Component, computed, inject } from '@angular/core';
import { NgDiagramModelService, NgDiagramService } from 'ng-diagram';
import { performLayout } from './perform-layout';

@Component({
  imports: [],
  selector: 'layout-buttons',
  template: `
    <button (click)="onTreeLayout()">Perform built-in tree layout</button>
    <button (click)="onCustomLayout()">Perform custom layout</button>
  `,
  styles: `
    :host {
      position: absolute;
      width: 100%;
      height: 2rem;
      gap: 1rem;
      bottom: 1rem;
      left: 0;

      display: flex;
      justify-content: center;
      align-items: center;
    }
  `,
})
export class LayoutButtonsComponent {
  diagramService = inject(NgDiagramService);
  modelService = inject(NgDiagramModelService);

  nodes = computed(() => this.modelService.getModel().getNodes());
  edges = computed(() => this.modelService.getModel().getEdges());

  onTreeLayout() {
    // Reset all edges to auto routing mode before applying built-in tree layout
    const edges = this.edges();
    const edgesToReset = edges
      .filter((edge) => edge.routingMode === 'manual')
      .map((edge) => ({
        id: edge.id,
        routingMode: 'auto' as const,
      }));

    if (edgesToReset.length > 0) {
      this.modelService.updateEdges(edgesToReset);
    }

    this.diagramService.layout('tree');
  }

  async onCustomLayout() {
    const { nodes: finalNodes, edges: finalEdges } = await performLayout(
      this.nodes(),
      this.edges()
    );

    if (finalNodes.length > 0) {
      this.modelService.updateNodes(finalNodes);
    }

    if (finalEdges.length > 0) {
      this.modelService.updateEdges(finalEdges);
    }
  }
}
