import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import {
  NgDiagramPaletteItem,
  NgDiagramPaletteItemComponent,
  NgDiagramPaletteItemPreviewComponent,
  NgDiagramViewportService,
} from '@angularflow/angular-adapter';
import { PaletteItemPreviewComponent } from './palette-item-preview/palette-item-preview.component';
import { PaletteItemComponent } from './palette-item/palette-item.component';

@Component({
  selector: 'app-palette',
  templateUrl: './palette.component.html',
  styleUrls: ['./palette.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgDiagramPaletteItemComponent,
    NgDiagramPaletteItemPreviewComponent,
    PaletteItemComponent,
    PaletteItemPreviewComponent,
  ],
})
export class PaletteComponent {
  model = input.required<NgDiagramPaletteItem[]>();

  scale = inject(NgDiagramViewportService).scale;
}
