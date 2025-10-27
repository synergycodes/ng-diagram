import '@angular/compiler';
import { Component, computed, inject } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  NgDiagramModelService,
  NgDiagramService,
  provideNgDiagram,
  type NgDiagramNodeTemplateMap,
  type Node,
  type SelectionChangedEvent,
} from 'ng-diagram';

import { CustomNodeComponent } from './node/node.component';

@Component({
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `
    <div class="toolbar">
      <form>
        <div>
          <span>NgDiagramConfig defaultRotatable:</span>
          <select
            id="rotatable-select"
            (change)="setGlobalRotatable($any($event.target).value)"
            [value]="flowConfigRotatable().toString()"
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        </div>
      </form>
      @if (selectedNode?.type === 'myType') {
        <form>
          <div>
            <span>Resize Adornment defaultRotatable:</span>
            <select
              id="adornment-rotatable-select"
              (change)="setNodeAdornmentRotatable($any($event.target).value)"
              [value]="selectedNode.data?.rotatable?.toString() ?? 'undefined'"
            >
              <option value="true">True</option>
              <option value="false">False</option>
              <option value="undefined">Undefined</option>
            </select>
          </div>
        </form>
      }
      @if (selectedNode) {
        <form>
          <div>
            <span>Node Data rotatable:</span>
            <select
              id="node-rotatable-toggle"
              (change)="setNodeRotatable($any($event.target).value)"
              [value]="selectedNode.rotatable?.toString() ?? 'undefined'"
            >
              <option value="true">True</option>
              <option value="false">False</option>
              <option value="undefined">Undefined</option>
            </select>
          </div>
        </form>
      }
    </div>
    <div class="not-content diagram">
      <ng-diagram
        [model]="model"
        [nodeTemplateMap]="nodeTemplateMap"
        (selectionChanged)="onSelectionChange($event)"
      />
    </div>
  `,
  styleUrls: ['./diagram.component.scss'],
})
export class DiagramComponent {
  private ngDiagramService = inject(NgDiagramService);
  private modelService = inject(NgDiagramModelService);
  nodeTemplateMap: NgDiagramNodeTemplateMap = new Map([
    ['myType', CustomNodeComponent],
  ]);
  selectedNode: Node | null = null;
  flowConfigRotatable = computed(
    () => this.ngDiagramService.config().nodeRotation?.defaultRotatable ?? false
  );

  onSelectionChange(event: SelectionChangedEvent) {
    this.selectedNode = event.selectedNodes.length
      ? event.selectedNodes[0]
      : null;
  }

  private parseValue(value: string): boolean | undefined {
    if (value === 'true') {
      return true;
    } else if (value === 'false') {
      return false;
    }
    return undefined;
  }

  setGlobalRotatable(value: string) {
    this.ngDiagramService.updateConfig({
      nodeRotation: {
        defaultRotatable: value === 'true',
      },
    });
  }

  setNodeRotatable(value: string) {
    if (!this.selectedNode) {
      return;
    }
    this.modelService.updateNode(this.selectedNode.id, {
      rotatable: this.parseValue(value),
    });
  }

  setNodeAdornmentRotatable(value: string) {
    if (!this.selectedNode) {
      return;
    }
    this.modelService.updateNodeData(this.selectedNode.id, {
      rotatable: this.parseValue(value),
    });
  }

  // @section-start:model
  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: { x: 150, y: 150 },
        autoSize: false,
        type: 'myType',
        data: { adornmentRotatable: true },
        rotatable: false,
      },
      {
        id: '2',
        position: { x: 400, y: 150 },
        data: { label: 'Default node' },
      },
    ],
    edges: [],
    metadata: { viewport: { x: 0, y: 0, scale: 1 } },
  });
  // @section-end:model
}
