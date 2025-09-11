import { Component, computed, inject } from '@angular/core';
import {
  NgDiagramModelService,
  NgDiagramService,
} from '@angularflow/angular-adapter';
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
    //TODO: When tree config is fixed, apply 90 angle to the Tree
    this.diagramService.layout('tree');
  }

  async onCustomLayout() {
    const { nodes: finalNodes, edges: finalEdges } = await performLayout(
      this.nodes(),
      this.edges()
    );

    for (const node of finalNodes) {
      this.modelService.updateNode(node.id, node);
    }

    for (const edge of finalEdges) {
      this.modelService.updateEdge(edge.id, edge);
    }
  }
}
