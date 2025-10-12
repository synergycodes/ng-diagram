import '@angular/compiler';
import { Component } from '@angular/core';
import { provideNgDiagram } from 'ng-diagram';
import { DiagramComponent } from './diagram.component';

@Component({
  imports: [DiagramComponent],
  providers: [provideNgDiagram()],
  template: `<diagram />`,
})
export class DiagramWrapperComponent {}
