import { computed, Injectable, signal } from '@angular/core';
import type { NgDiagramMinimapComponent } from '../../components/minimap/ng-diagram-minimap.component';

/**
 * Service that provides access to the registered minimap component.
 * Used by other components (like watermark) to coordinate their positioning.
 */
@Injectable()
export class MinimapProviderService {
  private readonly minimap = signal<NgDiagramMinimapComponent | null>(null);

  position = computed(() => this.minimap()?.position());

  register(component: NgDiagramMinimapComponent): void {
    this.minimap.set(component);
  }

  unregister(): void {
    this.minimap.set(null);
  }
}
