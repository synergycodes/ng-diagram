import { computed, Injectable, Signal, signal } from '@angular/core';
import { NgDiagramPanelPosition } from '../../types/panel-position';

/**
 * Interface for panel components that can register with the panel registry.
 * @internal
 */
export interface RegisterablePanel {
  position: Signal<NgDiagramPanelPosition>;
}

/**
 * Service that tracks registered panel components.
 * Used by other components (like watermark) to coordinate their positioning
 * and avoid overlapping with panels.
 * @internal
 */
@Injectable()
export class PanelRegistryService {
  private readonly panel = signal<RegisterablePanel | null>(null);

  position = computed(() => this.panel()?.position());

  register(component: RegisterablePanel): void {
    this.panel.set(component);
  }

  unregister(): void {
    this.panel.set(null);
  }
}
