import '@angular/compiler';
import { Component } from '@angular/core';
import {
  NgDiagramContextComponent,
  NgDiagramModelService,
} from '@angularflow/angular-adapter';
import { CustomPortsExampleComponent } from './custom-ports-example.component';

@Component({
  selector: 'custom-ports-wrapper',
  imports: [NgDiagramContextComponent, CustomPortsExampleComponent],
  template: `
    <ng-diagram-context>
      <custom-ports-example></custom-ports-example>
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
  providers: [NgDiagramModelService],
})
export class CustomPortsWrapperComponent {}
