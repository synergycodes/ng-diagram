import '@angular/compiler';
import { Component, inject, Injector } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  NgDiagramModelService,
  provideNgDiagram,
  type Model,
  type NgDiagramConfig,
} from 'ng-diagram';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { SaveStateService } from './save.service';

@Component({
  imports: [NgDiagramComponent, NavBarComponent],
  template: `
    <nav-bar (loadModel)="loadModel($event)"></nav-bar>
    <div class="not-content diagram">
      <ng-diagram [model]="model" [config]="config" />
    </div>
  `,
  styleUrl: './diagram.component.scss',
  providers: [NgDiagramModelService, SaveStateService, provideNgDiagram()],
})
export class DiagramComponent {
  private injector = inject(Injector);
  config = {
    zoom: {
      max: 3,
      zoomToFit: {
        onInit: true,
        padding: 75,
      },
    },
  } satisfies NgDiagramConfig;

  model = initializeModel({
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
  });

  loadModel(model: Partial<Model>): void {
    this.model = initializeModel(model, this.injector);
  }
}
