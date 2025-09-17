import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ResizeDirective } from '../../../../directives/input-events/resize/resize.directive';
import { LinePosition } from '../ng-diagram-node-resize-adornment.types';

@Component({
  selector: 'ng-diagram-resize-line',
  template: '',
  styleUrl: './ng-diagram-resize-line.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: ResizeDirective, inputs: ['direction: position', 'targetData'] }],
  host: {
    '[class]': 'classes()',
  },
})
export class NgDiagramResizeLineComponent {
  position = input.required<LinePosition>();
  classes = computed(() => `resize-line resize-line--${this.position()}`);
}
