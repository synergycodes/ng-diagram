import '@angular/compiler';
import { Component, inject } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  NgDiagramNodeTemplateMap,
  NgDiagramViewportService,
  type NgDiagramConfig,
} from 'ng-diagram';
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
  styleUrl: './diagram.component.scss',
  providers: [ContextMenuService, NgDiagramViewportService],
})
export class DiagramComponent {
  private contextMenuService = inject(ContextMenuService);
  private readonly viewportService = inject(NgDiagramViewportService);

  nodeTemplateMap = new NgDiagramNodeTemplateMap([
    ['customNodeType', NodeComponent],
  ]);

  config = {
    zoom: {
      max: 3,
      zoomToFit: {
        onInit: true,
        padding: 130,
      },
    },
  } satisfies NgDiagramConfig;

  model = initializeModel({
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
  });

  onDiagramRightClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const cursorPosition = this.viewportService.clientToFlowViewportPosition({
      x: event.clientX,
      y: event.clientY,
    });
    this.contextMenuService.showDiagramMenu(cursorPosition);
  }
}
