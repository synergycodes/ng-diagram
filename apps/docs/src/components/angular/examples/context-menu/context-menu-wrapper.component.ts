import '@angular/compiler';
import { Component } from '@angular/core';
import { NgDiagramModelService, provideNgDiagram } from 'ng-diagram';
import { ContextMenuExampleComponent } from './context-menu-example.component';
import { ContextMenuService } from './menu/menu.service';

@Component({
  selector: 'context-menu-wrapper',
  imports: [ContextMenuExampleComponent],
  template: `<context-menu-example></context-menu-example> `,
  styles: [
    `
      :host {
        flex: 1;
        display: flex;
        position: relative;
      }
    `,
  ],
  providers: [ContextMenuService, NgDiagramModelService, provideNgDiagram()],
})
export class ContextMenuWrapperComponent {}
