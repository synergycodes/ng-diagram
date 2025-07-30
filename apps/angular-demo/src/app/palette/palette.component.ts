import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  NgDiagramPaletteItemComponent,
  NgDiagramPaletteItemPreviewComponent,
  PaletteItem,
} from '@angularflow/angular-adapter';
import { PaletteItemPreviewComponent } from './palette-item-preview/palette-item-preview.component';
import { PaletteItemComponent } from './palette-item/palette-item.component';

@Component({
  selector: 'app-palette',
  templateUrl: './palette.component.html',
  styleUrls: ['./palette.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PaletteItemComponent,
    PaletteItemPreviewComponent,
    NgDiagramPaletteItemComponent,
    NgDiagramPaletteItemPreviewComponent,
  ],
})
export class PaletteComponent {
  model = input.required<PaletteItem[]>();
}
