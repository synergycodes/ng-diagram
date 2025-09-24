import '@angular/compiler';
import { Component } from '@angular/core';
import { provideNgDiagram } from 'ng-diagram';
import { CustomModelExampleComponent } from './custom-model-example.component';

@Component({
  selector: 'custom-model-wrapper',
  imports: [CustomModelExampleComponent],
  providers: [provideNgDiagram()],
  template: ` <app-custom-model-example /> `,
})
export class CustomModelWrapperComponent {}
