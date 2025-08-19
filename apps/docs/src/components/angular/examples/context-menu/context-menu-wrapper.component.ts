import '@angular/compiler';
import { Component } from '@angular/core';
import { NgDiagramContextComponent, NgDiagramModelService } from '@angularflow/angular-adapter';
import { ContextMenuExampleComponent } from './context-menu-example.component';
import { ContextMenuService } from './menu/menu.service';

@Component({
  selector: 'context-menu-wrapper',
  imports: [NgDiagramContextComponent, ContextMenuExampleComponent],
  template: `
    <ng-diagram-context>
      <context-menu-example></context-menu-example>
    </ng-diagram-context>
  `,
  styles: [
    `
      :host {
        flex: 1;
        display: flex;
        position: relative;
      }
    `,
  ],
  providers: [ContextMenuService, NgDiagramModelService],
})
export class ContextMenuWrapperComponent {}
