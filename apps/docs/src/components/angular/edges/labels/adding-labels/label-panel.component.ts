// @section-start
import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgDiagramModelService } from 'ng-diagram';

@Component({
  selector: 'label-panel',
  imports: [FormsModule],
  template: `
    <!-- @mark-start -->
    @if (isEdgeSelected()) {
      <input [(ngModel)]="label" />
    } @else {
      Select an edge
    }
    <button (click)="onSetLabel()">Set Label</button>
    <!-- @mark-end -->
  `,
  // @collapse-start
  styles: `
    :host {
      z-index: 1;
      background-color: var(--ngd-node-bg-primary-default);
      border: var(--ng-diagram-border);
      position: absolute;
      width: 8rem;
      top: 1rem;
      right: 1rem;
      height: calc(100% - 2rem);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;

      input {
        width: calc(100% - 2rem);
      }
    }
  `,
  // @collapse-end
})
export class LabelPanel {
  private modelService: NgDiagramModelService = inject(NgDiagramModelService);
  edges = computed(() => this.modelService.getModel().getEdges());
  // @collapse-start

  selectedEdge = computed(() => this.edges().find((edge) => edge.selected));
  isEdgeSelected = computed(() => !!this.selectedEdge());
  label = '';

  // @collapse-end
  // @mark-start
  onSetLabel() {
    const edgeToUpdate = this.edges().find((edge) => edge.selected);

    if (!edgeToUpdate) {
      return;
    }

    this.modelService.updateEdgeData(edgeToUpdate.id, {
      label: this.label,
    });
  }
  // @mark-end
}
// @section-end
