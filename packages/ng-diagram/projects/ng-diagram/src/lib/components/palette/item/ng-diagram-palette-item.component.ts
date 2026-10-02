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
   * Appends a scaled clone of the preview to document.body so that setDragImage
   * is immune to ancestor overflow:hidden clipping. The clone is removed on the next frame.
   */
  private setDragPreviewImage(event: DragEvent) {
    if (!event.dataTransfer) {
      return;
    }

    const clone = this.paletteItemPreviewComponent()?.createDragImage();
    if (!clone) {
      return;
    }

    document.body.appendChild(clone);

    try {
      event.dataTransfer.setDragImage(clone, 0, 0);
    } catch {
      // A wrapped or polyfilled DataTransfer may throw — the clone must not outlive the gesture.
      clone.remove();
      return;
    }

    // setDragImage captures the bitmap synchronously during dragstart, so the clone can go on the
    // next frame. dragend backstops the cleanup: rAF stays suspended while the tab is occluded.
    const removeClone = () => clone.remove();
    requestAnimationFrame(removeClone);
    event.target?.addEventListener('dragend', removeClone, { once: true });
  }
}
