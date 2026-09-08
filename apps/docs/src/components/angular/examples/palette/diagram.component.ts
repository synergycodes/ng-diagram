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
    <palette-container [model]="paletteModel" />
    <div class="not-content diagram">
      <ng-diagram [model]="model" [config]="config">
        <ng-diagram-background />
      </ng-diagram>
    </div>
  `,
  styleUrls: ['./diagram.component.scss'],
})
export class DiagramComponent {
  paletteModel: NgDiagramPaletteItem[] = [
    {
      data: { label: 'Default Node' },
      resizable: true,
      rotatable: true,
      size: { width: 180, height: 45 },
      autoSize: false,
    },
    {
      data: { label: 'Default Group' },
      resizable: true,
      isGroup: true,
      size: { width: 200, height: 150 },
      autoSize: false,
    },
  ];

  config = {
    zoom: {
      zoomToFit: {
        onInit: true,
        padding: [150, 150, 150, 150],
      },
    },
  } satisfies NgDiagramConfig;

  model = initializeModel({
    nodes: [
      { id: '1', position: { x: 100, y: 150 }, data: { label: 'Node 1' } },
    ],
  });
}
