import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  NgDiagramPaletteItem,
  NgDiagramPaletteItemComponent,
  NgDiagramPaletteItemPreviewComponent,
} from '@angularflow/angular-adapter';
import { PaletteItemComponent } from './palette-item/palette-item.component';

@Component({
  selector: 'app-palette',
  templateUrl: './palette.component.html',
  styleUrls: ['./palette.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDiagramPaletteItemComponent, NgDiagramPaletteItemPreviewComponent, PaletteItemComponent],
})
export class PaletteComponent {
  model = input.required<NgDiagramPaletteItem[]>();
}
