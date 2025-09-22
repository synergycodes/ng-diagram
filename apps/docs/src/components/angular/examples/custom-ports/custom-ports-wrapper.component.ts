import '@angular/compiler';
import { Component } from '@angular/core';
import { NgDiagramModelService, provideNgDiagram } from 'ng-diagram';
import { CustomPortsExampleComponent } from './custom-ports-example.component';

@Component({
  selector: 'custom-ports-wrapper',
  imports: [CustomPortsExampleComponent],
  template: ` <custom-ports-example></custom-ports-example> `,
  styles: [
    `
      :host {
        flex: 1;
        display: flex;
        position: relative;
      }
    `,
  ],
  providers: [NgDiagramModelService, provideNgDiagram()],
})
export class CustomPortsWrapperComponent {}
