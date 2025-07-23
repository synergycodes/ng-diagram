import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ResizeDirective } from '../../../../directives/input-events/resize/resize.directive';
import { LinePosition } from '../node-resize-adornment.types';

@Component({
  selector: 'angular-adapter-resize-line',
  template: '',
  styleUrl: './resize-line.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: ResizeDirective, inputs: ['direction: position', 'targetData'] }],
  host: {
    '[class]': 'classes()',
  },
})
export class ResizeLineComponent {
  position = input.required<LinePosition>();
  classes = computed(() => `resize-line resize-line--${this.position()}`);
}
