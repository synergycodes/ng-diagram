import { ChangeDetectionStrategy, Component, computed, inject, input, Input } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { PaletteInteractionService, PaletteNode } from '@angularflow/angular-adapter';
import { templateLabels } from '../../data/node-template';

@Component({
  selector: 'app-node-preview',
  templateUrl: './node-preview.component.html',
  styleUrls: ['./node-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodePreviewComponent {
  private readonly paletteInteractionService = inject(PaletteInteractionService);
  template = input.required<any>();
  node = input.required<PaletteNode>();

  nodeLabel = computed(() => templateLabels.get(this.node()?.type) ?? 'Unknown');

  onDragStart(event: DragEvent) {
    this.paletteInteractionService.onDragStartFromPalette(event, this.node());
  }
}
