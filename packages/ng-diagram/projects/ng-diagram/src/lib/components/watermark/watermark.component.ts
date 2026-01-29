import { Component, computed, inject } from '@angular/core';
import { PanelRegistryService } from '../../services/panel-registry/panel-registry.service';
import { NgDiagramPanelPosition } from '../../types/panel-position';

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
  private readonly DEFAULT_POSITION: NgDiagramPanelPosition = 'bottom-right';
  private readonly ALTERNATIVE_POSITION: NgDiagramPanelPosition = 'top-right';

  private readonly panelRegistry = inject(PanelRegistryService);

  /**
   * Computes the watermark position based on panel position.
   * If panel is at the same position, watermark moves to avoid overlap.
   */
  position = computed<NgDiagramPanelPosition>(() => {
    if (this.panelRegistry.position() === this.DEFAULT_POSITION) {
      return this.ALTERNATIVE_POSITION;
    }

    return this.DEFAULT_POSITION;
  });
}
