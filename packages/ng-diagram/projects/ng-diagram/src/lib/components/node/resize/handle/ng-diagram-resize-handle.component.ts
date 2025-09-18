import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ResizeDirective } from '../../../../directives/input-events/resize/resize.directive';
import { HandlePosition } from '../ng-diagram-node-resize-adornment.types';

@Component({
  selector: 'ng-diagram-resize-handle',
  template: '',
  styleUrl: './ng-diagram-resize-handle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: ResizeDirective, inputs: ['direction: position', 'targetData'] }],
  host: {
    '[class]': 'classes()',
  },
})
export class NgDiagramResizeHandleComponent {
  position = input.required<HandlePosition>();
  classes = computed(() => `resize-handle resize-handle--${this.position()}`);
}
