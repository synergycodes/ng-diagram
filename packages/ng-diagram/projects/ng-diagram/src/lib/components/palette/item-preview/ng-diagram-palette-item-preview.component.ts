import {
  ChangeDetectionStrategy,
  Component,
  computed,
  type ElementRef,
  inject,
  type Signal,
  viewChild,
} from '@angular/core';
import { NgDiagramViewportService } from '../../../public-services/ng-diagram-viewport.service';
import { PaletteService } from '../../../services';
import { EnvironmentProviderService } from '../../../services/environment-provider/environment-provider.service';

// Rasterizing the drag image costs width x height x zoom^2 pixels synchronously inside dragstart,
// and browsers cap oversized drag bitmaps anyway — so the applied zoom stops growing here.
const MAX_DRAG_IMAGE_ZOOM = 3;

// CSS `zoom` is Baseline 2024 — Firefox supports it only from version 126.
function supportsCssZoom(): boolean {
  return typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('zoom', '2');
}

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
  private paletteService = inject(PaletteService);
  private environment = inject(EnvironmentProviderService);
  private browser = this.environment.browser;
  private viewportScale = inject(NgDiagramViewportService).scale;

  readonly id = this.environment.generateId();

  /**
   * The element holding the preview content. It is not rendered in the page flow, so read the
   * preview's natural size or content from it — its position is meaningless.
   */
  readonly preview: Signal<ElementRef<HTMLElement> | undefined> = viewChild('preview');

  /**
   * @deprecated The preview no longer branches per browser. It will be removed in the next major
   * version.
   */
  protected readonly isSafari = this.browser === 'Safari';

  /**
   * @deprecated The preview no longer branches per browser. It will be removed in the next major
   * version.
   */
  protected readonly isChrome = this.browser === 'Chrome';

  /**
   * @deprecated The viewport scale is applied internally when the drag image is built. It will be
   * removed in the next major version.
   */
  protected readonly scale = this.viewportScale;

  /**
   * @deprecated The preview content is always rendered (parked off-screen and clipped); visibility
   * no longer toggles. It will be removed in the next major version.
   */
  protected readonly isVisible = computed(() => this.paletteService.previewId() === this.id);

  /**
   * @deprecated The drag image is scaled internally, so this value is no longer used. It will be
   * removed in the next major version.
   */
  get scaleTransform(): string {
    return `scale(${this.viewportScale()})`;
  }

  /**
   * Returns a detached clone of the preview content scaled to the current viewport zoom (capped at
   * 3x), ready for `DataTransfer.setDragImage`. The content must stay rendered (never gated by an
   * `@if`) because the clone is taken at `dragstart`.
   *
   * @internal
   */
  createDragImage(): HTMLElement | null {
    const previewElement = this.preview()?.nativeElement;
    if (!previewElement) {
      return null;
    }

    const zoom = Math.min(this.viewportScale(), MAX_DRAG_IMAGE_ZOOM);
    const clone = previewElement.cloneNode(true) as HTMLElement;

    if (supportsCssZoom()) {
      clone.style.position = 'fixed';
      // Parked by geometry: the right edge sits on the viewport's left edge whatever the content
      // width, and `max-content` keeps wide content on its natural lines instead of wrapping.
      clone.style.left = 'auto';
      clone.style.right = '100vw';
      clone.style.width = 'max-content';
      // `zoom` is layout-affecting, so the clone's own box grows with the scaled content —
      // setDragImage rasterizes exactly that box. A `transform` would leave the box at natural size.
      clone.style.zoom = String(zoom);
      return clone;
    }

    // No CSS `zoom` (Firefox < 126): a wrapper sized to the scaled content gives setDragImage the
    // right box, and the transform paints the clone into it.
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.right = '100vw';
    wrapper.style.width = `${previewElement.offsetWidth * zoom}px`;
    wrapper.style.height = `${previewElement.offsetHeight * zoom}px`;
    wrapper.style.pointerEvents = 'none';
    clone.style.position = 'static';
    clone.style.left = 'auto';
    clone.style.width = 'max-content';
    clone.style.transform = `scale(${zoom})`;
    clone.style.transformOrigin = 'top left';
    wrapper.appendChild(clone);
    return wrapper;
  }
}
