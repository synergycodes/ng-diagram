import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgDiagramPaletteItem } from 'ng-diagram';

@Component({
  selector: 'app-palette-item',
  templateUrl: './palette-item.component.html',
  styleUrls: ['./palette-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaletteItemComponent {
  item = input.required<NgDiagramPaletteItem>();
  nodeLabel = computed(() => this.item()?.data?.label ?? 'Unknown');
}
