import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { Side } from '../../../../../core/src';
import { ResizeDirective } from '../../../../directives/input-events/resize/resize.directive';

@Component({
  selector: 'ng-diagram-resize-line',
  standalone: true,
  template: '',
  styleUrl: './ng-diagram-resize-line.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: ResizeDirective, inputs: ['direction: position', 'targetData'] }],
  host: {
    '[class]': 'classes()',
  },
})
export class NgDiagramResizeLineComponent {
  position = input.required<Side>();
  active = input<boolean>(true);
  classes = computed(
    () => `resize-line resize-line--${this.position()}${this.active() ? '' : ' resize-line--inactive'}`
  );
}
