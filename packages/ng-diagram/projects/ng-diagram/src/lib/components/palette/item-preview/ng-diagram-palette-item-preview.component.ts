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

  /**
   * @deprecated The drag image is scaled internally, so this value is no longer used. It will be
   * removed in the next major version.
   */
  get scaleTransform(): string {
    return `scale(${this.scale()})`;
  }

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
    clone.style.position = 'fixed';
    // `zoom` is layout-affecting, so the clone's own box grows with the scaled content. setDragImage
    // rasterizes the element it is handed, and a `transform` would leave that box at natural size
    // while painting outside it. Scaling `left: -1000px` too keeps the clone off-screen at any zoom.
    clone.style.zoom = String(this.scale());

    return clone;
  }
}
