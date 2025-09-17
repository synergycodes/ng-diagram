import '@angular/compiler';
import { Component } from '@angular/core';
import { NgDiagramContextComponent, NgDiagramModelService } from 'ng-diagram';
import { SaveStateExampleComponent } from './save-example.component';
import { SaveStateService } from './save.service';

@Component({
  selector: 'save-state-wrapper',
  imports: [NgDiagramContextComponent, SaveStateExampleComponent],
  template: `
    <ng-diagram-context>
      <save-state-example></save-state-example>
    </ng-diagram-context>
  `,
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
  providers: [NgDiagramModelService, SaveStateService],
})
export class SaveStateWrapperComponent {}
