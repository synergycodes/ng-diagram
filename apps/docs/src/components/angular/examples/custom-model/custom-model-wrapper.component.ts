import '@angular/compiler';
import { Component } from '@angular/core';
import { NgDiagramContextComponent } from 'ng-diagram';
import { CustomModelExampleComponent } from './custom-model-example.component';

@Component({
  selector: 'custom-model-wrapper',
  imports: [NgDiagramContextComponent, CustomModelExampleComponent],
  template: `
    <ng-diagram-context>
      <app-custom-model-example />
    </ng-diagram-context>
  `,
})
export class CustomModelWrapperComponent {}
