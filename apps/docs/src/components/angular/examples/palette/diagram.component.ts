import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  provideNgDiagram,
  type NgDiagramConfig,
  type NgDiagramPaletteItem,
} from 'ng-diagram';
import { Palette } from './palette/palette.component';

@Component({
  imports: [NgDiagramComponent, NgDiagramBackgroundComponent, Palette],
  providers: [provideNgDiagram()],
  template: `
    <div class="not-content diagram">
      <ng-diagram [model]="model" [config]="config">
        <ng-diagram-background />
      </ng-diagram>
    </div>
    <palette-container [model]="paletteModel" />
  `,
  styleUrls: ['./diagram.component.scss'],
})
export class DiagramComponent {
  paletteModel: NgDiagramPaletteItem[] = [
    { data: { label: 'Default Node' }, resizable: true, rotatable: true },
    { data: { label: 'Default Group' }, resizable: true, isGroup: true },
  ];

  config = {
    zoom: {
      zoomToFit: {
        onInit: true,
        padding: [150, 150, 150, 265],
      },
    },
  } satisfies NgDiagramConfig;

  model = initializeModel({
    nodes: [
      { id: '1', position: { x: 100, y: 150 }, data: { label: 'Node 1' } },
    ],
  });
}
