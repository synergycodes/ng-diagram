import '@angular/compiler';
import { Component, inject } from '@angular/core';
import {
  NgDiagramComponent,
  NgDiagramModelService,
  NgDiagramNodeTemplateMap,
  type NgDiagramConfig,
} from '@angularflow/angular-adapter';
import { createSignalModel } from '@angularflow/angular-signals-model';
import { MenuComponent } from './menu/menu.component';
import { ContextMenuService } from './menu/menu.service';
import { NodeComponent } from './node/node.component';

@Component({
  selector: 'context-menu-example',
  imports: [NgDiagramComponent, MenuComponent],
  template: `
    <div (contextmenu)="onDiagramRightClick($event)">
      <div class="not-content diagram">
        <ng-diagram
          [model]="model"
          [config]="config"
          [nodeTemplateMap]="nodeTemplateMap"
        />
      </div>
      <menu></menu>
    </div>
  `,
  styles: [
    `
      :host {
        width: 100%;
        height: 100%;
      }
      .diagram {
        flex: 1;
        display: flex;
        height: 20rem;
        font-family: 'Poppins', sans-serif;
      }
    `,
  ],
  providers: [ContextMenuService, NgDiagramModelService],
})
export class ContextMenuExampleComponent {
  private contextMenuService = inject(ContextMenuService);
  private readonly modelService = inject(NgDiagramModelService);
  nodeTemplateMap = new NgDiagramNodeTemplateMap([
    ['customNodeType', NodeComponent],
  ]);

  config = {
    zoom: {
      max: 3,
    },
  } satisfies NgDiagramConfig;

  model = createSignalModel({
    nodes: [
      {
        id: '1',
        position: { x: 100, y: 100 },
        type: 'customNodeType',
        data: {
          name: 'Custom Node',
        },
      },
    ],
    edges: [],
    metadata: { viewport: { x: 0, y: 0, scale: 1 } },
  });

  onDiagramRightClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const cursorPosition = this.modelService.clientToFlowViewportPosition({
      x: event.clientX,
      y: event.clientY,
    });
    this.contextMenuService.showDiagramMenu(cursorPosition);
  }
}
