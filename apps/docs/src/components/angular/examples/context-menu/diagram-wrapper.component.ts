import '@angular/compiler';
import { Component } from '@angular/core';
import { NgDiagramModelService, provideNgDiagram } from 'ng-diagram';
import { DiagramComponent } from './diagram.component';
import { ContextMenuService } from './menu/menu.service';

@Component({
  imports: [DiagramComponent],
  template: `<context-menu-example></context-menu-example> `,
  styles: [
    `
      :host {
        display: flex;
        position: relative;
      }
    `,
  ],
  providers: [ContextMenuService, NgDiagramModelService, provideNgDiagram()],
})
export class DiagramWrapperComponent {}
