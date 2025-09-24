import '@angular/compiler';
import { Component } from '@angular/core';
import { NgDiagramModelService, provideNgDiagram } from 'ng-diagram';
import { SaveStateExampleComponent } from './save-example.component';
import { SaveStateService } from './save.service';

@Component({
  selector: 'save-state-wrapper',
  imports: [SaveStateExampleComponent],
  template: ` <save-state-example></save-state-example> `,
  styles: [
    `
      :host {
        flex: 1;
        display: flex;
        position: relative;
        flex-direction: column;
      }
    `,
  ],
  providers: [NgDiagramModelService, SaveStateService, provideNgDiagram()],
})
export class SaveStateWrapperComponent {}
