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

/**
 * The `NgDiagramPaletteItemPreviewComponent` is responsible for rendering a live preview of a palette item
 * when it is being dragged or hovered in the palette.
 *
 * ## Example usage
 * ```html
 * <ng-diagram-palette-item-preview>
 *   <!-- Palette item content here -->
 * </ng-diagram-palette-item-preview>
 * ```
 *
 * @category Components
 */ @Component({
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

  readonly id = this.environment.generateId();
  readonly preview: Signal<ElementRef<HTMLElement> | undefined> = viewChild('preview');

  protected readonly scale = inject(NgDiagramViewportService).scale;
  protected readonly isSafari = this.browser === 'Safari';
  protected readonly isChrome = this.browser === 'Chrome';

  protected readonly isVisible = computed(() => this.paletteService.previewId() === this.id);

  get scaleTransform(): string {
    return `scale(${this.scale()})`;
  }
}
