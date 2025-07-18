import { ChangeDetectionStrategy, Component, contentChild, inject, input } from '@angular/core';
import { PaletteService } from '../../../services';
import { PaletteNode } from '../../../types';
import { NgDiagramPaletteItemPreviewComponent } from '../ng-diagram-palette-item-preview/ng-diagram-palette-item-preview.component';

@Component({
  selector: 'angular-adapter-palette-item',
  templateUrl: './ng-diagram-palette-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgDiagramPaletteItemComponent {
  private paletteService = inject(PaletteService);
  private paletteItemPreviewComponent = contentChild(NgDiagramPaletteItemPreviewComponent);

  node = input.required<PaletteNode>();

  onDragStart(event: DragEvent) {
    const previewHtmlElement = this.paletteItemPreviewComponent()?.preview();
    if (previewHtmlElement && previewHtmlElement.nativeElement) {
      event.dataTransfer?.setDragImage(previewHtmlElement.nativeElement, 0, 0);
    }
    this.paletteService.onDragStartFromPalette(event, this.node());
  }

  onMouseDown() {
    this.paletteService.onMouseDown(this.node());
  }
}
