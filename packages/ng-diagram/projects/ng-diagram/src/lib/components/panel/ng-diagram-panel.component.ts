import { AfterViewInit, ChangeDetectionStrategy, Component, inject, input, OnDestroy } from '@angular/core';
import { PanelRegistryService } from '../../services/panel-registry/panel-registry.service';
import { NgDiagramPanelPosition } from '../../types/panel-position';

/**
 * A generic panel container component that registers itself with the panel registry.
 * Used internally to wrap overlay content and coordinate positioning with other components.
 * @internal
 */
@Component({
  selector: 'ng-diagram-panel',
  standalone: true,
  template: '<ng-content></ng-content>',
  styleUrls: ['./ng-diagram-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'position()',
  },
})
export class NgDiagramPanelComponent implements AfterViewInit, OnDestroy {
  private readonly panelRegistry = inject(PanelRegistryService);

  /** Position of the panel within the diagram container. */
  position = input<NgDiagramPanelPosition>('bottom-right');

  ngAfterViewInit(): void {
    this.panelRegistry?.register(this);
  }

  ngOnDestroy(): void {
    this.panelRegistry?.unregister();
  }
}
