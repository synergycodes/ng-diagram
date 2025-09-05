import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, Signal, viewChild } from '@angular/core';
import { NgDiagramViewportService } from '../../../public-services/ng-diagram-viewport.service';
import { PaletteService } from '../../../services';
import { detectEnvironment } from '../../../utils/detect-environment';

@Component({
  selector: 'ng-diagram-palette-item-preview',
  templateUrl: './ng-diagram-palette-item-preview.component.html',
  styleUrl: './ng-diagram-palette-item-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgDiagramPaletteItemPreviewComponent {
  private paletteService = inject(PaletteService);
  private browser = detectEnvironment().browser;

  id = crypto.randomUUID();

  scale = inject(NgDiagramViewportService).getScale();

  isSafari = this.browser === 'Safari';
  isChrome = this.browser === 'Chrome';

  preview: Signal<ElementRef<HTMLElement> | undefined> = viewChild('preview');

  isVisible = computed(() => this.paletteService.previewId() === this.id);
}
