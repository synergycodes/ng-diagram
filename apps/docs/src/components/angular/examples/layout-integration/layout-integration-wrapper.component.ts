import '@angular/compiler';
import { Component } from '@angular/core';
import { provideNgDiagram } from 'ng-diagram';
import { DiagramComponent } from './diagram.component';

@Component({
  selector: 'layout-integration-wrapper',
  imports: [DiagramComponent],
  providers: [provideNgDiagram()],
  template: ` <diagram-component /> `,
  styles: [
    `
      :host {
        flex: 1;
        display: flex;
        position: relative;
        height: 100%;
      }
    `,
  ],
})
export class LayoutIntegrationWrapperComponent {}
