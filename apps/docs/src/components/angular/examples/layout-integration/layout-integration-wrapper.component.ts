import '@angular/compiler';
import { Component } from '@angular/core';
import { NgDiagramContextComponent } from 'ng-diagram';
import { DiagramComponent } from './diagram.component';

@Component({
  selector: 'layout-integration-wrapper',
  imports: [NgDiagramContextComponent, DiagramComponent],
  template: `
    <ng-diagram-context>
      <diagram-component />
    </ng-diagram-context>
  `,
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
