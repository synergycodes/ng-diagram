import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  Signal,
  viewChild,
} from '@angular/core';
import { FlowCoreProviderService, PaletteService } from '../../../services';
import { detectEnvironment } from '../../../utils/detect-environment';

@Component({
  selector: 'ng-diagram-palette-item-preview',
  templateUrl: './ng-diagram-palette-item-preview.component.html',
  styleUrl: './ng-diagram-palette-item-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgDiagramPaletteItemPreviewComponent {
  private flowCoreProvider = inject(FlowCoreProviderService);
  private paletteService = inject(PaletteService);

  private browser = detectEnvironment().browser;

  isSafari = this.browser === 'Safari';
  isChrome = this.browser === 'Chrome';

  preview: Signal<ElementRef<HTMLElement> | undefined> = viewChild('preview');

  type = input.required<string>();

  isVisible = computed(() => (this.paletteService.draggedNode()?.type || '') === this.type());

  scale = computed(() => this.flowCoreProvider.provide().getScale());
}
