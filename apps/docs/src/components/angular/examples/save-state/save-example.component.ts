import '@angular/compiler';
import { Component, inject, Injector } from '@angular/core';
import {
  NgDiagramComponent,
  NgDiagramModelService,
  type NgDiagramConfig,
} from '@angularflow/angular-adapter';
import { createSignalModel } from '@angularflow/angular-signals-model';
import { NavBarComponent } from './nav-bar/nav-bar.component';

@Component({
  selector: 'save-state-example',
  imports: [NgDiagramComponent, NavBarComponent],
  template: `
    <div>
      <nav-bar (loadModel)="loadModel($event)"></nav-bar>
      <div class="not-content diagram">
        <ng-diagram [model]="model" [config]="config" />
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        width: 100%;
        height: 100%;

        .diagram {
          flex: 1;
          display: flex;
          height: 20rem;
          font-family: 'Poppins', sans-serif;
        }
      }
    `,
  ],
  providers: [NgDiagramModelService],
})
export class SaveStateExampleComponent {
  private injector = inject(Injector);
  config = {
    zoom: {
      max: 3,
    },
  } satisfies NgDiagramConfig;

  model = createSignalModel({
    nodes: [
      {
        id: '1',
        position: { x: 100, y: 100 },
        data: {},
      },
      {
        id: '2',
        position: { x: 200, y: 150 },
        data: {},
      },
      {
        id: '3',
        position: { x: 300, y: 200 },
        data: {},
      },
    ],
    edges: [],
    metadata: { viewport: { x: 0, y: 0, scale: 1 } },
  });

  loadModel(model: any): void {
    this.model = createSignalModel(model, this.injector);
  }
}
