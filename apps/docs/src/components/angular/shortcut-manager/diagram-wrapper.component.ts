import '@angular/compiler';
import { Component } from '@angular/core';
import { NgDiagramModelService, provideNgDiagram } from 'ng-diagram';
import { DiagramComponent } from './diagram.component';

@Component({
  imports: [DiagramComponent],
  template: `<shortcut-manager-example></shortcut-manager-example> `,
  styles: [
    `
      :host {
        display: flex;
        position: relative;
      }
    `,
  ],
  providers: [NgDiagramModelService, provideNgDiagram()],
})
export class DiagramWrapperComponent {}
