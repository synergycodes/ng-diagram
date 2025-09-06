import '@angular/compiler';

import { Component, input } from '@angular/core';
import {
  NgDiagramPaletteItemComponent,
  NgDiagramPaletteItemPreviewComponent,
  type NgDiagramPaletteItem,
} from '@angularflow/angular-adapter';
import { PaletteItemComponent } from './palette-item.component';

@Component({
  selector: 'palette-container',
  templateUrl: `./palette.component.html`,
  styleUrl: './palette.component.scss',
  imports: [
    NgDiagramPaletteItemComponent,
    NgDiagramPaletteItemPreviewComponent,
    PaletteItemComponent,
  ],
})
export class Palette {
  model = input.required<NgDiagramPaletteItem[]>();
}
