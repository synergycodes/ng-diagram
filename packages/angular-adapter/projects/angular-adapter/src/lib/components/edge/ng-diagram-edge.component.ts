import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ng-diagram-edge',
  template: '<ng-content />',
  styles: [
    `
      :host {
        position: absolute;
        user-select: none;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgDiagramEdgeComponent {}
