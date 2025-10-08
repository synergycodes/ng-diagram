import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  provideNgDiagram,
  type NgDiagramPaletteItem,
} from 'ng-diagram';
import { Palette } from './palette/palette.component';

@Component({
  imports: [NgDiagramComponent, Palette],
  providers: [provideNgDiagram()],
  template: `
    <div class="not-content diagram">
      <ng-diagram [model]="model" />
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

  model = initializeModel({
    metadata: {
      viewport: {
        x: 272,
        y: 65,
        scale: 1,
      },
    },
    nodes: [
      { id: '1', position: { x: 100, y: 150 }, data: { label: 'Node 1' } },
    ],
  });
}
