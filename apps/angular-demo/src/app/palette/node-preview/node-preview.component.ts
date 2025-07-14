import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { PaletteInteractionService } from '@angularflow/angular-adapter';

@Component({
  selector: 'app-node-preview',
  templateUrl: './node-preview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet],
})
export class NodePreviewComponent {
  private readonly paletteInteractionService = inject(PaletteInteractionService);
  @Input() template!: any;
  @Input() node!: any;

  onDragStart(event: DragEvent) {
    this.paletteInteractionService.onDragStartFromPalette(event, this.node);
  }
}
