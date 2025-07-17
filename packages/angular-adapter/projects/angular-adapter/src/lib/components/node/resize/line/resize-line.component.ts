import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ResizeDirective } from '../../../../directives/__new__input-events/resize/resize.directive';
import { LinePosition } from '../node-resize-adornment.types';

@Component({
  selector: 'angular-adapter-resize-line',
  template: '',
  styleUrl: './resize-line.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: ResizeDirective, inputs: ['direction: position', 'targetData'] }],
  host: {
    '[class]': 'classes()',
    '[style]': 'styles()',
  },
})
export class ResizeLineComponent {
  position = input.required<LinePosition>();
  strokeWidth = input.required<number>();
  color = input.required<string>();
  classes = computed(() => `resize-line resize-line--${this.position()}`);
  styles = computed(() => ({
    [`border-${this.position()}`]: `${this.strokeWidth()}px solid ${this.color()}`,
  }));
}
