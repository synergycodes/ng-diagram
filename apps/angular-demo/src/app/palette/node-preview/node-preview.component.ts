import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PaletteNode } from '@angularflow/angular-adapter';
import { templateLabels } from '../../data/node-template';

@Component({
  selector: 'app-node-preview',
  templateUrl: './node-preview.component.html',
  styleUrls: ['./node-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodePreviewComponent {
  node = input.required<PaletteNode>();
  nodeLabel = computed(() => templateLabels.get(this.node()?.type) ?? 'Unknown');
}
