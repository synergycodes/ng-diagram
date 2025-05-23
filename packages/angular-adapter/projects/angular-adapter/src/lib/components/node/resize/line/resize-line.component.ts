import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { LinePosition } from '../node-resize-adornment.types';

@Component({
  selector: 'angular-adapter-resize-line',
  template: '',
  styleUrl: './resize-line.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[style]': 'styles()',
    '(pointerdown)': 'pointerEvent.emit({ event: $event, position: position() })',
    '(pointerup)': 'pointerEvent.emit({ event: $event, position: position() })',
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
  pointerEvent = output<{ event: PointerEvent; position: LinePosition }>();
}
