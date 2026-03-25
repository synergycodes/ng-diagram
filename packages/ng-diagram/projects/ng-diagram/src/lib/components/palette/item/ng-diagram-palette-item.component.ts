import { ChangeDetectionStrategy, Component, contentChild, inject, input, ViewEncapsulation } from '@angular/core';
import { PaletteService } from '../../../services';
import { NgDiagramPaletteItem } from '../../../types';
import { NgDiagramPaletteItemPreviewComponent } from '../item-preview/ng-diagram-palette-item-preview.component';

/**
 * The `NgDiagramPaletteItemComponent` represents a single item in the diagram palette.
 *
 * ## Example usage
 * ```html
 * <ng-diagram-palette-item [item]="item">
 *   <!-- Palette item content here -->
 *   <ng-diagram-palette-item-preview>
 *     <!-- Optional: custom preview content -->
 *   </ng-diagram-palette-item-preview>
 * </ng-diagram-palette-item>
 * ```
 *
 * @public
 * @since 0.8.0
 * @category Components
 */
@Component({
  selector: 'ng-diagram-palette-item',
  standalone: true,
  templateUrl: './ng-diagram-palette-item.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: `width: 100%;`,
  },
})
export class NgDiagramPaletteItemComponent {
  private paletteService = inject(PaletteService);
  private paletteItemPreviewComponent = contentChild(NgDiagramPaletteItemPreviewComponent);

  /**
   * The palette item data to be rendered and managed.
   */
  item = input.required<NgDiagramPaletteItem>();

  /** @internal */
  onDragStart(event: DragEvent) {
    this.setDragPreviewImage(event);
    this.paletteService.onDragStartFromPalette(event, this.item());
  }

  /** @internal */
  onMouseDown() {
    this.paletteService.onMouseDown(this.item(), this.paletteItemPreviewComponent()?.id || '');
  }

  /** @internal */
  onTouchStart(event: TouchEvent) {
    event.preventDefault();
    this.paletteService.onMouseDown(this.item(), this.paletteItemPreviewComponent()?.id || '');
  }

  /**
   * Clones the preview element and appends it to document.body so that setDragImage
   * is immune to ancestor overflow:hidden clipping. The clone is removed on the next frame.
   */
  private setDragPreviewImage(event: DragEvent) {
    const previewHtmlElement = this.paletteItemPreviewComponent()?.preview();
    if (!previewHtmlElement?.nativeElement || !event.dataTransfer) {
      return;
    }

    const clone = previewHtmlElement.nativeElement.cloneNode(true) as HTMLElement;
    clone.classList.add('dragged-node');
    clone.style.position = 'fixed';

    document.body.appendChild(clone);

    event.dataTransfer.setDragImage(clone, 0, 0);

    // Clean up the temporary clone. This is safe because setDragImage captures the bitmap
    // synchronously during dragstart — the browser already has the image before the next frame.
    requestAnimationFrame(() => clone.remove());
  }
}
