import '@angular/compiler';
import { Component } from '@angular/core';
import { provideNgDiagram } from 'ng-diagram';
import { DiagramComponent } from './diagram.component';

/**
 * Wrapper component that provides the ng-diagram-context
 */
@Component({
  imports: [DiagramComponent],
  providers: [provideNgDiagram()],
  template: ` <diagram /> `,
  styleUrl: './diagram-wrapper.component.scss',
})
export class DiagramWrapperComponent {}
