import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import {
  NgDiagramPaletteItem,
  NgDiagramPaletteItemComponent,
  NgDiagramPaletteItemPreviewComponent,
  NgDiagramService,
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
  private readonly ngDiagramService = inject(NgDiagramService);

  scale = computed(() => this.ngDiagramService.getScale());

  model = input.required<NgDiagramPaletteItem[]>();
}
