import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ViewportDirective } from '../../directives';
import { RendererService } from '../../services/renderer/renderer.service';

@Component({
  selector: 'ng-diagram-canvas',
  standalone: true,
  templateUrl: './ng-diagram-canvas.component.html',
  styleUrl: './ng-diagram-canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: ViewportDirective, inputs: ['viewport'] }],
  host: {
    '[style.visibility]': 'isVisible() ? null : "hidden"',
  },
})
export class NgDiagramCanvasComponent {
  readonly renderer = inject(RendererService);
  readonly isVisible = this.renderer.isInitialized;
}
