import { Component, computed, input } from '@angular/core';
import type { NgDiagramPaletteItem } from 'ng-diagram';

@Component({
  selector: 'palette-item-preview',
  template: `
    <div
      class="preview"
      [class.group]="item().isGroup"
      [style.width.px]="item().size?.width"
      [style.height.px]="item().size?.height"
    >
      @if (!item().isGroup) {
        {{ nodeLabel() }}
      }
    </div>
  `,
  styles: `
    /* The same look and size as the node the item creates, so the drag image matches the drop. */
    .preview {
      display: flex;
      justify-content: center;
      align-items: center;
      box-sizing: border-box;
      padding: 0.5rem;
      background-color: var(--ngd-node-bg-primary-default);
      border: var(--ngd-node-border-size) solid var(--ngd-node-border-color);
      border-radius: var(--ngd-node-border-radius);
      color: var(--ngd-txt-primary-default);
    }

    .preview.group {
      padding: 0.625rem;
      border: 0.0625rem solid var(--ngd-group-border-color);
      border-radius: var(--ngd-group-border-radius);
    }
  `,
})
export class PaletteItemPreviewComponent {
  item = input.required<NgDiagramPaletteItem>();
  nodeLabel = computed(() => this.item()?.data?.['label'] ?? 'Unknown');
}
