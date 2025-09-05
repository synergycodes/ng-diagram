import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { NgDiagramPaletteItem } from '@angularflow/angular-adapter';

@Component({
  selector: 'palette-item',
  template: ` <div class="node-preview">{{ nodeLabel() }}</div> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .node-preview {
      display: flex;
      justify-content: center;
      background-color: var(--ngd-node-bg-primary-default);
      border: var(--ngd-node-border-size) solid var(--ngd-node-border-color);
      border-radius: 0.75rem;
      padding: 0.5rem;
      cursor: pointer;
    }
  `,
})
export class PaletteItemComponent {
  item = input.required<NgDiagramPaletteItem>();
  nodeLabel = computed(() => this.item()?.data?.['label'] ?? 'Unknown');
}
