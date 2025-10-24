import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RendererService } from '../../services';

@Component({
  selector: 'ng-diagram-edge',
  standalone: true,
  template: '<ng-content />',
  styles: [
    `
      :host {
        position: absolute;
        user-select: none;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.visibility]': 'isVisible() ? null : "hidden"',
  },
})
export class NgDiagramEdgeComponent {
  private readonly renderer = inject(RendererService);

  readonly isVisible = this.renderer.isInitialized;
}
