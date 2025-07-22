import { ChangeDetectionStrategy, Component, contentChild, inject, input } from '@angular/core';
import { PaletteService } from '../../../services';
import { PaletteItem } from '../../../types';
import { NgDiagramPaletteItemPreviewComponent } from '../ng-diagram-palette-item-preview/ng-diagram-palette-item-preview.component';

@Component({
  selector: 'angular-adapter-palette-item',
  templateUrl: './ng-diagram-palette-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgDiagramPaletteItemComponent {
  private paletteService = inject(PaletteService);
  private paletteItemPreviewComponent = contentChild(NgDiagramPaletteItemPreviewComponent);

  item = input.required<PaletteItem>();

  onDragStart(event: DragEvent) {
    const previewHtmlElement = this.paletteItemPreviewComponent()?.preview();
    if (previewHtmlElement && previewHtmlElement.nativeElement) {
      event.dataTransfer?.setDragImage(previewHtmlElement.nativeElement, 0, 0);
    }
    this.paletteService.onDragStartFromPalette(event, this.item());
  }

  onMouseDown() {
    this.paletteService.onMouseDown(this.item());
  }
}
