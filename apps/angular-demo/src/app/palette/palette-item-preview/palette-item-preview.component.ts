import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgDiagramPaletteItem } from 'ng-diagram';
import { nodeTemplateMap } from '../../data/node-template';
import { PaletteItemComponent } from '../palette-item/palette-item.component';

@Component({
  selector: 'app-palette-item-preview',
  standalone: true,
  templateUrl: './palette-item-preview.component.html',
  imports: [NgComponentOutlet, PaletteItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaletteItemPreviewComponent {
  item = input.required<NgDiagramPaletteItem>();
  componentType = computed(() => nodeTemplateMap.get(this.item().type || ''));
}
