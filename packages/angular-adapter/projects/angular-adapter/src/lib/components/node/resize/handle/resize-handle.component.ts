import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ResizeDirective } from '../../../../directives/input-events/resize/resize.directive';
import { HandlePosition } from '../node-resize-adornment.types';

@Component({
  selector: 'angular-adapter-resize-handle',
  template: '',
  styleUrl: './resize-handle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: ResizeDirective, inputs: ['direction: position', 'targetData'] }],
  host: {
    '[class]': 'classes()',
  },
})
export class ResizeHandleComponent {
  position = input.required<HandlePosition>();
  classes = computed(() => `resize-handle resize-handle--${this.position()}`);
}
