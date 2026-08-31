import { ChangeDetectionStrategy, Component, type ElementRef, inject, type Signal, viewChild } from '@angular/core';
import { NgDiagramViewportService } from '../../../public-services/ng-diagram-viewport.service';
import { EnvironmentProviderService } from '../../../services/environment-provider/environment-provider.service';

/**
 * The `NgDiagramPaletteItemPreviewComponent` defines the preview of a palette item shown while it is
 * dragged onto the canvas.
 *
 * ## Example usage
 * ```html
 * <ng-diagram-palette-item-preview>
 *   <!-- Palette item content here -->
 * </ng-diagram-palette-item-preview>
 * ```
 *
 * @public
 * @since 0.8.0
 * @category Components
 */
@Component({
  selector: 'ng-diagram-palette-item-preview',
  standalone: true,
  templateUrl: './ng-diagram-palette-item-preview.component.html',
  styleUrl: './ng-diagram-palette-item-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgDiagramPaletteItemPreviewComponent {
  private environment = inject(EnvironmentProviderService);
  private scale = inject(NgDiagramViewportService).scale;

  readonly id = this.environment.generateId();
  readonly preview: Signal<ElementRef<HTMLElement> | undefined> = viewChild('preview');

  protected readonly isSafari = this.environment.browser === 'Safari';

  /**
   * Returns a detached clone of the preview content scaled to the current viewport zoom, ready for
   * `DataTransfer.setDragImage`. The content must stay rendered (never gated by an `@if`) because the
   * clone is taken at `dragstart`.
   *
   * @internal
   */
  createDragImage(): HTMLElement | null {
    const previewElement = this.preview()?.nativeElement;
    if (!previewElement) {
      return null;
    }

    const clone = previewElement.cloneNode(true) as HTMLElement;
    clone.classList.add('dragged-node');
    clone.style.position = 'fixed';

    // The parked preview is kept at natural size, so the zoom is applied to the clone only.
    // Safari scales through `zoom` on the outer element, other browsers through `transform` on the
    // inner one — each branch styles the element the template marked as `dragged-node`.
    const scale = String(this.scale());
    if (this.isSafari) {
      clone.style.zoom = scale;
    } else {
      const inner = clone.firstElementChild as HTMLElement | null;
      if (inner) {
        inner.style.transform = `scale(${scale})`;
        inner.style.transformOrigin = 'top left';
      }
    }

    return clone;
  }
}
