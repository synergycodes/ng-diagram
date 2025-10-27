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
          <span>NgDiagramConfig defaultResizable:</span>
          <select
            id="resizable-select"
            (change)="setGlobalResizable($any($event.target).value)"
            [value]="flowConfigResizable().toString()"
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        </div>
      </form>
      @if (selectedNode?.type === 'myType') {
        <form>
          <div>
            <span>Resize Adornment defaultResizable:</span>
            <select
              id="adornment-resizable-select"
              (change)="setNodeAdornmentResizable($any($event.target).value)"
              [value]="selectedNode.data?.resizable?.toString() ?? 'undefined'"
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
            <span>Node Data resizable:</span>
            <select
              id="node-resizable-toggle"
              (change)="setNodeResizable($any($event.target).value)"
              [value]="selectedNode.resizable?.toString() ?? 'undefined'"
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
  flowConfigResizable = computed(
    () => this.ngDiagramService.config().resize?.defaultResizable ?? false
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

  setGlobalResizable(value: string) {
    this.ngDiagramService.updateConfig({
      resize: {
        defaultResizable: value === 'true',
      },
    });
  }

  setNodeResizable(value: string) {
    if (!this.selectedNode) {
      return;
    }
    this.modelService.updateNode(this.selectedNode.id, {
      resizable: this.parseValue(value),
    });
  }

  setNodeAdornmentResizable(value: string) {
    if (!this.selectedNode) {
      return;
    }
    this.modelService.updateNodeData(this.selectedNode.id, {
      resizable: this.parseValue(value),
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
        data: { adornmentResizable: true },
        resizable: false,
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
