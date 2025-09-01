import '@angular/compiler';

import { Component, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NgDiagramComponent,
  NgDiagramContextComponent,
  type AppMiddlewares,
  type NgDiagramEdgeTemplateMap,
} from '@angularflow/angular-adapter';
import { createSignalModel } from '@angularflow/angular-signals-model';
import { ModifiableLabelEdgeComponent } from './modifiable-label-edge.component';

@Component({
  imports: [NgDiagramContextComponent, NgDiagramComponent, FormsModule],
  template: `
    <ng-diagram-context>
      <ng-diagram [model]="model" [edgeTemplateMap]="edgeTemplateMap" />
      <div class="panel">
        @if (isEdgeSelected()) {
          <input [(ngModel)]="label" />
        } @else {
          Select an edge
        }
        <button (click)="onSetLabel()">Set Label</button>
      </div>
    </ng-diagram-context>
  `,
  styles: `
    :host {
      position: relative;
      flex: 1;
      display: flex;
      height: 100%;
    }

    .panel {
      z-index: 1;
      background: #222;
      position: absolute;
      width: 8rem;
      right: 0;
      height: 100%;
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
})
export class Diagram {
  selectedEdge = computed(() =>
    this.model.getEdges().find((edge) => edge.selected)
  );
  isEdgeSelected = computed(() => !!this.selectedEdge());
  label = '';

  edgeTemplateMap: NgDiagramEdgeTemplateMap = new Map([
    ['modifiable-label', ModifiableLabelEdgeComponent],
  ]);

  model = createSignalModel<AppMiddlewares>({
    metadata: {
      viewport: { x: 0, y: 0, scale: 0.7 },
    },
    nodes: [
      {
        id: 'a',
        position: { x: 75, y: 25 },
        data: { label: 'Node 1' },
        rotatable: true,
      },
      { id: 'b', position: { x: 550, y: 175 }, data: { label: 'Node 2' } },
      { id: 'c', position: { x: 75, y: 375 }, data: { label: 'Node 3' } },
    ],
    edges: [
      {
        id: '1',
        source: 'a',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        target: 'b',
        type: 'modifiable-label',
        data: {
          texts: [],
        },
      },
      {
        id: '2',
        source: 'b',
        sourcePort: 'port-left',
        targetPort: 'port-right',
        target: 'c',
        type: 'modifiable-label',
        data: {
          texts: [],
        },
      },
    ],
  });

  onSetLabel() {
    const edges = this.model.getEdges();

    const edgeToUpdate = edges.find((edge) => edge.selected);

    if (!edgeToUpdate) {
      return;
    }

    const updatedEdge = {
      ...edgeToUpdate,
      data: {
        label: this.label,
      },
    };

    this.model.setEdges(
      edges.map((edge) => (edge.id === edgeToUpdate.id ? updatedEdge : edge))
    );
  }
}
