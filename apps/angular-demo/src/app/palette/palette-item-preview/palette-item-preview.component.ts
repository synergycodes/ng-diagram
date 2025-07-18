import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PaletteItem } from '@angularflow/angular-adapter';
import { nodeTemplateMap } from '../../data/node-template';

@Component({
  selector: 'app-palette-item-preview',
  templateUrl: './palette-item-preview.component.html',
  imports: [NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaletteItemPreviewComponent {
  node = input.required<PaletteItem>();
  componentType = computed(() => nodeTemplateMap.get(this.node().type));
}
