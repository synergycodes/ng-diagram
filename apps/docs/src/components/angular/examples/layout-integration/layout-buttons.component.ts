import { Component, computed, inject } from '@angular/core';
import { NgDiagramModelService, NgDiagramService } from 'ng-diagram';
import { performLayout } from './perform-layout';

@Component({
  imports: [],
  selector: 'layout-buttons',
  template: `
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
