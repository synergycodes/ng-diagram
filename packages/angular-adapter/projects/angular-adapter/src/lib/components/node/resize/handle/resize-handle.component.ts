import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { HandlePosition } from '../node-resize-adornment.types';

@Component({
  selector: 'angular-adapter-resize-handle',
  template: '',
  styleUrl: './resize-handle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[style]': 'styles()',
    '(pointerdown)': 'pointerEvent.emit({ event: $event, position: position() })',
    '(pointerup)': 'pointerEvent.emit({ event: $event, position: position() })',
  },
})
export class ResizeHandleComponent {
  position = input.required<HandlePosition>();
  size = input.required<number>();
  strokeWidth = input.required<number>();
  color = input.required<string>();
  backgroundColor = input.required<string>();
  classes = computed(() => `resize-handle resize-handle--${this.position()}`);
  styles = computed(() => ({
    width: `${this.size()}px`,
    height: `${this.size()}px`,
    backgroundColor: this.backgroundColor(),
    borderColor: this.color(),
    borderWidth: `${this.strokeWidth()}px`,
  }));

  pointerEvent = output<{ event: PointerEvent; position: HandlePosition }>();
}
