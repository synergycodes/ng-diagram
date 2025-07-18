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

@Component({
  selector: 'angular-adapter-palette-item-preview',
  templateUrl: './ng-diagram-palette-item-preview.component.html',
  styleUrl: './ng-diagram-palette-item-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgDiagramPaletteItemPreviewComponent {
  private flowCoreProvider = inject(FlowCoreProviderService);
  private paletteService = inject(PaletteService);

  private flowCore = this.flowCoreProvider.provide();
  private browser = this.flowCore.getEnvironment().browser;

  isSafari = this.browser === 'Safari';
  isChrome = this.browser === 'Chrome';

  preview: Signal<ElementRef<HTMLElement> | undefined> = viewChild('preview');

  type = input.required<string>();

  isVisible = computed(() => this.paletteService.draggedNode()?.type === this.type());

  scale = computed(() => this.flowCore.getScale());
}
