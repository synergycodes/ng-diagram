import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PaletteItem } from '@angularflow/angular-adapter';
import { templateLabels } from '../../data/node-template';

@Component({
  selector: 'app-palette-item',
  templateUrl: './palette-item.component.html',
  styleUrls: ['./palette-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaletteItemComponent {
  node = input.required<PaletteItem>();
  nodeLabel = computed(() => templateLabels.get(this.node()?.type) ?? 'Unknown');
}
