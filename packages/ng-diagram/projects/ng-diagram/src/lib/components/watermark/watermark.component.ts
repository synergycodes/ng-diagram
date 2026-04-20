import { Component, computed, inject, input } from '@angular/core';
import { PanelRegistryService } from '../../services/panel-registry/panel-registry.service';
import { NgDiagramPanelPosition } from '../../types/panel-position';

/**
 * For each position, defines fallback positions in priority order:
 * flip vertical (same side) → flip horizontal → diagonal.
 */
const FALLBACKS: Record<NgDiagramPanelPosition, NgDiagramPanelPosition[]> = {
  'bottom-right': ['top-right', 'bottom-left', 'top-left'],
  'top-right': ['bottom-right', 'top-left', 'bottom-left'],
  'bottom-left': ['top-left', 'bottom-right', 'top-right'],
  'top-left': ['bottom-left', 'top-right', 'bottom-right'],
};

@Component({
  selector: 'ng-diagram-watermark',
  standalone: true,
  templateUrl: './watermark.component.html',
  styleUrls: ['./watermark.component.scss'],
  host: {
    '[class]': 'position()',
  },
})
export class NgDiagramWatermarkComponent {
  readonly preferredPosition = input<NgDiagramPanelPosition | undefined>(undefined);

  private readonly panelRegistry = inject(PanelRegistryService);

  /**
   * Computes the watermark position based on preferred position and panel collision.
   * If the preferred position collides with a registered panel, the watermark
   * shifts to the nearest available corner.
   */
  position = computed<NgDiagramPanelPosition>(() => {
    const preferred = this.preferredPosition() ?? 'bottom-right';
    const panelPosition = this.panelRegistry.position();

    if (panelPosition !== preferred) {
      return preferred;
    }

    return FALLBACKS[preferred].find((fallback) => fallback !== panelPosition) ?? preferred;
  });
}
